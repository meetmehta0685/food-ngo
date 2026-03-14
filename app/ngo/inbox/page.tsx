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

  const listCandidates = () =>
    db.ngoMatchCandidate.findMany({
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

  let candidates: Awaited<ReturnType<typeof listCandidates>> = []
  let loadError: string | null = null

  try {
    const data = await Promise.race([
      listCandidates(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("INBOX_QUERY_TIMEOUT")), 10_000)
      }),
    ])

    candidates = data
  } catch (error) {
    console.error("ngo inbox load error", error)
    loadError = "Live inbox data could not be loaded right now. Please refresh in a few seconds."
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">NGO operations</p>
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">Inbox</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Nearest donation requests listed by distance and pickup urgency.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <NgoInboxList candidates={candidates} />
    </div>
  )
}
