import type {
  DonationStatus,
  RescueAssignmentStatus,
} from "@prisma/client"
import { CheckCircle, Clock } from "@phosphor-icons/react/dist/ssr"

import { MapView } from "@/components/maps/map-view"
import { PickupOtpCard } from "@/components/tracking/pickup-otp-card"
import { StatusTimeline } from "@/components/tracking/status-timeline"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type TrackingDonation = {
  id: string
  status: DonationStatus
  address: string
  lat: number
  lng: number
  donor: {
    name: string
  }
  assignedNgo: {
    name: string
    ngoProfile: {
      lat: number
      lng: number
      orgName: string
    } | null
  } | null
  statusEvents: {
    id: string
    status: DonationStatus
    note: string | null
    createdAt: Date
    lat: number | null
    lng: number | null
    actor: {
      name: string
      role: "DONOR" | "NGO" | "VOLUNTEER"
    }
  }[]
  rescueAssignments: {
    id: string
    status: RescueAssignmentStatus
    lastLat: number | null
    lastLng: number | null
    lastLocationAt: Date | null
    volunteer: {
      name: string
    }
  }[]
}

export function TrackingBoard({
  donation,
  viewerIsDonor,
}: {
  donation: TrackingDonation
  viewerIsDonor: boolean
}) {
  const accepted = donation.statusEvents.some((event) => event.status === "ACCEPTED")
  const delivered = donation.statusEvents.some((event) => event.status === "DELIVERED")

  const lastLocationEvent = [...donation.statusEvents]
    .reverse()
    .find((event) => event.lat !== null && event.lng !== null)
  const rescueAssignment = donation.rescueAssignments[0] ?? null
  const canGeneratePickupOtp =
    viewerIsDonor &&
    rescueAssignment !== null &&
    rescueAssignment.status === "ARRIVED_AT_PICKUP"

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {viewerIsDonor ? "Pickup handoff map" : "Live volunteer tracking map"}
          </CardTitle>
          <CardDescription>
            {viewerIsDonor
              ? "For privacy, live volunteer location is visible only to the assigned NGO for this donation."
              : "Track the volunteer route and handoff progress for this donation."}
            <span className="ml-1 font-mono text-[11px]">#{donation.id.slice(-6)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <MapView
            donor={{
              lat: donation.lat,
              lng: donation.lng,
              label: `Donor pickup: ${donation.donor.name}`,
            }}
            ngo={
              donation.assignedNgo?.ngoProfile
                ? {
                    lat: donation.assignedNgo.ngoProfile.lat,
                    lng: donation.assignedNgo.ngoProfile.lng,
                    label: donation.assignedNgo.ngoProfile.orgName,
                  }
                : null
            }
            courier={
              !viewerIsDonor &&
              rescueAssignment?.lastLat !== null &&
              rescueAssignment?.lastLat !== undefined &&
              rescueAssignment.lastLng !== null
                ? {
                    lat: rescueAssignment.lastLat,
                    lng: rescueAssignment.lastLng,
                    label: `Volunteer: ${rescueAssignment.volunteer.name}`,
                  }
                : !viewerIsDonor &&
                    lastLocationEvent &&
                    lastLocationEvent.lat !== null &&
                    lastLocationEvent.lng !== null
                  ? {
                      lat: lastLocationEvent.lat,
                      lng: lastLocationEvent.lng,
                      label: "Latest delivery movement",
                    }
                  : null
            }
          />

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 py-1.5",
                accepted
                  ? "border-success/30 bg-success/10 text-success"
                  : "text-muted-foreground",
              )}
            >
              {accepted ? (
                <CheckCircle data-icon="inline-start" weight="fill" />
              ) : (
                <Clock data-icon="inline-start" weight="duotone" />
              )}
              {accepted ? "NGO accepted" : "Awaiting acceptance"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 py-1.5",
                delivered
                  ? "border-success/30 bg-success/10 text-success"
                  : "text-muted-foreground",
              )}
            >
              {delivered ? (
                <CheckCircle data-icon="inline-start" weight="fill" />
              ) : (
                <Clock data-icon="inline-start" weight="duotone" />
              )}
              {delivered ? "Delivered" : "Delivery pending"}
            </Badge>
            {!viewerIsDonor && rescueAssignment ? (
              <Badge className="gap-1.5 py-1.5" variant="secondary">
                <Clock data-icon="inline-start" weight="duotone" />
                {rescueAssignment.volunteer.name}: {rescueAssignment.status.replaceAll("_", " ")}
              </Badge>
            ) : null}
          </div>

          {canGeneratePickupOtp && rescueAssignment ? (
            <PickupOtpCard assignmentId={rescueAssignment.id} />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Audit timeline</CardTitle>
          <CardDescription>Immutable status log for delivery transparency.</CardDescription>
        </CardHeader>
        <CardContent>
          <StatusTimeline currentStatus={donation.status} events={donation.statusEvents} />
        </CardContent>
      </Card>
    </div>
  )
}
