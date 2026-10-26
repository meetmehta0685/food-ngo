import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ArrowRight, Package } from "@phosphor-icons/react/dist/ssr"

import { NgoInboxWorkspace } from "@/components/ngo/inbox-workspace"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageHeader } from "@/components/layout/page-header"
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
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Rescue inbox"
        description="Accept the closest safe match, then move it through the logistics console."
        actions={
          <Button render={<Link href="/ngo/deliveries" />} nativeButton={false} variant="outline">
            Open logistics
            <ArrowRight data-icon="inline-end" />
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <section className="flex min-w-0 flex-col gap-5" aria-labelledby="alerts-title">
          <div className="flex flex-col gap-1 border-b pb-4">
            <h2 id="alerts-title" className="text-2xl">Live donation alerts</h2>
            <p className="text-muted-foreground text-sm">Sorted by proximity and pickup urgency.</p>
          </div>
          {loadError ? (
            <Alert variant="destructive"><Package /><AlertTitle>Inbox unavailable</AlertTitle><AlertDescription>{loadError}</AlertDescription></Alert>
          ) : <NgoInboxWorkspace candidates={serializedCandidates} />}
        </section>

        <Card className="bg-muted/50 h-fit lg:sticky lg:top-24">
          <CardHeader className="gap-2">
            <CardTitle>Next step</CardTitle>
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
