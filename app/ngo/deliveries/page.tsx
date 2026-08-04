import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ArrowRight, MapPin, Package, Pulse, User } from "@phosphor-icons/react/dist/ssr"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]"><Pulse data-icon="inline-start" />NGO logistics</Badge>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Active deliveries</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6">Accepted and in-progress pickups in one operational queue.</p>
        </div>
        <Button render={<Link href="/ngo/inbox" />} nativeButton={false} variant="outline">Back to inbox<ArrowRight data-icon="inline-end" /></Button>
      </div>

      {loadError ? <Alert variant="destructive"><Package /><AlertTitle>Delivery queue unavailable</AlertTitle><AlertDescription>{loadError}</AlertDescription></Alert> : null}

      {loadError ? null : deliveries.length === 0 ? (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Package weight="duotone" /></EmptyMedia>
            <EmptyTitle>No active deliveries</EmptyTitle>
            <EmptyDescription>Accept a nearby rescue request from your inbox to start fulfillment.</EmptyDescription>
          </EmptyHeader>
          <Button render={<Link href="/ngo/inbox" />} nativeButton={false}>Open rescue inbox<ArrowRight data-icon="inline-end" /></Button>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {deliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardHeader className="gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1"><CardTitle className="truncate text-lg">{delivery.foodType}</CardTitle><CardDescription>{delivery.quantity}</CardDescription></div>
                  <Badge variant="outline" className="shrink-0">{statusLabel(delivery.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0 text-sm">
                <span className="text-muted-foreground inline-flex items-center gap-2"><User className="text-primary" />{delivery.donor.name}</span>
                <span className="text-muted-foreground inline-flex items-center gap-2"><Package className="text-primary" />{delivery.quantity}</span>
                <span className="text-muted-foreground inline-flex items-start gap-2"><MapPin className="text-primary mt-0.5" /><span className="line-clamp-2">{delivery.address}</span></span>
                <Button render={<Link href={`/ngo/deliveries/${delivery.id}`} />} nativeButton={false} variant="outline" className="mt-2 w-full justify-between">Open console<ArrowRight data-icon="inline-end" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
