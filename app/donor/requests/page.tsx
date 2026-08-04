import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  ChartLineUp,
  CheckCircle,
  Leaf,
  MapPin,
  Package,
  Plus,
  Pulse,
  ForkKnife,
} from "@phosphor-icons/react/dist/ssr"

import { DonorDonationsTable } from "@/components/donor/donations-table"
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
    label: "Report",
    description: "Share safe surplus and a pickup window.",
    icon: ForkKnife,
  },
  {
    label: "Match",
    description: "A nearby partner takes ownership.",
    icon: MapPin,
  },
  {
    label: "Handoff",
    description: "The delivery is confirmed and visible.",
    icon: CheckCircle,
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Badge variant="outline" className="w-fit gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]">
            <Pulse data-icon="inline-start" />
            Donor workspace
          </Badge>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Your rescue history</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6">Welcome back, {session.user.name || "donor"}. Broadcast a new request or follow an active handover.</p>
        </div>
        <Button render={<Link href="/donor/new" />} nativeButton={false}>
          <Plus data-icon="inline-start" />
          Report surplus
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard icon={ForkKnife} label="Meals donated" value={`${totalMealsDonated.toLocaleString()}+`} />
        <MetricCard icon={Leaf} label="Estimated CO₂ saved" value={`${totalCo2SavedKg.toLocaleString()} kg`} />
        <MetricCard icon={ChartLineUp} label="Requests in history" value={String(donations.length)} />
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <Package />
          <AlertTitle>History is temporarily unavailable</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Recent rescue requests</h2>
              <p className="text-muted-foreground text-xs">Track matching, pickup, and verified handover states.</p>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px]">{donations.length} total</Badge>
          </div>
          <DonorDonationsTable donations={serializedDonations} unavailable={Boolean(loadError)} />

          <div className="border-border/80 mt-2 border-t pt-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <div>
                <h3 className="text-sm font-semibold tracking-[-0.02em]">How each rescue moves</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  One clear chain from surplus to a verified handoff.
                </p>
              </div>
              <span className="text-muted-foreground font-mono text-[0.625rem] uppercase tracking-[0.14em]">
                Rescue signal
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {rescueFlow.map((step) => {
                const Icon = step.icon

                return (
                  <div key={step.label} className="border-border/70 bg-card/55 flex items-start gap-2.5 rounded-md border px-3 py-2.5">
                    <span className="bg-primary/10 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md">
                      <Icon weight="duotone" />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-xs font-semibold">{step.label}</span>
                      <span className="text-muted-foreground text-[10px] leading-4">{step.description}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <Card className="h-fit">
          <CardHeader className="gap-2">
            <CardTitle className="text-base">Partner signal map</CardTitle>
            <CardDescription>
              {mapDonation ? "Latest active request and its assigned partner route." : "Your first request will create the first rescue route."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {mapDonation ? (
              <>
                <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border bg-surface p-3 text-[10px] font-medium">
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

function MetricCard({ icon: Icon, label, value }: { icon: typeof ForkKnife; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
          <Icon weight="duotone" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground truncate text-[10px] font-mono uppercase tracking-[0.1em]">{label}</span>
          <span className="text-foreground font-mono text-xl font-semibold tabular-nums">{value}</span>
        </div>
      </CardContent>
    </Card>
  )
}
