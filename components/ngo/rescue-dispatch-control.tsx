"use client"

import type { RescueAssignmentStatus } from "@prisma/client"
import { Bicycle, Clock, UserCheck, UsersThree, WarningCircle, SpinnerGap } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatAppTime } from "@/lib/format-date"
import { rescueStatusLabel } from "@/lib/rescue/status"

type RescueAssignmentSummary = {
  id: string
  status: RescueAssignmentStatus
  volunteerName: string
  volunteerPhone: string | null
  vehicleType: string | null
  distanceKm: number
  offerExpiresAt: string
  lastLat: number | null
  lastLng: number | null
  lastLocationAt: string | null
}

export function RescueDispatchControl({ donationId, donationStatus, assignment }: { donationId: string; donationStatus: string; assignment: RescueAssignmentSummary | null }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestVolunteer = async () => {
    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/donations/${donationId}/rescue-assignments`, { method: "POST" })
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
      if (!response.ok) throw new Error(payload?.error?.message ?? "Could not request a volunteer.")
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not request a volunteer.")
    } finally {
      setPending(false)
    }
  }

  const confirmDelivery = async () => {
    if (!assignment) return
    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/rescue-assignments/${assignment.id}/confirm-delivery`, { method: "POST" })
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
      if (!response.ok) throw new Error(payload?.error?.message ?? "Could not confirm delivery.")
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not confirm delivery.")
    } finally {
      setPending(false)
    }
  }

  if (assignment) {
    const waiting = assignment.status === "OFFERED"
    const assigned = !waiting
    return (
      <div className="bg-primary/5 flex flex-col gap-4 rounded-lg border border-primary/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">{assigned ? <UserCheck /> : <Clock />}</span>
            <div className="flex flex-col gap-1"><p className="text-sm font-semibold">{waiting ? "Waiting for volunteer acceptance" : assignment.volunteerName}</p><p className="text-muted-foreground font-mono text-[10px]">{assignment.distanceKm.toFixed(1)} km from pickup</p></div>
          </div>
          <Badge variant={waiting ? "outline" : "secondary"}>{rescueStatusLabel(assignment.status)}</Badge>
        </div>

        {waiting ? <p className="text-muted-foreground text-xs leading-6">Dispatch offer sent to <strong className="text-foreground">{assignment.volunteerName}</strong>. Offer expires at <span className="text-warning-foreground font-mono font-semibold">{formatAppTime(assignment.offerExpiresAt)}</span>.</p> : null}
        {assigned ? <div className="text-muted-foreground grid gap-2 text-xs sm:grid-cols-2"><span className="inline-flex items-center gap-2"><Bicycle className="text-primary" /><span className="capitalize">{assignment.vehicleType?.replaceAll("_", " ").toLowerCase() ?? "Vehicle transport"}</span></span><span className="font-mono">{assignment.volunteerPhone ?? "Phone unavailable"}</span></div> : null}
        {assignment.lastLocationAt ? <p className="text-muted-foreground font-mono text-[10px]">GPS signal ping: {formatAppTime(assignment.lastLocationAt)}</p> : null}
        {assignment.status === "ARRIVED_AT_NGO" ? <Button type="button" onClick={confirmDelivery} disabled={pending} className="w-full">{pending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <UserCheck data-icon="inline-start" />} {pending ? "Confirming…" : "Confirm food received"}</Button> : null}
        {error ? <Alert variant="destructive"><WarningCircle /><AlertTitle>Dispatch action failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
      </div>
    )
  }

  if (donationStatus !== "ACCEPTED") return null

  return (
    <div className="bg-surface flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md"><UsersThree weight="duotone" /></span>
        <div className="flex min-w-0 flex-col gap-1"><p className="text-sm font-semibold">Automatic volunteer search</p><p className="text-muted-foreground text-xs leading-6">No eligible volunteer accepted the offer yet. Retry the nearby search or continue with NGO self-pickup.</p></div>
      </div>
      <Button type="button" onClick={requestVolunteer} disabled={pending}>{pending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <UsersThree data-icon="inline-start" />} {pending ? "Retrying search…" : "Retry volunteer search"}</Button>
      {error ? <Alert variant="destructive"><WarningCircle /><AlertTitle>Search failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  )
}
