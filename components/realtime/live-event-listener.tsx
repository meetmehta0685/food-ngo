"use client";

import { type InboundMessage, Realtime } from "ably";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { isExpectedAblyClosure } from "@/lib/realtime/errors";

type RealtimeEnvelope = {
  version?: number;
  eventId?: string;
  type?: string;
  payload?: unknown;
};

export function LiveEventListener({ userId }: { userId: string }) {
  const router = useRouter();
  const previousUnreadRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    let refreshTimer: number | undefined;
    const seenEventIds = new Set<string>();

    const scheduleRefresh = () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }

      refreshTimer = window.setTimeout(() => {
        if (active) {
          router.refresh();
        }
      }, 400);
    };

    const syncUpdates = async () => {
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { unread?: number };
        const unread = Number(payload.unread ?? 0);

        window.dispatchEvent(new CustomEvent("notifications:refresh"));

        if (
          previousUnreadRef.current !== null &&
          unread > previousUnreadRef.current
        ) {
          toast.info("New update", {
            description: "You have new notifications.",
          });
          scheduleRefresh();
        }

        previousUnreadRef.current = unread;
      } catch (error) {
        console.error("realtime recovery sync error", error);
      }
    };

    void syncUpdates();

    const realtime = new Realtime({
      authUrl: "/api/realtime/token",
      authMethod: "POST",
      clientId: userId,
      echoMessages: false,
      // Application handlers below report genuine failures. Suppress SDK logs for
      // expected React cleanup so Next's development overlay stays quiet.
      logLevel: 0,
    });
    const channel = realtime.channels.get(`user:${userId}`);

    const onMessage = (message: InboundMessage) => {
      const event = message.data as RealtimeEnvelope | undefined;
      const eventId = event?.eventId;

      if (eventId && seenEventIds.has(eventId)) {
        return;
      }

      if (eventId) {
        seenEventIds.add(eventId);

        if (seenEventIds.size > 250) {
          const oldest = seenEventIds.values().next().value;

          if (oldest) {
            seenEventIds.delete(oldest);
          }
        }
      }

      window.dispatchEvent(new CustomEvent("notifications:refresh"));

      if (event?.type === "NOTIFICATION_CREATED") {
        toast.info("New update", {
          description: "You have a new notification.",
        });
      }

      if (event?.type === "LOCATION_UPDATED") {
        return;
      }

      scheduleRefresh();
    };

    void channel.subscribe(onMessage).catch((error) => {
      // React Strict Mode mounts and immediately cleans up effects in development.
      // Closing a connection while attach is pending rejects with "Connection
      // closed"; that is an expected unmount, not a realtime failure.
      if (active && !isExpectedAblyClosure(error)) {
        console.error("Ably subscription failed", error);
      }
    });

    realtime.connection.on("connected", () => {
      // Re-fetch authoritative database state after initial connect or reconnect.
      void syncUpdates();
      scheduleRefresh();
    });

    realtime.connection.on("failed", (change) => {
      if (active && !isExpectedAblyClosure(change.reason)) {
        console.error("Ably connection failed", change.reason);
      }
    });

    // Slow polling remains as recovery if realtime is temporarily unavailable.
    const recoveryInterval = window.setInterval(() => {
      if (!active) {
        return;
      }

      void syncUpdates();
      scheduleRefresh();
    }, 60000);

    return () => {
      active = false;
      window.clearInterval(recoveryInterval);

      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }

      channel.unsubscribe(onMessage);
      realtime.close();
    };
  }, [router, userId]);

  return null;
}
