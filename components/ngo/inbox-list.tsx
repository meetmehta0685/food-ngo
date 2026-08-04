"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Check, Clock, MapPin, Package, SpinnerGap, User, WarningCircle, X } from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatAppTime } from "@/lib/format-date"

export type InboxCandidate = {
  id: string
  distanceKm: number
  rank: number
  donation: {
    id: string
    foodType: string
    quantity: string
    servesCount: number
    address: string
    pickupBy: string
    donor: { name: string }
  }
}

const foodThumbnails = [
  "/intro/food-donation.jpg",
  "/intro/ngo-match.jpg",
  "/intro/delivery-tracking.jpg",
]

export function NgoInboxList({ candidates }: { candidates: InboxCandidate[] }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const respond = async (candidateId: string, decision: "ACCEPT" | "DECLINE") => {
    setPendingId(candidateId)
    setError(null)

    try {
      const response = await fetch(`/api/matches/${candidateId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
        throw new Error(payload?.error?.message ?? "Could not update this rescue alert.")
      }

      const payload = (await response.json()) as { result: { donationId: string } }
      if (decision === "ACCEPT") {
        router.push(`/ngo/deliveries/${payload.result.donationId}`)
      } else {
        router.refresh()
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update this rescue alert.")
    } finally {
      setPendingId(null)
    }
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-surface rounded-lg border border-dashed p-8 text-center">
          <span className="bg-primary/10 text-primary mx-auto mb-4 flex size-11 items-center justify-center rounded-md"><Package weight="duotone" /></span>
          <h2 className="text-base font-semibold">No pending rescue alerts</h2>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-xs leading-6">Nearby donor broadcasts will appear here sorted by urgency and distance.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert variant="destructive"><WarningCircle /><AlertTitle>Alert update failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
      {candidates.map((candidate, index) => {
        const isUrgent = candidate.rank === 1 || candidate.distanceKm < 2
        const isHighPriority = candidate.rank === 2 || candidate.distanceKm < 3.5
        const urgencyLabel = isUrgent ? "Urgent" : isHighPriority ? "High priority" : "Standard"
        const urgencyVariant = isUrgent ? "destructive" : isHighPriority ? "secondary" : "outline"
        const isPending = pendingId === candidate.id

        return (
          <Card key={candidate.id} className="overflow-hidden transition-colors hover:border-primary/35">
            <CardHeader className="gap-3 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant={urgencyVariant} className="gap-1.5 font-mono text-[10px] uppercase"><Clock data-icon="inline-start" />{urgencyLabel} · {candidate.distanceKm.toFixed(1)} km</Badge>
                <span className="text-muted-foreground font-mono text-[10px]">Pickup by {formatAppTime(candidate.donation.pickupBy)}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md border">
                  <Image src={foodThumbnails[index % foodThumbnails.length]} alt="Food rescue preview" fill className="object-cover" sizes="48px" />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <CardTitle className="truncate text-base">{candidate.donation.foodType}</CardTitle>
                  <CardDescription className="truncate">{candidate.donation.quantity} · {candidate.donation.servesCount} meals</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0 text-xs">
              <span className="text-muted-foreground inline-flex items-start gap-2"><MapPin className="text-primary mt-0.5 shrink-0" /><span className="line-clamp-2">{candidate.donation.address}</span></span>
              <span className="text-muted-foreground inline-flex items-center gap-2"><User className="text-primary shrink-0" />Donor: <strong className="text-foreground">{candidate.donation.donor.name}</strong></span>
            </CardContent>
            <CardFooter className="flex gap-2 border-t pt-4">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { void respond(candidate.id, "DECLINE") }} disabled={isPending}>
                {isPending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <X data-icon="inline-start" />}
                Decline
              </Button>
              <Button size="sm" className="flex-1" onClick={() => { void respond(candidate.id, "ACCEPT") }} disabled={isPending}>
                {isPending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <Check data-icon="inline-start" />}
                Accept rescue
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
