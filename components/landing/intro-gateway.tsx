"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Leaf, MapPin, Path, Timer } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"

type IntroGatewayProps = {
  signedInRole?: "DONOR" | "NGO" | null
  redirectDelayMs?: number
}

const introHighlights = [
  {
    title: "Report",
    description: "Donors share food details, pickup time, and pin-drop location in under a minute.",
    imagePath: "/intro/food-donation.jpg",
    imageAlt: "Volunteers stacking boxes for a food donation drive",
    icon: Timer,
  },
  {
    title: "Match",
    description: "The 3 nearest NGOs are notified instantly. First to accept gets assigned.",
    imagePath: "/intro/ngo-match.jpg",
    imageAlt: "Volunteers preparing food together in a community kitchen",
    icon: MapPin,
  },
  {
    title: "Deliver",
    description: "Live tracking from pickup to handover. Both parties see every milestone.",
    imagePath: "/intro/delivery-tracking.jpg",
    imageAlt: "Delivery rider cycling with a food box for drop-off",
    icon: Path,
  },
]

export function IntroGateway({ signedInRole = null, redirectDelayMs = 1500 }: IntroGatewayProps) {
  const router = useRouter()

  const signedInTarget = useMemo(() => {
    if (signedInRole === "DONOR") return "/donor/requests"
    if (signedInRole === "NGO") return "/ngo/inbox"
    return null
  }, [signedInRole])

  useEffect(() => {
    if (!signedInTarget) return

    const redirectTimer = window.setTimeout(() => {
      router.replace(signedInTarget)
      router.refresh()
    }, redirectDelayMs)

    return () => {
      window.clearTimeout(redirectTimer)
    }
  }, [redirectDelayMs, router, signedInTarget])

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      {/* Grain texture overlay */}
      <div className="grain-overlay pointer-events-none absolute inset-0 -z-10 opacity-60" />

      {/* Warm gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute -bottom-40 left-1/4 h-[350px] w-[350px] rounded-full bg-warm/8 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6 sm:px-6 sm:pt-8 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf weight="fill" className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg tracking-tight">Food Rescue</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="text-sm">
              Get started
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:pt-28">
        <div className="max-w-3xl animate-fade-up">
          <p className="text-primary mb-4 font-mono text-xs font-medium uppercase tracking-[0.2em]">
            Rescue / Route / Deliver
          </p>
          <h1 className="font-serif text-5xl leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Surplus food,{" "}
            <span className="text-primary">
              rescued tonight.
            </span>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
            Connect leftover food from events, parties, and homes to verified NGOs
            with live, transparent delivery tracking.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/home">
              <Button size="lg" className="text-sm h-12 px-6">
                Explore the platform
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="lg" variant="outline" className="text-sm h-12 px-6">
                Register as Donor or NGO
              </Button>
            </Link>
          </div>

          {signedInTarget ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
              <p className="text-sm">
                Signed in as <span className="font-semibold">{signedInRole}</span> &mdash; redirecting to your dashboard
              </p>
            </div>
          ) : null}
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {introHighlights.map((item, index) => (
            <div
              key={item.title}
              className="animate-fade-up group relative overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              style={{ animationDelay: `${(index + 1) * 150}ms` }}
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon weight="duotone" className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Step {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-serif text-xl mb-1">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
              <div className="border-t border-border/40 bg-muted/30">
                <Image
                  src={item.imagePath}
                  alt={item.imageAlt}
                  width={960}
                  height={640}
                  className="h-auto w-full opacity-90 transition-opacity group-hover:opacity-100"
                  priority={index === 0}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-16 animate-fade-up" style={{ animationDelay: "600ms" }}>
          <div className="text-center">
            <p className="font-serif text-3xl text-primary">Top 3</p>
            <p className="text-muted-foreground text-xs mt-1">Nearest NGOs notified</p>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div className="text-center">
            <p className="font-serif text-3xl text-primary">Live</p>
            <p className="text-muted-foreground text-xs mt-1">Shared tracking updates</p>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div className="text-center">
            <p className="font-serif text-3xl text-primary">Clear</p>
            <p className="text-muted-foreground text-xs mt-1">Audit-ready timeline</p>
          </div>
        </div>
      </main>
    </div>
  )
}
