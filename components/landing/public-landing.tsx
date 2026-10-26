import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight, Buildings, HandHeart, Truck } from "@phosphor-icons/react/dist/ssr"

import { KolamRoute, type KolamStage } from "@/components/kolam/kolam-route"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const rescueRoute: KolamStage[] = [
  { key: "report", label: "Surplus reported", detail: "Kitchen, home or event" },
  { key: "notify", label: "Nearest NGOs alerted", detail: "Up to three in range" },
  { key: "claim", label: "First NGO claims it", detail: "One owner, no overlap" },
  { key: "carry", label: "Volunteer carries it", detail: "Live route to the door" },
  { key: "verify", label: "Handover verified", detail: "Pickup OTP and receipt" },
]

const workflow: KolamStage[] = [
  {
    key: "report",
    label: "Report",
    detail: "Share what is available, when it can be collected, and where to find it.",
  },
  {
    key: "match",
    label: "Match",
    detail: "Nearby NGO partners see the request and take ownership of the rescue.",
  },
  {
    key: "deliver",
    label: "Deliver",
    detail: "A volunteer completes the handoff and confirms it with a secure OTP.",
  },
]

const rolePaths = [
  {
    id: "persona-donors",
    icon: HandHeart,
    title: "Donors",
    description: "Report safe surplus from a home, kitchen, event, hotel, or catering operation.",
    action: "Report surplus",
    href: "/donor/new",
  },
  {
    id: "persona-ngos",
    icon: Buildings,
    title: "NGO partners",
    description: "Find nearby requests, accept the right match, and coordinate the last mile.",
    action: "Join as an NGO",
    href: "/sign-up",
  },
  {
    id: "persona-volunteers",
    icon: Truck,
    title: "Volunteers",
    description: "Pick up time-sensitive rescue offers, share your route, and verify each handover.",
    action: "Join as a volunteer",
    href: "/sign-up",
  },
] as const

export function PublicLanding() {
  return (
    <div className="flex w-full flex-col">
      <section className="kolam-ground -mt-px" aria-labelledby="landing-title">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:pb-28">
          <div className="flex max-w-2xl flex-col gap-7">
            <h1
              id="landing-title"
              className="text-[2.9rem] leading-[0.95] font-semibold tracking-[-0.03em] sm:text-7xl lg:text-[5.75rem]"
            >
              Put good food back in motion.
            </h1>
            <p className="text-threshold-muted max-w-xl text-lg leading-relaxed sm:text-xl">
              Food Rescue Network connects surplus food with nearby NGOs and volunteer drivers while the pickup window is still open.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <ButtonLink href="/donor/new" size="lg">
                Report surplus food
                <ArrowRight
                  className="transition-transform duration-200 group-hover/button:translate-x-0.5"
                  data-icon="inline-end"
                />
              </ButtonLink>
              <ButtonLink
                href="/sign-up"
                variant="outline"
                size="lg"
                className="border-threshold-foreground/60 text-threshold-foreground hover:bg-threshold-foreground hover:text-threshold"
              >
                Join the network
              </ButtonLink>
            </div>
            <p className="text-threshold-muted max-w-lg text-sm leading-6">
              Built for households, kitchens, events, NGO teams, and volunteer drivers.
            </p>
          </div>

          <KolamRoute
            stages={rescueRoute}
            current={4}
            complete
            tone="threshold"
            size="hero"
            animate
            label="How one rescue travels from donor to NGO"
            className="w-full lg:justify-self-end lg:pl-8"
          />
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-b" aria-labelledby="workflow-title">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-8 sm:py-28 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
          <div className="flex flex-col gap-5">
            <h2 id="workflow-title" className="text-4xl sm:text-5xl">
              One clear handoff, from surplus to delivery.
            </h2>
            <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
              Every role sees the next useful step, with the right context carried through the rescue.
            </p>
          </div>
          <KolamRoute
            stages={workflow}
            current={2}
            complete
            orientation="responsive"
            label="The three stages of every rescue"
            className="self-center"
          />
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-8 sm:pb-28">
          <figure className="flex flex-col gap-3">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg sm:aspect-[21/9]">
              <Image
                src="/intro/food-donation.jpg"
                alt="Volunteers moving packed meals through a community kitchen"
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1216px"
              />
            </div>
            <figcaption className="text-muted-foreground text-sm">
              Packed meals leaving a community kitchen for the last mile.
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="persona-donors" className="scroll-mt-24" aria-labelledby="roles-title">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
          <div className="max-w-2xl">
            <h2 id="roles-title" className="text-4xl sm:text-5xl">
              Everyone sees the next useful step.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-relaxed">
              Choose the path that matches your part in moving food where it is needed.
            </p>
          </div>

          <div className="mt-12 border-t">
            {rolePaths.map((role) => {
              const Icon = role.icon

              return (
                <article
                  id={role.id}
                  key={role.id}
                  className="group grid scroll-mt-24 gap-5 border-b py-8 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-10"
                >
                  <h3 className="flex items-center gap-3 text-3xl">
                    <Icon className="text-primary size-6 shrink-0" weight="bold" aria-hidden="true" />
                    {role.title}
                  </h3>
                  <p className="text-muted-foreground max-w-xl text-base leading-relaxed sm:text-lg">{role.description}</p>
                  <ButtonLink href={role.href} variant="outline" className="w-fit shrink-0 sm:min-w-48">
                    {role.action}
                    <ArrowRight
                      className="transition-transform duration-200 group-hover/button:translate-x-0.5"
                      data-icon="inline-end"
                    />
                  </ButtonLink>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground" aria-labelledby="cta-title">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-16 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <h2 id="cta-title" className="text-4xl sm:text-6xl">
              Have food to move today?
            </h2>
            <p className="text-primary-foreground/85 mt-4 text-lg leading-relaxed">
              Start a rescue request and let nearby partners take it from there.
            </p>
          </div>
          <ButtonLink
            href="/donor/new"
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shrink-0"
          >
            Start a rescue
            <ArrowRight
              className="transition-transform duration-200 group-hover/button:translate-x-0.5"
              data-icon="inline-end"
            />
          </ButtonLink>
        </div>
      </section>
    </div>
  )
}

function ButtonLink({
  href,
  children,
  variant = "default",
  size = "default",
  className,
}: {
  href: string
  children: ReactNode
  variant?: "default" | "secondary" | "outline"
  size?: "default" | "lg"
  className?: string
}) {
  return (
    <Button
      render={<Link href={href} />}
      nativeButton={false}
      variant={variant}
      size={size}
      className={cn(className)}
    >
      {children}
    </Button>
  )
}
