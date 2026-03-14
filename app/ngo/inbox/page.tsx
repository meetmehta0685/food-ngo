import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { NgoInboxList } from "@/components/ngo/inbox-list"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth/options"

export default async function NgoInboxPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  if (session.user.role !== "NGO") {
    redirect("/donor/requests")
  }

  const candidates = await db.ngoMatchCandidate.findMany({
    where: {
      ngoUserId: session.user.id,
      state: "PENDING",
    },
    include: {
      donation: {
        include: {
          donor: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">NGO operations</p>
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">Inbox</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Nearest donation requests listed by distance and pickup urgency.
        </p>
      </div>

      <NgoInboxList candidates={candidates} />
    </div>
  )
}
