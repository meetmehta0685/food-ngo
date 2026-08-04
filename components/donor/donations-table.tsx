import type { DonationStatus } from "@prisma/client"
import Link from "next/link"
import { ArrowRight, Buildings, Clock, ForkKnife, Package } from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAppTime } from "@/lib/format-date"
import { statusLabel } from "@/lib/donations/labels"

type DonorDonation = {
  id: string
  foodType: string
  quantity: string
  servesCount: number
  status: DonationStatus
  pickupBy: string
  assignedNgo: {
    name: string
    ngoProfile: { orgName: string } | null
  } | null
}

export function DonorDonationsTable({ donations, unavailable = false }: { donations: DonorDonation[]; unavailable?: boolean }) {
  if (unavailable) {
    return (
      <Empty className="min-h-72 border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon"><Package weight="duotone" /></EmptyMedia>
          <EmptyTitle>History is temporarily unavailable</EmptyTitle>
          <EmptyDescription>Refresh this workspace to try loading your rescue history again.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (donations.length === 0) {
    return (
      <Empty className="min-h-72 border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><Package weight="duotone" /></EmptyMedia>
          <EmptyTitle>No rescue requests yet</EmptyTitle>
          <EmptyDescription>Broadcast your first surplus request and nearby partners will receive the signal.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/donor/new" />} nativeButton={false}>
            Report surplus
            <ArrowRight data-icon="inline-end" />
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Food</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Portions</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Partner</TableHead>
            <TableHead>Pickup by</TableHead>
            <TableHead className="text-right">Track</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.map((donation) => {
            const isDelivered = donation.status === "DELIVERED"
            const isAssigned = ["ACCEPTED", "PICKUP_IN_PROGRESS", "PICKED_UP"].includes(donation.status)
            return (
              <TableRow key={donation.id}>
                <TableCell className="font-medium">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md"><ForkKnife /></span>
                    <span className="truncate">{donation.foodType}</span>
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{donation.quantity}</TableCell>
                <TableCell className="font-mono tabular-nums">{donation.servesCount} meals</TableCell>
                <TableCell>
                  <Badge variant={isDelivered ? "secondary" : isAssigned ? "outline" : "ghost"}>{statusLabel(donation.status)}</Badge>
                </TableCell>
                <TableCell>
                  {donation.assignedNgo ? (
                    <span className="inline-flex min-w-0 items-center gap-2 font-medium">
                      <Buildings className="text-primary shrink-0" />
                      <span className="truncate">{donation.assignedNgo.ngoProfile?.orgName ?? donation.assignedNgo.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-mono text-[10px]">Awaiting partner</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-[10px]">
                  <span className="inline-flex items-center gap-1.5"><Clock className="text-warning-foreground" />{formatAppTime(donation.pickupBy)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button render={<Link href={`/track/${donation.id}`} />} nativeButton={false} variant="ghost" size="sm">
                    Track
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
