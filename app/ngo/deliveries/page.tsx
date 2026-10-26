import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ArrowRight, MapPin, Package, User } from "@phosphor-icons/react/dist/ssr"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { db } from "@/lib/db"
import { statusLabel } from "@/lib/donations/labels"
import { authOptions } from "@/lib/auth/options"
import { getRoleHomePath } from "@/lib/auth/roles"

export default async function NgoDeliveriesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/sign-in")
  if (session.user.role !== "NGO") redirect(getRoleHomePath(session.user.role) ?? "/home")

  const listDeliveries = () =>
    db.donation.findMany({
      where: { assignedNgoId: session.user.id, status: { in: ["ACCEPTED", "PICKUP_IN_PROGRESS", "PICKED_UP"] } },
      include: { donor: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    })

  let deliveries: Awaited<ReturnType<typeof listDeliveries>> = []
  let loadError: string | null = null

  try {
    deliveries = await Promise.race([
      listDeliveries(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DELIVERIES_QUERY_TIMEOUT")), 10_000)),
    ])
  } catch (error) {
    console.error("ngo deliveries load error", error)
    loadError = "Active delivery data is temporarily unavailable. Please refresh in a few seconds."
  }

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Active deliveries"
        description="Accepted and in-progress pickups in one operational queue."
        actions={<Button render={<Link href="/ngo/inbox" />} nativeButton={false} variant="outline">Back to inbox<ArrowRight data-icon="inline-end" /></Button>}
      />

      {loadError ? <Alert variant="destructive"><Package /><AlertTitle>Delivery queue unavailable</AlertTitle><AlertDescription>{loadError}</AlertDescription></Alert> : null}

      {loadError ? null : deliveries.length === 0 ? (
        <Empty className="kolam-sheet min-h-80 border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Package weight="duotone" /></EmptyMedia>
            <EmptyTitle>No active deliveries</EmptyTitle>
            <EmptyDescription>Accept a nearby rescue request from your inbox to start fulfillment.</EmptyDescription>
          </EmptyHeader>
          <Button render={<Link href="/ngo/inbox" />} nativeButton={false}>Open rescue inbox<ArrowRight data-icon="inline-end" /></Button>
        </Empty>
      ) : (
        <ul className="flex flex-col border-t">
          {deliveries.map((delivery) => (
            <li key={delivery.id} className="grid gap-4 border-b py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="truncate text-2xl">{delivery.foodType}</h2>
                  <Badge variant="outline" className="shrink-0">{statusLabel(delivery.status)}</Badge>
                </div>
                <div className="text-muted-foreground flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5">
                  <span className="inline-flex items-center gap-2"><User className="text-primary" />{delivery.donor.name}</span>
                  <span className="inline-flex items-center gap-2"><Package className="text-primary" />{delivery.quantity}</span>
                  <span className="inline-flex min-w-0 items-start gap-2"><MapPin className="text-primary mt-0.5 shrink-0" /><span className="line-clamp-1">{delivery.address}</span></span>
                </div>
              </div>
              <Button render={<Link href={`/ngo/deliveries/${delivery.id}`} />} nativeButton={false} variant="outline" className="w-full sm:w-auto">Open console<ArrowRight data-icon="inline-end" /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
