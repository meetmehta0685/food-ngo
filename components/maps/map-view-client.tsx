"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { type InboundMessage, type PresenceMessage, Realtime } from "ably";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GeoJSONSource,
  Map as MapLibreMap,
  Marker,
  Popup,
  NavigationControl,
} from "maplibre-gl";

import { createOpenStreetMapStyle } from "@/components/maps/maplibre-config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isExpectedAblyClosure } from "@/lib/realtime/errors";
import { cn } from "@/lib/utils";

type MarkerPoint = {
  lat: number;
  lng: number;
  label: string;
};

type MapViewClientProps = {
  donor: MarkerPoint;
  ngo?: MarkerPoint | null;
  courier?: MarkerPoint | null;
  liveAssignmentId?: string | null;
  liveCourierLabel?: string;
  className?: string;
};

type LiveLocationPayload = {
  assignmentId?: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  heading?: number | null;
  rescueStatus?: string;
  serverTimestamp?: string;
};

type LiveConnectionState = "connecting" | "live" | "reconnecting" | "offline";

function getDesignToken(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || `var(${name})`;
}

function getMapLibreColor(name: string) {
  const token = getDesignToken(name);
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return "rgba(220,127,0,1)";
  }

  // MapLibre does not parse CSS Color 4 values such as lab() or oklch().
  // Let the browser resolve the design token, then pass MapLibre an rgba value.
  context.fillStyle = "#010203";
  context.fillStyle = token;

  if (context.fillStyle === "#010203") {
    return "rgba(220,127,0,1)";
  }

  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;

  return `rgba(${red},${green},${blue},${(alpha / 255).toFixed(3)})`;
}

function isValidCoordinate(lat: unknown, lng: unknown) {
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === "number" &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

export function MapViewClient({
  donor,
  ngo,
  courier,
  liveAssignmentId,
  liveCourierLabel = "Volunteer",
  className,
}: MapViewClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<{
    donor?: Marker;
    ngo?: Marker;
    courier?: Marker;
  }>({});
  const [mapReady, setMapReady] = useState(false);
  const [liveCourier, setLiveCourier] = useState<MarkerPoint | null>(null);
  const [liveHeading, setLiveHeading] = useState<number | null>(null);
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(null);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<LiveConnectionState>(liveAssignmentId ? "connecting" : "offline");
  const [volunteerOnline, setVolunteerOnline] = useState(false);
  const courierAnimationRef = useRef<number | null>(null);

  const displayedCourier = liveAssignmentId ? (liveCourier ?? courier) : courier;

  const center = useMemo<[number, number]>(
    () =>
      displayedCourier
        ? [displayedCourier.lng, displayedCourier.lat]
        : ngo
          ? [(donor.lng + ngo.lng) / 2, (donor.lat + ngo.lat) / 2]
          : [donor.lng, donor.lat],
    [displayedCourier, donor, ngo],
  );
  const initialCenterRef = useRef(center);

  useEffect(() => {
    if (!liveAssignmentId) {
      return;
    }

    let active = true;
    const realtime = new Realtime({
      authUrl: "/api/realtime/token",
      authMethod: "POST",
      echoMessages: false,
      logLevel: 0,
    });
    const channel = realtime.channels.get(`rescue:${liveAssignmentId}`);

    const onLocation = (message: InboundMessage) => {
      const payload = message.data as LiveLocationPayload | undefined;

      if (
        !active ||
        payload?.assignmentId !== liveAssignmentId ||
        !isValidCoordinate(payload.lat, payload.lng)
      ) {
        return;
      }

      setLiveCourier({
        lat: payload.lat as number,
        lng: payload.lng as number,
        label: liveCourierLabel,
      });
      setLiveHeading(
        typeof payload.heading === "number" ? payload.heading : null,
      );
      setLiveAccuracy(
        typeof payload.accuracy === "number" ? payload.accuracy : null,
      );
      setLastLiveUpdate(payload.serverTimestamp ?? new Date().toISOString());
      setConnectionState("live");
    };

    const onPresence = (message: PresenceMessage) => {
      const data = message.data as { role?: string } | undefined;

      if (data?.role !== "VOLUNTEER") {
        return;
      }

      setVolunteerOnline(message.action !== "leave" && message.action !== "absent");
    };

    void channel.subscribe("location:update", onLocation).catch((error) => {
      if (active && !isExpectedAblyClosure(error)) {
        console.error("Live rescue map subscription failed", error);
        setConnectionState("offline");
      }
    });
    void channel.presence.subscribe(onPresence).catch((error) => {
      if (active && !isExpectedAblyClosure(error)) {
        console.error("Volunteer presence subscription failed", error);
      }
    });
    void channel.presence.get().then((members) => {
      if (!active) {
        return;
      }

      setVolunteerOnline(
        members.some((member) => {
          const data = member.data as { role?: string } | undefined;
          return data?.role === "VOLUNTEER";
        }),
      );
    }).catch((error) => {
      if (active && !isExpectedAblyClosure(error)) {
        console.error("Volunteer presence lookup failed", error);
      }
    });

    realtime.connection.on("connected", () => {
      if (active) {
        setConnectionState("live");
      }
    });
    realtime.connection.on("disconnected", () => {
      if (active) {
        setConnectionState("reconnecting");
      }
    });
    realtime.connection.on("suspended", () => {
      if (active) {
        setConnectionState("reconnecting");
      }
    });
    realtime.connection.on("failed", (change) => {
      if (active && !isExpectedAblyClosure(change.reason)) {
        setConnectionState("offline");
        console.error("Live rescue map connection failed", change.reason);
      }
    });

    return () => {
      active = false;
      channel.unsubscribe("location:update", onLocation);
      channel.presence.unsubscribe(onPresence);
      realtime.close();
    };
  }, [liveAssignmentId, liveCourierLabel]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const map = new MapLibreMap({
      container: containerRef.current,
      center: initialCenterRef.current,
      zoom: 13,
      style: createOpenStreetMapStyle(),
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const handleLoad = () => {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      });
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        paint: {
          "line-color": getMapLibreColor("--primary"),
          "line-opacity": 0.85,
          "line-width": 4,
        },
      });
      setMapReady(true);
    };

    map.on("load", handleLoad);
    mapRef.current = map;

    return () => {
      map.off("load", handleLoad);
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return;
    }

    const points = { donor, ngo, courier: displayedCourier };

    (Object.keys(points) as (keyof typeof points)[]).forEach((key) => {
      const point = points[key];
      const existingMarker = markersRef.current[key];

      if (!point) {
        existingMarker?.remove();
        delete markersRef.current[key];
        return;
      }

      if (existingMarker) {
        if (key === "courier") {
          if (courierAnimationRef.current !== null) {
            window.cancelAnimationFrame(courierAnimationRef.current);
          }

          const start = existingMarker.getLngLat();
          const startedAt = performance.now();
          const animate = (now: number) => {
            const progress = Math.min(1, (now - startedAt) / 1200);
            const eased = 1 - (1 - progress) ** 3;
            existingMarker.setLngLat([
              start.lng + (point.lng - start.lng) * eased,
              start.lat + (point.lat - start.lat) * eased,
            ]);

            if (progress < 1) {
              courierAnimationRef.current = window.requestAnimationFrame(animate);
            } else {
              courierAnimationRef.current = null;
            }
          };
          courierAnimationRef.current = window.requestAnimationFrame(animate);

          if (liveHeading !== null) {
            existingMarker.setRotation(liveHeading);
          }
        } else {
          existingMarker.setLngLat([point.lng, point.lat]);
        }
        existingMarker.getPopup()?.setText(point.label);
        return;
      }

      const marker = new Marker({ color: getMapLibreColor("--primary") })
        .setLngLat([point.lng, point.lat])
        .setPopup(new Popup({ offset: 24 }).setText(point.label))
        .addTo(map);

      if (key === "courier" && liveHeading !== null) {
        marker.setRotation(liveHeading);
      }

      markersRef.current[key] = marker;
    });

    const routeCoordinates: [number, number][] = [];

    if (ngo) {
      routeCoordinates.push([ngo.lng, ngo.lat]);
    }

    routeCoordinates.push([donor.lng, donor.lat]);

    if (displayedCourier) {
      routeCoordinates.push([displayedCourier.lng, displayedCourier.lat]);
    }

    const routeSource = map.getSource("route") as GeoJSONSource;
    routeSource.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: routeCoordinates.length >= 2 ? routeCoordinates : [],
      },
    });

    map.easeTo({ center, duration: 500 });
  }, [center, displayedCourier, donor, liveHeading, mapReady, ngo]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        role="application"
        aria-label="Interactive rescue map"
        className={cn("h-80 w-full rounded-lg border", className)}
      />
      {liveAssignmentId ? (
        <Card
          data-testid="live-location-status"
          data-live-lat={displayedCourier?.lat ?? ""}
          data-live-lng={displayedCourier?.lng ?? ""}
          aria-live="polite"
          className="bg-background/95 absolute bottom-3 left-3 border-primary/30 p-0 text-[0.625rem] shadow-lg backdrop-blur"
        >
          <CardContent className="flex flex-col gap-1 p-3">
            <Badge
              variant="outline"
              className={cn(
                "w-fit",
                connectionState === "live"
                  ? "border-success/30 bg-success/10 text-success"
                  : connectionState === "offline"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-warning/30 bg-warning/10 text-warning-foreground",
              )}
            >
              {connectionState === "live"
                ? "Live map connected"
                : connectionState === "reconnecting"
                  ? "Live map reconnecting"
                  : connectionState === "connecting"
                    ? "Connecting live map"
                    : "Live map offline"}
            </Badge>
            <p className="text-muted-foreground">
              {volunteerOnline ? "Volunteer online" : "Waiting for volunteer signal"}
              {liveAccuracy !== null ? ` · ±${Math.round(liveAccuracy)} m` : ""}
              {lastLiveUpdate
                ? ` · updated ${new Date(lastLiveUpdate).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZone: "Asia/Kolkata",
                  })}`
                : ""}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
