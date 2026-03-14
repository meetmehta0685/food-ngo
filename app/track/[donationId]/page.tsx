import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"

import { TrackingBoard } from "@/components/tracking/tracking-board"
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
    <div className="space-y-6">
      <div>
        <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">Tracking</p>
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">Delivery transparency board</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Shared view for donor and assigned NGO across status, map, and confirmations.
        </p>
      </div>
      <TrackingBoard donation={donation} />
    </div>
  )
}
