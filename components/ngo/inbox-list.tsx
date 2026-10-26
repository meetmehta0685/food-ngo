"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Check, Clock, MapPin, Package, SpinnerGap, User, WarningCircle, X } from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
      <div className="kolam-sheet flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-14 text-center">
        <Package className="text-muted-foreground size-7" weight="bold" />
        <h2 className="text-2xl">No pending rescue alerts</h2>
        <p className="text-muted-foreground mx-auto max-w-md text-base leading-relaxed">Nearby donor broadcasts will appear here sorted by urgency and distance.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {error ? <Alert variant="destructive" className="mb-4"><WarningCircle /><AlertTitle>Alert update failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
      <ul className="flex flex-col border-t">
        {candidates.map((candidate, index) => {
          const isUrgent = candidate.rank === 1 || candidate.distanceKm < 2
          const isHighPriority = candidate.rank === 2 || candidate.distanceKm < 3.5
          const urgencyLabel = isUrgent ? "Urgent" : isHighPriority ? "High priority" : "Standard"
          const urgencyVariant = isUrgent ? "destructive" : isHighPriority ? "secondary" : "outline"
          const isPending = pendingId === candidate.id

          return (
            <li key={candidate.id} className="grid gap-4 border-b py-5 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
              <div className="relative hidden size-14 shrink-0 overflow-hidden rounded-md sm:block">
                <Image src={foodThumbnails[index % foodThumbnails.length]} alt="Food rescue preview" fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <Badge variant={urgencyVariant} className="gap-1.5"><Clock data-icon="inline-start" />{urgencyLabel} · {candidate.distanceKm.toFixed(1)} km</Badge>
                  <span className={isUrgent ? "tabular text-sm font-semibold" : "text-muted-foreground tabular text-sm"}>Pickup by {formatAppTime(candidate.donation.pickupBy)}</span>
                </div>
                <h3 className="truncate text-2xl">{candidate.donation.foodType}</h3>
                <p className="text-muted-foreground text-sm">{candidate.donation.quantity} · {candidate.donation.servesCount} meals</p>
                <div className="text-muted-foreground flex flex-col gap-1 text-sm">
                  <span className="inline-flex items-start gap-2"><MapPin className="text-primary mt-0.5 shrink-0" /><span className="line-clamp-2">{candidate.donation.address}</span></span>
                  <span className="inline-flex items-center gap-2"><User className="text-primary shrink-0" />Donor: <strong className="text-foreground font-semibold">{candidate.donation.donor.name}</strong></span>
                </div>
              </div>
              <div className="flex gap-2 sm:flex-col">
                <Button className="flex-1 sm:w-40 sm:flex-none" onClick={() => { void respond(candidate.id, "ACCEPT") }} disabled={isPending}>
                  {isPending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <Check data-icon="inline-start" />}
                  Accept rescue
                </Button>
                <Button variant="ghost" className="flex-1 sm:w-40 sm:flex-none" onClick={() => { void respond(candidate.id, "DECLINE") }} disabled={isPending}>
                  {isPending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <X data-icon="inline-start" />}
                  Decline
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
