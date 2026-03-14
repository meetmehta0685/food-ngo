import type { DonationStatus } from "@prisma/client"
import { CheckCircle, Clock } from "@phosphor-icons/react/dist/ssr"

import { MapView } from "@/components/maps/map-view"
import { StatusTimeline } from "@/components/tracking/status-timeline"

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
      role: "DONOR" | "NGO"
    }
  }[]
}

export function TrackingBoard({ donation }: { donation: TrackingDonation }) {
  const accepted = donation.statusEvents.some((event) => event.status === "ACCEPTED")
  const delivered = donation.statusEvents.some((event) => event.status === "DELIVERED")

  const lastLocationEvent = [...donation.statusEvents]
    .reverse()
    .find((event) => event.lat !== null && event.lng !== null)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.9fr]">
      <div className="rounded-xl border border-border/60 bg-card/90 p-5 sm:p-6">
        <h2 className="font-serif text-xl mb-1">Shared tracking map</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Donor and NGO view the same progress path for donation
          <span className="font-mono text-[11px] ml-1">#{donation.id.slice(-6)}</span>
        </p>

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

        <div className="flex flex-wrap gap-2 mt-4">
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
            accepted ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground"
          }`}>
            {accepted ? (
              <CheckCircle weight="fill" className="h-3.5 w-3.5" />
            ) : (
              <Clock weight="duotone" className="h-3.5 w-3.5" />
            )}
            {accepted ? "NGO accepted" : "Awaiting acceptance"}
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
            delivered ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground"
          }`}>
            {delivered ? (
              <CheckCircle weight="fill" className="h-3.5 w-3.5" />
            ) : (
              <Clock weight="duotone" className="h-3.5 w-3.5" />
            )}
            {delivered ? "Delivered" : "Delivery pending"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/90 p-5 sm:p-6">
        <h2 className="font-serif text-xl mb-1">Audit timeline</h2>
        <p className="text-muted-foreground text-sm mb-4">Immutable status log for delivery transparency.</p>
        <StatusTimeline currentStatus={donation.status} events={donation.statusEvents} />
      </div>
    </div>
  )
}
