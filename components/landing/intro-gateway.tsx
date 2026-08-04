"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  CheckCircle,
  Clock,
  ForkKnife,
  Handshake,
  MapPin,
  Path,
  ShieldCheck,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getRoleHomePath, type AppRole } from "@/lib/auth/roles"

type IntroGatewayProps = {
  signedInRole?: AppRole | null
  redirectDelayMs?: number
}

const introHighlights = [
  {
    title: "01. Report surplus",
    description: "Donors enter food quantity, pickup time, and location coordinates in under 60 seconds.",
    imagePath: "/intro/food-donation.jpg",
    imageAlt: "Volunteers stacking food donation boxes",
    icon: Clock,
  },
  {
    title: "02. Match quickly",
    description: "Nearby verified NGOs are alerted immediately so the first available team can accept the rescue.",
    imagePath: "/intro/ngo-match.jpg",
    imageAlt: "Volunteers preparing food in a community kitchen",
    icon: MapPin,
  },
  {
    title: "03. Verify handoff",
    description: "Live tracking and a 6-digit PIN keep every pickup and delivery accountable.",
    imagePath: "/intro/delivery-tracking.jpg",
    imageAlt: "Delivery driver transporting a food box for dropoff",
    icon: Path,
  },
]

export function IntroGateway({ signedInRole = null, redirectDelayMs = 1500 }: IntroGatewayProps) {
  const router = useRouter()

  const signedInTarget = useMemo(() => getRoleHomePath(signedInRole), [signedInRole])

  useEffect(() => {
    if (!signedInTarget) return

    const redirectTimer = window.setTimeout(() => {
      router.replace(signedInTarget)
      router.refresh()
    }, redirectDelayMs)

    return () => window.clearTimeout(redirectTimer)
  }, [redirectDelayMs, router, signedInTarget])

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border/70 bg-background/95 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/home" className="flex min-w-0 items-center gap-3">
            <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
              <Handshake weight="fill" />
            </span>
            <span className="font-display truncate text-sm font-semibold tracking-tight sm:text-base">
              Food Rescue Network
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/sign-in" />} nativeButton={false}>
              Sign in
            </Button>
            <Button size="sm" render={<Link href="/donor/new" />} nativeButton={false}>
              Report surplus
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="outline" className="gap-2 font-mono text-[10px] uppercase tracking-widest">
              <ShieldCheck data-icon="inline-start" weight="fill" />
              Verified rescue network
            </Badge>
            <div className="flex flex-col gap-4">
              <h1 className="font-display max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Turn surplus meals into a verified rescue signal.
              </h1>
              <p className="text-muted-foreground max-w-xl text-base leading-relaxed sm:text-lg">
                Real-time matching between food donors, community kitchens, and volunteer dispatch couriers—so good food moves while it is still useful.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/home" />} nativeButton={false}>
                Explore the network
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/sign-up" />} nativeButton={false}>
                Join as NGO or volunteer
              </Button>
            </div>
            {signedInTarget ? (
              <div className="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium">
                <span className="bg-success size-2 animate-pulse rounded-full" />
                <p>
                  Signed in as <span className="font-mono font-semibold uppercase">{signedInRole}</span> — launching dashboard…
                </p>
              </div>
            ) : null}
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <CardTitle className="font-display text-lg">Rescue bridge status</CardTitle>
                <p className="text-muted-foreground text-xs">A single chain from report to handoff.</p>
              </div>
              <Badge variant="secondary" className="gap-1.5">
                <CheckCircle data-icon="inline-start" weight="fill" />
                Live
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Donor", "Reported"],
                  ["NGO", "Matched"],
                  ["Courier", "Verified"],
                ].map(([label, state]) => (
                  <div key={label} className="bg-background flex flex-col gap-1 rounded-md border p-3">
                    <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">{label}</span>
                    <span className="text-sm font-medium">{state}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
                  <ForkKnife weight="fill" />
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium">Every meal gets a traceable next step</span>
                  <span className="text-muted-foreground text-xs">Pickup windows, location, and handoff status stay visible to the right people.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 sm:grid-cols-3">
          {introHighlights.map((item) => (
            <Card key={item.title} className="overflow-hidden">
              <div className="relative h-44">
                <Image
                  src={item.imagePath}
                  alt={item.imageAlt}
                  fill
                  className="object-cover"
                  priority={item.title.startsWith("01")}
                />
              </div>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
                    <item.icon weight="duotone" />
                  </span>
                  <span className="text-warning font-mono text-[10px] font-semibold uppercase tracking-widest">Signal path</span>
                </div>
                <h2 className="font-display text-lg font-semibold">{item.title}</h2>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  )
}
