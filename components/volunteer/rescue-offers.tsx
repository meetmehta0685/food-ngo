"use client"

import type { RescueAssignmentStatus } from "@prisma/client"
import { ArrowRight, Buildings, CheckCircle, MapPin, Package, SpinnerGap, WarningCircle } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { LocationSimulator } from "@/components/volunteer/location-simulator"
import { PickupOtpVerification } from "@/components/volunteer/pickup-otp-verification"
import { VolunteerLocationTracker } from "@/components/volunteer/volunteer-location-tracker"
import { MapView } from "@/components/maps/map-view"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { rescueStatusLabel } from "@/lib/rescue/status"
import { cn } from "@/lib/utils"

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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3"><div className="flex flex-col gap-1"><h2 className="text-lg font-semibold">Available missions</h2><p className="text-muted-foreground text-xs">Offers are matched to your current location and capacity.</p></div><Badge variant="secondary" className="font-mono text-[10px]">{assignments.length} live</Badge></div>
          {error ? <Alert variant="destructive"><WarningCircle /><AlertTitle>Mission update failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
          {assignments.length === 0 ? (
            <Empty className="min-h-60 border">
              <EmptyHeader><EmptyMedia variant="icon"><Package weight="duotone" /></EmptyMedia><EmptyTitle>No mission offers yet</EmptyTitle><EmptyDescription>Stay available and keep this page open. New rescue broadcasts will arrive here.</EmptyDescription></EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {assignments.map((assignment) => {
                const offered = assignment.status === "OFFERED"
                const pending = pendingId === assignment.id
                return (
                  <Card key={assignment.id} className="transition-colors hover:border-primary/35">
                    <CardHeader className="gap-3 pb-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 flex-col gap-1"><CardTitle className="truncate text-base">{assignment.foodType}</CardTitle><CardDescription>{assignment.quantity}{assignment.estimatedWeightKg ? ` · ${assignment.estimatedWeightKg} kg` : ""}</CardDescription></div><Badge variant={offered ? "outline" : "secondary"} className="shrink-0">{rescueStatusLabel(assignment.status)}</Badge></div></CardHeader>
                    <CardContent className="flex flex-col gap-2 pt-0 text-xs"><span className="text-muted-foreground inline-flex items-center gap-2"><MapPin className="text-primary" />{assignment.distanceKm.toFixed(1)} km away</span>{assignment.ngoName ? <span className="text-muted-foreground inline-flex items-center gap-2"><Buildings className="text-primary" />Drop-off: <strong className="text-foreground">{assignment.ngoName}</strong></span> : null}</CardContent>
                    {offered ? <CardFooter className="flex gap-2 border-t pt-4"><Button variant="outline" size="sm" className="flex-1" disabled={pending} onClick={() => { void respond(assignment.id, "reject") }}>{pending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : null}Decline</Button><Button size="sm" className="flex-1" disabled={pending} onClick={() => { void respond(assignment.id, "accept") }}>{pending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <ArrowRight data-icon="inline-start" />}Accept mission</Button></CardFooter> : null}
                  </Card>
                )
              })}
            </div>
          )}
        </div>

      </div>

      <Card className="h-fit">
        <CardHeader className="gap-1"><CardTitle className="text-lg">Current mission route</CardTitle><CardDescription>Accept a mission to reveal the pickup and drop-off path.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-5 pt-0">
          {activeAssignment && activeAssignment.status !== "OFFERED" ? <div className="h-64 overflow-hidden rounded-lg border"><MapView donor={{ lat: activeAssignment.pickupLat, lng: activeAssignment.pickupLng, label: `Pickup: ${activeAssignment.pickupAddress ?? "Donor"}` }} ngo={{ lat: activeAssignment.ngoLat, lng: activeAssignment.ngoLng, label: `Drop-off: ${activeAssignment.ngoName}` }} courier={activeAssignment.lastLat !== null && activeAssignment.lastLng !== null ? { lat: activeAssignment.lastLat, lng: activeAssignment.lastLng, label: "Your current position" } : null} /></div> : <div className="bg-surface flex min-h-44 items-center justify-center rounded-lg border border-dashed p-6 text-center"><p className="text-muted-foreground max-w-xs text-xs leading-6">No active route yet. Your next accepted offer will appear here.</p></div>}
          <div className="bg-surface grid gap-3 rounded-lg border p-4 text-xs sm:grid-cols-2"><ChecklistItem done={Boolean(activeAssignment && activeAssignment.status !== "OFFERED")} label="Navigate to pickup" /><ChecklistItem done={Boolean(activeAssignment && ["PICKED_UP", "EN_ROUTE_TO_NGO", "ARRIVED_AT_NGO"].includes(activeAssignment.status))} label="Verify surplus" /><ChecklistItem done={Boolean(activeAssignment && ["EN_ROUTE_TO_NGO", "ARRIVED_AT_NGO"].includes(activeAssignment.status))} label="Navigate to drop-off" /><ChecklistItem done={Boolean(activeAssignment && activeAssignment.status === "ARRIVED_AT_NGO")} label="Confirm delivery and OTP" /></div>
          {activeAssignment && activeAssignment.status !== "OFFERED" ? <><VolunteerLocationTracker assignmentId={activeAssignment.id} assignmentStatus={activeAssignment.status} />{simulatorEnabled && ["EN_ROUTE_TO_PICKUP", "EN_ROUTE_TO_NGO", "PICKED_UP"].includes(activeAssignment.status) ? <LocationSimulator assignmentId={activeAssignment.id} assignmentStatus={activeAssignment.status} /> : null}{activeAssignment.status === "ARRIVED_AT_PICKUP" ? <PickupOtpVerification assignmentId={activeAssignment.id} /> : null}</> : null}
        </CardContent>
      </Card>
    </div>
  )
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return <span className="text-muted-foreground inline-flex items-center gap-2"><CheckCircle className={cn(done ? "text-success" : "text-muted-foreground")} weight={done ? "fill" : "regular"} />{label}</span>
}
