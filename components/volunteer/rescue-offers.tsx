"use client"

import type { RescueAssignmentStatus } from "@prisma/client"
import { ArrowRight, Buildings, MapPin, Package, SpinnerGap, WarningCircle } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { LocationSimulator } from "@/components/volunteer/location-simulator"
import { PickupOtpVerification } from "@/components/volunteer/pickup-otp-verification"
import { VolunteerLocationTracker } from "@/components/volunteer/volunteer-location-tracker"
import { KolamRoute } from "@/components/kolam/kolam-route"
import { MapView } from "@/components/maps/map-view"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { rescueStatusLabel } from "@/lib/rescue/status"

export type VolunteerAssignmentView = {
  id: string
  status: RescueAssignmentStatus
  distanceKm: number
  offerExpiresAt: string
  foodType: string
  quantity: string
  estimatedWeightKg: number | null
  pickupAddress: string | null
  donorName: string | null
  ngoName: string
  ngoAddress: string | null
  pickupLat: number
  pickupLng: number
  ngoLat: number
  ngoLng: number
  lastLat: number | null
  lastLng: number | null
}

export function RescueOffers({ assignments, simulatorEnabled = false }: { assignments: VolunteerAssignmentView[]; simulatorEnabled?: boolean }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const activeAssignment = assignments.find((assignment) => assignment.status !== "OFFERED") ?? assignments[0]

  const respond = async (assignmentId: string, decision: "accept" | "reject") => {
    setPendingId(assignmentId)
    setError(null)
    try {
      const response = await fetch(`/api/volunteer/offers/${assignmentId}/${decision}`, { method: "POST" })
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
      if (!response.ok) throw new Error(payload?.error?.message ?? `Could not ${decision} offer.`)
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update the offer.")
    } finally {
      setPendingId(null)
    }
  }

  const missionProgress = [
    Boolean(activeAssignment && activeAssignment.status !== "OFFERED"),
    Boolean(activeAssignment && ["PICKED_UP", "EN_ROUTE_TO_NGO", "ARRIVED_AT_NGO"].includes(activeAssignment.status)),
    Boolean(activeAssignment && ["EN_ROUTE_TO_NGO", "ARRIVED_AT_NGO"].includes(activeAssignment.status)),
    Boolean(activeAssignment && activeAssignment.status === "ARRIVED_AT_NGO"),
  ]
  const firstOpenStep = missionProgress.findIndex((done) => !done)
  const missionStep = !missionProgress[0] ? -1 : firstOpenStep === -1 ? missionProgress.length - 1 : firstOpenStep

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3 border-b pb-4"><div className="flex flex-col gap-1"><h2 className="text-2xl">Available missions</h2><p className="text-muted-foreground text-sm">Offers are matched to your current location and capacity.</p></div><Badge variant="outline">{assignments.length} live</Badge></div>
          {error ? <Alert variant="destructive"><WarningCircle /><AlertTitle>Mission update failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
          {assignments.length === 0 ? (
            <Empty className="kolam-sheet min-h-60 border border-dashed">
              <EmptyHeader><EmptyMedia variant="icon"><Package weight="duotone" /></EmptyMedia><EmptyTitle>No mission offers yet</EmptyTitle><EmptyDescription>Stay available and keep this page open. New rescue broadcasts will arrive here.</EmptyDescription></EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col">
              {assignments.map((assignment) => {
                const offered = assignment.status === "OFFERED"
                const pending = pendingId === assignment.id
                return (
                  <li key={assignment.id} className="flex flex-col gap-4 border-b py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <h3 className="truncate text-2xl">{assignment.foodType}</h3>
                        <p className="text-muted-foreground text-sm">{assignment.quantity}{assignment.estimatedWeightKg ? ` · ${assignment.estimatedWeightKg} kg` : ""}</p>
                      </div>
                      <Badge variant={offered ? "outline" : "secondary"} className="shrink-0">{rescueStatusLabel(assignment.status)}</Badge>
                    </div>
                    <div className="text-muted-foreground flex flex-col gap-1.5 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5">
                      <span className="inline-flex items-center gap-2"><MapPin className="text-primary" /><span className="tabular">{assignment.distanceKm.toFixed(1)} km away</span></span>
                      {assignment.ngoName ? <span className="inline-flex items-center gap-2"><Buildings className="text-primary" />Drop-off: <strong className="text-foreground font-semibold">{assignment.ngoName}</strong></span> : null}
                    </div>
                    {offered ? <div className="flex gap-2"><Button className="flex-1 sm:flex-none" disabled={pending} onClick={() => { void respond(assignment.id, "accept") }}>{pending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <ArrowRight data-icon="inline-start" />}Accept mission</Button><Button variant="ghost" className="flex-1 sm:flex-none" disabled={pending} onClick={() => { void respond(assignment.id, "reject") }}>{pending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : null}Decline</Button></div> : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>

      <Card className="h-fit">
        <CardHeader className="gap-1"><CardTitle>Current mission route</CardTitle><CardDescription>Accept a mission to reveal the pickup and drop-off path.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-5 pt-0">
          {activeAssignment && activeAssignment.status !== "OFFERED" ? <div className="h-72 overflow-hidden rounded-md border"><MapView donor={{ lat: activeAssignment.pickupLat, lng: activeAssignment.pickupLng, label: `Pickup: ${activeAssignment.pickupAddress ?? "Donor"}` }} ngo={{ lat: activeAssignment.ngoLat, lng: activeAssignment.ngoLng, label: `Drop-off: ${activeAssignment.ngoName}` }} courier={activeAssignment.lastLat !== null && activeAssignment.lastLng !== null ? { lat: activeAssignment.lastLat, lng: activeAssignment.lastLng, label: "Your current position" } : null} /></div> : <div className="kolam-sheet flex min-h-44 items-center justify-center rounded-md border border-dashed p-6 text-center"><p className="text-muted-foreground max-w-xs text-sm leading-relaxed">No active route yet. Your next accepted offer will appear here.</p></div>}
          <KolamRoute
            stages={missionSteps}
            current={missionStep}
            complete={missionProgress.every(Boolean)}
            orientation="vertical"
            size="compact"
            label="Mission checklist"
          />
          {activeAssignment && activeAssignment.status !== "OFFERED" ? <><VolunteerLocationTracker assignmentId={activeAssignment.id} assignmentStatus={activeAssignment.status} />{simulatorEnabled && ["EN_ROUTE_TO_PICKUP", "EN_ROUTE_TO_NGO", "PICKED_UP"].includes(activeAssignment.status) ? <LocationSimulator assignmentId={activeAssignment.id} assignmentStatus={activeAssignment.status} /> : null}{activeAssignment.status === "ARRIVED_AT_PICKUP" ? <PickupOtpVerification assignmentId={activeAssignment.id} /> : null}</> : null}
        </CardContent>
      </Card>
    </div>
  )
}

const missionSteps = [
  { key: "pickup", label: "Navigate to pickup" },
  { key: "verify", label: "Verify surplus" },
  { key: "dropoff", label: "Navigate to drop-off" },
  { key: "confirm", label: "Confirm delivery and OTP" },
]
