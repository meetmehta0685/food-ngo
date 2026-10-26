import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ArrowRight, MapPin, Package, Plus } from "@phosphor-icons/react/dist/ssr"

import { DonorDonationsTable } from "@/components/donor/donations-table"
import { KolamRoute } from "@/components/kolam/kolam-route"
import { MapView } from "@/components/maps/map-view"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth/options"
import { getRoleHomePath } from "@/lib/auth/roles"

const rescueFlow = [
  {
    key: "report",
    label: "Report",
    detail: "Share safe surplus and a pickup window.",
  },
  {
    key: "match",
    label: "Match",
    detail: "A nearby partner takes ownership.",
  },
  {
    key: "handoff",
    label: "Handoff",
    detail: "The delivery is confirmed and visible.",
  },
] as const

const donorRequestsQueryTimeoutMs = 30_000

export default async function DonorRequestsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect("/sign-in")
  if (session.user.role !== "DONOR") redirect(getRoleHomePath(session.user.role) ?? "/home")

  const listDonations = () =>
    db.donation.findMany({
      where: { donorId: session.user.id },
      select: {
        id: true,
        foodType: true,
        quantity: true,
        servesCount: true,
        status: true,
        pickupBy: true,
        assignedNgo: {
          select: {
            name: true,
            ngoProfile: { select: { orgName: true, lat: true, lng: true } },
          },
        },
        address: true,
        lat: true,
        lng: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

  let donations: Awaited<ReturnType<typeof listDonations>> = []
  let loadError: string | null = null

  try {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    try {
      donations = await Promise.race([
        listDonations(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error("DONOR_REQUESTS_QUERY_TIMEOUT")),
            donorRequestsQueryTimeoutMs,
          )
        }),
      ])
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "DONOR_REQUESTS_QUERY_TIMEOUT") {
      console.warn("Donor requests query timed out; showing the fallback state.")
    } else {
      console.error("donor requests load error", error)
    }
    loadError = "Could not load your donation history right now. You can still create a new request."
  }

  const totalMealsDonated = donations.reduce((acc, donation) => acc + (donation.servesCount || 0), 0)
  const totalCo2SavedKg = Math.round(totalMealsDonated * 0.3)
  const mapDonation = donations.find((donation) => donation.status !== "DELIVERED") ?? donations[0]
  const serializedDonations = donations.map((donation) => ({
    id: donation.id,
    foodType: donation.foodType,
    quantity: donation.quantity,
    servesCount: donation.servesCount,
    status: donation.status,
    pickupBy: donation.pickupBy.toISOString(),
    assignedNgo: donation.assignedNgo
      ? { name: donation.assignedNgo.name, ngoProfile: donation.assignedNgo.ngoProfile ? { orgName: donation.assignedNgo.ngoProfile.orgName } : null }
      : null,
  }))

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl sm:text-5xl">Your rescue history</h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">Welcome back, {session.user.name || "donor"}. Broadcast a new request or follow an active handover.</p>
        </div>
        <Button render={<Link href="/donor/new" />} nativeButton={false} size="lg" className="w-fit shrink-0">
          <Plus data-icon="inline-start" />
          Report surplus
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <dl className="grid grid-cols-1 border-y sm:grid-cols-3 sm:divide-x">
        <LedgerFigure label="Meals donated" value={`${totalMealsDonated.toLocaleString()}+`} />
        <LedgerFigure label="Estimated CO₂ saved" value={`${totalCo2SavedKg.toLocaleString()} kg`} />
        <LedgerFigure label="Requests in history" value={String(donations.length)} />
      </dl>

      {loadError ? (
        <Alert variant="destructive">
          <Package />
          <AlertTitle>History is temporarily unavailable</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl">Recent rescue requests</h2>
              <p className="text-muted-foreground text-sm">Track matching, pickup, and verified handover states.</p>
            </div>
            <Badge variant="outline">{donations.length} total</Badge>
          </div>
          <DonorDonationsTable donations={serializedDonations} unavailable={Boolean(loadError)} />

          <div className="mt-6 flex flex-col gap-5 border-t pt-6">
            <div>
              <h3 className="text-xl">How each rescue moves</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                One clear chain from surplus to a verified handoff.
              </p>
            </div>
            <KolamRoute stages={rescueFlow} current={2} complete label="How each rescue moves" />
          </div>
        </section>

        <Card className="h-fit">
          <CardHeader className="gap-2">
            <CardTitle>Partner signal map</CardTitle>
            <CardDescription>
              {mapDonation ? "Latest active request and its assigned partner route." : "Your first request will create the first rescue route."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {mapDonation ? (
              <>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
                  <span className="text-primary inline-flex items-center gap-1.5"><MapPin weight="fill" /> Pickup pin</span>
                  <span className="text-muted-foreground inline-flex items-center gap-1.5"><MapPin /> Assigned partner</span>
                </div>
                <MapView
                  className="h-80"
                  donor={{ lat: mapDonation.lat, lng: mapDonation.lng, label: `Pickup: ${mapDonation.address}` }}
                  ngo={mapDonation.assignedNgo?.ngoProfile ? { lat: mapDonation.assignedNgo.ngoProfile.lat, lng: mapDonation.assignedNgo.ngoProfile.lng, label: mapDonation.assignedNgo.ngoProfile.orgName } : null}
                />
              </>
            ) : (
              <Empty className="min-h-64 border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><MapPin weight="duotone" /></EmptyMedia>
                  <EmptyTitle>No route to show yet</EmptyTitle>
                  <EmptyDescription>Once you broadcast surplus, its pickup pin and partner match will appear here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LedgerFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse gap-1 border-b py-5 last:border-b-0 sm:border-b-0 sm:px-6 sm:first:pl-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-display tabular text-4xl font-semibold leading-none tracking-[-0.02em]">{value}</dd>
    </div>
  )
}
