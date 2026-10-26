"use client"

import type { RescueAssignmentStatus } from "@prisma/client"
import { MapPin, SpinnerGap, Warning } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function LocationSimulator({
  assignmentId,
  assignmentStatus,
}: {
  assignmentId: string
  assignmentStatus: RescueAssignmentStatus
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const destination =
    assignmentStatus === "EN_ROUTE_TO_PICKUP" ? "PICKUP" : "NGO"

  const simulateArrival = async () => {
    setPending(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/dev/rescue-assignments/${assignmentId}/simulate-location`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination }),
        },
      )
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Simulation failed")
      }

      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Simulation failed",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-1 border-t border-dashed pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            Development location simulator
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Uses the real location API and geofence transition without physical
            travel.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          
          onClick={simulateArrival}
          disabled={pending}
        >
          {pending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <MapPin data-icon="inline-start" />}
          {pending
            ? "Simulating..."
            : `Simulate ${destination === "PICKUP" ? "pickup" : "NGO"} arrival`}
        </Button>
      </div>

      {error ? <Alert variant="destructive" className="mt-3"><Warning /><AlertTitle>Simulation failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  )
}
