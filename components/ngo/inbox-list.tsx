"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Package, User } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type InboxCandidate = {
  id: string;
  distanceKm: number;
  rank: number;
  donation: {
    id: string;
    foodType: string;
    quantity: string;
    servesCount: number;
    address: string;
    pickupBy: string;
    donor: {
      name: string;
    };
  };
};

export function NgoInboxList({ candidates }: { candidates: InboxCandidate[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const respond = async (
    candidateId: string,
    decision: "ACCEPT" | "DECLINE",
  ) => {
    setPendingId(candidateId);

    const response = await fetch(`/api/matches/${candidateId}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ decision }),
    });

    setPendingId(null);

    if (!response.ok) {
      router.refresh();
      return;
    }

    const payload = (await response.json()) as {
      result: {
        donationId: string;
      };
    };

    if (decision === "ACCEPT") {
      router.push(`/ngo/deliveries/${payload.result.donationId}`);
      return;
    }

    router.refresh();
  };

  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/90 p-8 sm:p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Package weight="duotone" className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="font-serif text-xl mb-1">No pending pickups</h2>
        <p className="text-muted-foreground text-sm">
          New nearby requests will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {candidates.map((candidate) => (
        <div
          key={candidate.id}
          className="rounded-xl border border-border/60 bg-card/90 overflow-hidden transition-all hover:border-primary/20 hover:shadow-md hover:shadow-primary/3"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-serif text-lg">
                  {candidate.donation.foodType}
                </h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {candidate.distanceKm} km away
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-primary/30 text-primary font-mono text-[10px] uppercase tracking-widest"
              >
                #{candidate.rank} nearby
              </Badge>
            </div>

            <div className="grid gap-2 text-sm mb-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User weight="duotone" className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{candidate.donation.donor.name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package
                  weight="duotone"
                  className="h-3.5 w-3.5 flex-shrink-0"
                />
                <span>
                  {candidate.donation.quantity} (
                  {candidate.donation.servesCount} serves)
                </span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin
                  weight="duotone"
                  className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"
                />
                <span className="line-clamp-2">
                  {candidate.donation.address}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-xs font-mono mb-4">
              Pickup by {new Date(candidate.donation.pickupBy).toLocaleString()}
            </p>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  void respond(candidate.id, "ACCEPT");
                }}
                disabled={pendingId === candidate.id}
                className="h-10"
              >
                Accept pickup
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void respond(candidate.id, "DECLINE");
                }}
                disabled={pendingId === candidate.id}
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
