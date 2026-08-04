import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"

import { TrackingBoard } from "@/components/tracking/tracking-board"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth/options"

type PageProps = {
  params: Promise<{ donationId: string }>
}

export default async function TrackingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  const { donationId } = await params

  const donation = await db.donation.findUnique({
    where: { id: donationId },
    include: {
      donor: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedNgo: {
        select: {
          id: true,
          name: true,
          ngoProfile: {
            select: {
              lat: true,
              lng: true,
              orgName: true,
            },
          },
        },
      },
      statusEvents: {
        include: {
          actor: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      rescueAssignments: {
        where: {
          status: {
            in: [
              "ACCEPTED",
              "EN_ROUTE_TO_PICKUP",
              "ARRIVED_AT_PICKUP",
              "PICKED_UP",
              "EN_ROUTE_TO_NGO",
              "ARRIVED_AT_NGO",
            ],
          },
        },
        select: {
          id: true,
          status: true,
          lastLat: true,
          lastLng: true,
          lastLocationAt: true,
          volunteer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  if (!donation) {
    notFound()
  }

  const hasAccess =
    donation.donorId === session.user.id || donation.assignedNgoId === session.user.id

  if (!hasAccess) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge className="w-fit font-mono text-[10px] uppercase tracking-widest" variant="outline">
          Tracking
        </Badge>
        <h1 className="font-display text-2xl tracking-tight sm:text-3xl">Delivery transparency board</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Donors manage pickup verification while assigned NGOs receive live volunteer tracking.
        </p>
      </div>
      <TrackingBoard
        donation={donation}
        viewerIsDonor={donation.donorId === session.user.id}
      />
    </div>
  )
}
