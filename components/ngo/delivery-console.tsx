"use client"

import type { DeliveryMode, DonationStatus, RescueAssignmentStatus } from "@prisma/client"
import { ArrowRight, CheckCircle, MapPin, SpinnerGap, WarningCircle } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { MapView } from "@/components/maps/map-view"
import { RescueDispatchControl } from "@/components/ngo/rescue-dispatch-control"
import { StatusTimeline } from "@/components/tracking/status-timeline"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { nextNgoStatus, statusLabel } from "@/lib/donations/labels"

type DeliveryDonation = {
  id: string
  status: DonationStatus
  deliveryMode: DeliveryMode
  address: string
  lat: number
  lng: number
  donor: { id: string; name: string }
  assignedNgo: { id: string; name: string; ngoProfile: { lat: number; lng: number; orgName: string } | null } | null
  statusEvents: { id: string; status: DonationStatus; note: string | null; createdAt: string; actor: { name: string; role: "DONOR" | "NGO" | "VOLUNTEER" }; lat: number | null; lng: number | null }[]
  rescueAssignment: { id: string; status: RescueAssignmentStatus; volunteerName: string; volunteerPhone: string | null; vehicleType: string | null; distanceKm: number; offerExpiresAt: string; lastLat: number | null; lastLng: number | null; lastLocationAt: string | null } | null
}

export function DeliveryConsole({ donation }: { donation: DeliveryDonation }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextStatus = nextNgoStatus(donation.status)
  const hasActiveVolunteerWorkflow = Boolean(donation.rescueAssignment)

  const updateStatus = async () => {
    if (!nextStatus) return
    setPending(true)
    setError(null)
    let coords: { lat?: number; lng?: number } = {}

    if (navigator.geolocation) {
      try {
        coords = await new Promise<{ lat?: number; lng?: number }>((resolve) => {
          navigator.geolocation.getCurrentPosition((position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }), () => resolve({}), { timeout: 5000 })
        })
      } catch {
        coords = {}
      }
    }

    const response = await fetch(`/api/donations/${donation.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextStatus, note: `Updated by NGO: ${statusLabel(nextStatus)}`, ...coords }),
    })
    setPending(false)
    if (!response.ok) {
      setError("Status update failed. Please try again.")
      return
    }
    router.refresh()
  }

  const lastLocationEvent = [...donation.statusEvents].reverse().find((event) => event.lat !== null && event.lng !== null)
  const courier = donation.rescueAssignment?.lastLat !== null && donation.rescueAssignment?.lastLat !== undefined && donation.rescueAssignment.lastLng !== null
    ? { lat: donation.rescueAssignment.lastLat, lng: donation.rescueAssignment.lastLng, label: `Volunteer: ${donation.rescueAssignment.volunteerName}` }
    : lastLocationEvent && lastLocationEvent.lat !== null && lastLocationEvent.lng !== null
      ? { lat: lastLocationEvent.lat, lng: lastLocationEvent.lng, label: "Live NGO position" }
      : null

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-lg">Live delivery radar</CardTitle>
          <CardDescription>Realtime GPS context for the pickup and volunteer route.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[28rem] overflow-hidden rounded-lg border">
            <MapView donor={{ lat: donation.lat, lng: donation.lng, label: "Donor pickup" }} ngo={donation.assignedNgo?.ngoProfile ? { lat: donation.assignedNgo.ngoProfile.lat, lng: donation.assignedNgo.ngoProfile.lng, label: donation.assignedNgo.ngoProfile.orgName } : null} courier={courier} liveAssignmentId={donation.rescueAssignment?.id ?? null} liveCourierLabel={donation.rescueAssignment ? `Volunteer: ${donation.rescueAssignment.volunteerName}` : undefined} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="gap-3 border-b pb-4">
            <div className="flex items-center justify-between gap-3"><div className="flex flex-col gap-1"><CardTitle className="text-lg">Logistics action</CardTitle><CardDescription>Move this rescue through its next state.</CardDescription></div><Badge variant="outline">{statusLabel(donation.status)}</Badge></div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pt-5">
            <p className="text-muted-foreground flex items-start gap-2 text-xs leading-6"><MapPin className="text-primary mt-0.5 shrink-0" /><span>{donation.address}</span></p>
            <RescueDispatchControl donationId={donation.id} donationStatus={donation.status} assignment={donation.rescueAssignment} />
            {hasActiveVolunteerWorkflow ? <Alert><CheckCircle /><AlertTitle>Volunteer workflow active</AlertTitle><AlertDescription>Manual NGO controls are on standby while the volunteer route is in progress.</AlertDescription></Alert> : nextStatus ? <Button onClick={updateStatus} disabled={pending} className="w-full">{pending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <ArrowRight data-icon="inline-start" />} {pending ? "Updating…" : `Mark ${statusLabel(nextStatus)}`}</Button> : <Alert><CheckCircle /><AlertTitle>Delivery complete</AlertTitle><AlertDescription>Food portion verified and distributed.</AlertDescription></Alert>}
            {error ? <Alert variant="destructive"><WarningCircle /><AlertTitle>Action needs attention</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1"><CardTitle className="text-lg">Rescue audit timeline</CardTitle><CardDescription>Immutable status milestones for this handoff.</CardDescription></CardHeader>
          <CardContent className="pt-0"><StatusTimeline currentStatus={donation.status} events={donation.statusEvents} /></CardContent>
        </Card>
      </div>
    </div>
  )
}
