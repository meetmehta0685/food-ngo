import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ArrowRight, Package, MapPin, User } from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { statusLabel } from "@/lib/donations/labels"
import { authOptions } from "@/lib/auth/options"

export default async function NgoDeliveriesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  if (session.user.role !== "NGO") {
    redirect("/donor/requests")
  }

  const deliveries = await db.donation.findMany({
    where: {
      assignedNgoId: session.user.id,
      status: {
        in: ["ACCEPTED", "PICKUP_IN_PROGRESS", "PICKED_UP"],
      },
    },
    include: {
      donor: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">NGO operations</p>
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">Active deliveries</h1>
        <p className="text-muted-foreground text-sm mt-1">Operational board for accepted and in-progress pickups.</p>
      </div>

      {deliveries.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/90 p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <Package weight="duotone" className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-xl mb-1">No active deliveries</h2>
          <p className="text-muted-foreground text-sm">Accept a request from your inbox to start fulfillment.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="rounded-xl border border-border/60 bg-card/90 p-5 sm:p-6 transition-all hover:border-primary/20 hover:shadow-md hover:shadow-primary/3">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-serif text-lg">{delivery.foodType}</h3>
                <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px]">
                  {statusLabel(delivery.status)}
                </Badge>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User weight="duotone" className="h-3.5 w-3.5" />
                  <span>{delivery.donor.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package weight="duotone" className="h-3.5 w-3.5" />
                  <span>{delivery.quantity}</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin weight="duotone" className="h-3.5 w-3.5 mt-0.5" />
                  <span className="line-clamp-2">{delivery.address}</span>
                </div>
              </div>

              <Link href={`/ngo/deliveries/${delivery.id}`}>
                <Button variant="outline" className="w-full">
                  Open console
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
