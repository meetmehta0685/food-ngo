import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { Plus } from "@phosphor-icons/react/dist/ssr"

import { DonorDonationsTable } from "@/components/donor/donations-table"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth/options"

export default async function DonorRequestsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  if (session.user.role !== "DONOR") {
    redirect("/ngo/inbox")
  }

  const donations = await db.donation.findMany({
    where: { donorId: session.user.id },
    include: {
      assignedNgo: {
        select: {
          name: true,
          ngoProfile: {
            select: {
              orgName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">Donor dashboard</p>
          <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">My donation requests</h1>
          <p className="text-muted-foreground text-sm mt-1">Track every request from report to delivery.</p>
        </div>
        <Link href="/donor/new">
          <Button className="h-10">
            <Plus className="mr-1.5 h-4 w-4" />
            New request
          </Button>
        </Link>
      </div>

      <DonorDonationsTable donations={donations} />
    </div>
  )
}
