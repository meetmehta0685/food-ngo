"use client"

import type { DonationStatus } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight, MapPin, Warning } from "@phosphor-icons/react"

import { MapView } from "@/components/maps/map-view"
import { StatusTimeline } from "@/components/tracking/status-timeline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { nextNgoStatus, statusLabel } from "@/lib/donations/labels"

type DeliveryDonation = {
  id: string
  status: DonationStatus
  address: string
  lat: number
  lng: number
  donor: {
    id: string
    name: string
  }
  assignedNgo: {
    id: string
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
    actor: {
      name: string
      role: "DONOR" | "NGO"
    }
    lat: number | null
    lng: number | null
  }[]
}

export function DeliveryConsole({ donation }: { donation: DeliveryDonation }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextStatus = nextNgoStatus(donation.status)

  const updateStatus = async () => {
    if (!nextStatus) {
      return
    }

    setPending(true)
    setError(null)

    let coords: { lat?: number; lng?: number } = {}

    if (navigator.geolocation) {
      try {
        coords = await new Promise<{ lat?: number; lng?: number }>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({ lat: position.coords.latitude, lng: position.coords.longitude })
            },
            () => resolve({}),
            { timeout: 5000 },
          )
        })
      } catch {
        coords = {}
      }
    }

    const response = await fetch(`/api/donations/${donation.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nextStatus,
        note: `Updated by NGO: ${statusLabel(nextStatus)}`,
        ...coords,
      }),
    })

    setPending(false)

    if (!response.ok) {
      setError("Status update failed")
      return
    }

    router.refresh()
  }

  const lastLocationEvent = [...donation.statusEvents]
    .reverse()
    .find((event) => event.lat !== null && event.lng !== null)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
      <div className="rounded-xl border border-border/60 bg-card/90 p-5 sm:p-6">
        <h2 className="font-serif text-xl mb-1">Delivery map</h2>
        <p className="text-muted-foreground text-sm mb-4">Track donor pickup and delivery movement.</p>
        <MapView
          donor={{ lat: donation.lat, lng: donation.lng, label: "Donor pickup location" }}
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
                  label: "Live NGO position",
                }
              : null
          }
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-card/90 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-serif text-xl">Next action</h2>
            <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px]">
              {statusLabel(donation.status)}
            </Badge>
          </div>

          <div className="flex items-start gap-2 text-muted-foreground text-sm mb-4">
            <MapPin weight="duotone" className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{donation.address}</span>
          </div>

          {nextStatus ? (
            <Button onClick={updateStatus} disabled={pending} className="w-full h-11">
              {pending ? "Updating..." : (
                <>
                  Mark {statusLabel(nextStatus)}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
              Delivery complete. No further action required.
            </div>
          )}

          {error ? (
            <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
              <Warning className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border/60 bg-card/90 p-5 sm:p-6">
          <h2 className="font-serif text-xl mb-4">Status timeline</h2>
          <StatusTimeline currentStatus={donation.status} events={donation.statusEvents} />
        </div>
      </div>
    </div>
  )
}
