import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ArrowRight, Package, Pulse } from "@phosphor-icons/react/dist/ssr"

import { NgoInboxWorkspace } from "@/components/ngo/inbox-workspace"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth/options"
import { getRoleHomePath } from "@/lib/auth/roles"

export default async function NgoInboxPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/sign-in")
  if (session.user.role !== "NGO") redirect(getRoleHomePath(session.user.role) ?? "/home")

  const listCandidates = () =>
    db.ngoMatchCandidate.findMany({
      where: { ngoUserId: session.user.id, state: "PENDING" },
      include: { donation: { include: { donor: { select: { name: true } } } } },
      orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
    })

  let candidates: Awaited<ReturnType<typeof listCandidates>> = []
  let loadError: string | null = null

  try {
    candidates = await Promise.race([
      listCandidates(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("INBOX_QUERY_TIMEOUT")), 10_000)),
    ])
  } catch (error) {
    console.error("ngo inbox load error", error)
    loadError = "Live inbox data could not be loaded right now. Please refresh in a few seconds."
  }

  const serializedCandidates = candidates.map((candidate) => ({
    id: candidate.id,
    distanceKm: candidate.distanceKm,
    rank: candidate.rank,
    donation: {
      id: candidate.donation.id,
      foodType: candidate.donation.foodType,
      quantity: candidate.donation.quantity,
      servesCount: candidate.donation.servesCount,
      address: candidate.donation.address,
      pickupBy: candidate.donation.pickupBy.toISOString(),
      donor: { name: candidate.donation.donor.name },
    },
  }))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]"><Pulse data-icon="inline-start" />NGO operations</Badge>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Rescue inbox</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6">Accept the closest safe match, then move it through the logistics console.</p>
        </div>
        <Button render={<Link href="/ngo/deliveries" />} nativeButton={false} variant="outline">
          Open logistics
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <Card className="min-w-0">
          <CardHeader className="gap-1 border-b pb-5">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg">Live donation alerts</CardTitle>
              <CardDescription>Sorted by proximity and pickup urgency.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {loadError ? (
              <Alert variant="destructive" className="mb-4"><Package /><AlertTitle>Inbox unavailable</AlertTitle><AlertDescription>{loadError}</AlertDescription></Alert>
            ) : <NgoInboxWorkspace candidates={serializedCandidates} />}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="gap-2">
            <CardTitle className="text-base">Next step</CardTitle>
            <CardDescription>Accept a rescue alert to open its live delivery context.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-muted-foreground text-sm leading-6">
              Once a request is accepted, its address, route, and status milestones appear in the logistics console.
            </p>
            <Button render={<Link href="/ngo/deliveries" />} nativeButton={false} variant="outline" className="mt-4">
              Open logistics
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
