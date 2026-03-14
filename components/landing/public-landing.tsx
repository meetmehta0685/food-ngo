import Link from "next/link"
import { ArrowRight, CheckCircle, Handshake, MapTrifold, Path, Users } from "@phosphor-icons/react/dist/ssr"

import { ContactSection } from "@/components/landing/contact-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { LandingMetrics } from "@/lib/landing/metrics"

const flowSteps = [
  {
    step: "01",
    title: "Report",
    description: "Donor enters food details, pickup time, and precise location with pin-drop.",
    icon: MapTrifold,
  },
  {
    step: "02",
    title: "Match",
    description: "Top 3 nearest NGOs get notified instantly. First accepted NGO gets assigned.",
    icon: Users,
  },
  {
    step: "03",
    title: "Deliver",
    description: "NGO drives pickup and delivery while donor and NGO both track every status update.",
    icon: Path,
  },
]

const trustPoints = [
  { text: "Shared donor + NGO tracking board for each donation", icon: Handshake },
  { text: "Immutable status timeline from report to delivered", icon: CheckCircle },
  { text: "Realtime in-app notifications and toasts on milestone updates", icon: CheckCircle },
]

export function PublicLanding({ metrics }: { metrics: LandingMetrics }) {
  return (
    <div className="relative isolate mx-auto flex w-full max-w-6xl flex-col gap-16 py-4 sm:py-6">
      {/* Subtle dot grid behind hero */}
      <div className="dot-grid pointer-events-none absolute inset-0 -z-10 h-[600px] opacity-50" />

      {/* Quick nav */}
      <nav className="flex flex-wrap gap-2">
        <a href="#about">
          <Button variant="ghost" className="text-sm text-muted-foreground">About</Button>
        </a>
        <a href="#how-it-works">
          <Button variant="ghost" className="text-sm text-muted-foreground">How It Works</Button>
        </a>
        <a href="#contact">
          <Button variant="ghost" className="text-sm text-muted-foreground">Contact</Button>
        </a>
      </nav>

      {/* Hero */}
      <section className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div className="space-y-6">
          <p className="text-primary font-mono text-xs font-medium uppercase tracking-[0.2em]">
            Food Rescue Coordination
          </p>
          <h1 className="font-serif text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Turn leftover food into same-night meals with verified NGO pickup.
          </h1>
          <p className="text-muted-foreground max-w-xl text-base leading-relaxed">
            Built for parties, events, and homes. Report food in under a minute, notify nearby NGOs,
            and keep delivery transparent from first ping to final handover.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-6 text-sm">
                Start donating food
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="h-12 px-6 text-sm">
                I am an NGO partner
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg border border-border/60 bg-card/80 p-4">
              <p className="font-serif text-2xl text-primary">Top 3</p>
              <p className="text-muted-foreground text-[11px] mt-1 leading-snug">Nearest NGO notification model</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card/80 p-4">
              <p className="font-serif text-2xl text-primary">Live</p>
              <p className="text-muted-foreground text-[11px] mt-1 leading-snug">Status + map updates via SSE</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card/80 p-4">
              <p className="font-serif text-2xl text-primary">Shared</p>
              <p className="text-muted-foreground text-[11px] mt-1 leading-snug">Donor and NGO transparency board</p>
            </div>
          </div>
        </div>

        {/* Timeline card */}
        <Card className="border-border/50 bg-card/90 backdrop-blur-sm shadow-xl shadow-primary/3">
          <CardHeader>
            <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">Transparency snapshot</p>
            <CardTitle className="font-serif text-xl">What one rescue looks like</CardTitle>
            <CardDescription>A real donation lifecycle from report to delivery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {[
                { label: "Donation reported by donor", time: "7:24 PM", active: false },
                { label: "Top nearby NGOs notified", time: "7:25 PM", active: false },
                { label: "NGO accepted and pickup started", time: "7:31 PM", active: false },
                { label: "Food delivered to beneficiaries", time: "8:04 PM", active: true },
              ].map((event, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${event.active ? "bg-primary animate-pulse-dot" : "bg-border"}`} />
                  <p className="text-sm flex-1">{event.label}</p>
                  <span className="font-mono text-[11px] text-muted-foreground">{event.time}</span>
                </div>
              ))}
            </div>
            <Separator />
            <p className="text-muted-foreground text-xs leading-relaxed">
              Both donor and NGO receive in-app milestone toasts at acceptance and delivery.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* About / Metrics */}
      <section id="about" className="space-y-6 scroll-mt-20">
        <div className="max-w-2xl space-y-2">
          <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest">About</p>
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            Built to reduce food waste with accountable delivery.
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Food Rescue Network helps donors and NGOs coordinate with clear ownership at every step.
            The platform focuses on fast action, transparent tracking, and measurable impact.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: metrics.activeNgos, label: "Active NGOs available" },
            { value: metrics.totalDonations, label: "Total donation requests" },
            { value: metrics.deliveredDonations, label: "Completed deliveries" },
            { value: metrics.mealsDelivered, label: "Estimated meals delivered" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border/60 bg-card/80 p-5">
              <p className="font-serif text-3xl text-foreground">{stat.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="space-y-6 scroll-mt-20">
        <div className="max-w-2xl space-y-2">
          <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest">How it works</p>
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            Simple by design, accountable by default.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {flowSteps.map((item) => (
            <div
              key={item.step}
              className="group rounded-xl border border-border/60 bg-card/80 p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon weight="duotone" className="h-5 w-5" />
                </span>
                <span className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  {item.step}
                </span>
              </div>
              <h3 className="font-serif text-2xl mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust sections */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/80 p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="font-serif text-2xl mb-1">Why this works for donors</h3>
            <p className="text-muted-foreground text-sm">No guesswork after you report food.</p>
          </div>
          <div className="space-y-3">
            {trustPoints.map((point) => (
              <div key={point.text} className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/60 px-4 py-3">
                <point.icon weight="duotone" className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{point.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/80 p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="font-serif text-2xl mb-1">Why this works for NGOs</h3>
            <p className="text-muted-foreground text-sm">Operational clarity from inbox to final delivery.</p>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            NGO teams receive nearby requests ranked by distance, accept in one click, and advance
            status through a dedicated delivery console with map tracking.
          </p>
          <Link href="/sign-up">
            <Button variant="outline" className="mt-2">
              Register as NGO
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="grid gap-4 scroll-mt-20 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-xl border border-border/60 bg-card/80 p-6 sm:p-8 space-y-5">
          <div>
            <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-2">Support</p>
            <h3 className="font-serif text-2xl mb-1">Need help quickly?</h3>
            <p className="text-muted-foreground text-sm">Use the contact form for fast responses from the operations team.</p>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Best for onboarding NGOs, donor assistance, local partnerships, and issue reporting.
          </p>
          <div className="space-y-2">
            <div className="rounded-lg border border-border/40 bg-background/60 px-4 py-3">
              <p className="text-xs font-semibold">Response window</p>
              <p className="text-muted-foreground text-xs mt-0.5">Usually within one business day.</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/60 px-4 py-3">
              <p className="text-xs font-semibold">What to include</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Location, request type, and a short summary so we can route it correctly.
              </p>
            </div>
          </div>
        </div>

        <ContactSection />
      </section>
    </div>
  )
}
