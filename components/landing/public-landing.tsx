"use client"

import { motion, useReducedMotion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  Buildings,
  HandHeart,
  MapPin,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"

const workflow = [
  {
    label: "Report",
    description: "Share what is available, when it can be collected, and where to find it.",
    icon: HandHeart,
  },
  {
    label: "Match",
    description: "Nearby NGO partners see the request and take ownership of the rescue.",
    icon: MapPin,
  },
  {
    label: "Deliver",
    description: "A volunteer completes the handoff and confirms it with a secure OTP.",
    icon: ShieldCheck,
  },
] as const

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
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 py-8 sm:gap-32 sm:py-12">
      <section
        className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.9fr)] lg:gap-20"
        aria-labelledby="landing-title"
      >
        <motion.div
          className="flex max-w-2xl flex-col gap-7"
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0.92, y: 14, filter: "blur(3px)" }
          }
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1
            id="landing-title"
            className="max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-balance sm:text-6xl lg:text-[4.5rem]"
          >
            Put good food back in motion.
          </h1>
          <p className="text-muted-foreground max-w-xl text-base leading-7 sm:text-lg">
            Food Rescue Network connects surplus food with nearby NGOs and volunteer drivers while the pickup window is still open.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/donor/new">
              Report surplus food
              <ArrowRight
                className="transition-transform duration-200 group-hover/button:translate-x-0.5"
                data-icon="inline-end"
              />
            </ButtonLink>
            <ButtonLink href="/sign-up" variant="outline">
              Join the network
            </ButtonLink>
          </div>
          <p className="text-muted-foreground max-w-lg text-sm leading-6">
            Built for households, kitchens, events, NGO teams, and volunteer drivers.
          </p>
        </motion.div>

        <motion.div
          className="overflow-hidden rounded-2xl border bg-card shadow-sm"
          aria-label="How a rescue moves"
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0.96, y: 18, scale: 0.985, filter: "blur(2px)" }
          }
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.82, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          whileHover={shouldReduceMotion ? undefined : { y: -4 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
        >
          <div className="relative aspect-[4/3]">
            <Image
              src="/intro/food-donation.jpg"
              alt="Volunteers moving packed meals through a community kitchen"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>
          <div className="grid grid-cols-3 divide-x border-t bg-card">
            {[
              "Report surplus",
              "Find a partner",
              "Confirm delivery",
            ].map((step) => (
              <span key={step} className="px-3 py-4 text-center font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:px-4">
                {step}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="how-it-works" className="scroll-mt-24" aria-labelledby="workflow-title">
        <div className="max-w-2xl">
          <h2 id="workflow-title" className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            One clear handoff, from surplus to delivery.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6 sm:text-base">
            Every role sees the next useful step, with the right context carried through the rescue.
          </p>
        </div>

        <div className="mt-10 grid divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {workflow.map((step, index) => {
            const Icon = step.icon

            return (
              <div key={step.label} className="relative flex flex-col gap-4 py-7 sm:px-7 sm:first:pl-0 sm:last:pr-0">
                <Icon className="text-primary size-6" weight="duotone" />
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold tracking-[-0.02em]">{step.label}</h3>
                  <p className="text-muted-foreground text-sm leading-6">{step.description}</p>
                </div>
                {index < workflow.length - 1 ? (
                  <ArrowRight className="text-border absolute right-[-0.7rem] top-1/2 hidden size-5 -translate-y-1/2 bg-background sm:block" aria-hidden="true" />
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      <section id="persona-donors" className="scroll-mt-24" aria-labelledby="roles-title">
        <div className="max-w-2xl">
          <h2 id="roles-title" className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Everyone sees the next useful step.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6 sm:text-base">
            Choose the path that matches your part in moving food where it is needed.
          </p>
        </div>

        <div className="mt-8 divide-y border-y">
          {rolePaths.map((role) => {
            const Icon = role.icon

            return (
              <article id={role.id} key={role.id} className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
                    <Icon weight="duotone" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-lg font-semibold tracking-[-0.02em]">{role.title}</h3>
                    <p className="text-muted-foreground max-w-2xl text-sm leading-6">{role.description}</p>
                  </div>
                </div>
                <ButtonLink href={role.href} variant="outline" className="shrink-0 sm:min-w-44">
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
      </section>

      <section aria-labelledby="cta-title">
        <div className="flex flex-col gap-6 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-2xl">
            <h2 id="cta-title" className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Have food to move today?
            </h2>
            <p className="text-primary-foreground/80 mt-2 text-sm leading-6 sm:text-base">
              Start a rescue request and let nearby partners take it from there.
            </p>
          </div>
          <ButtonLink href="/donor/new" variant="secondary" className="shrink-0">
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
  className,
}: {
  href: string
  children: ReactNode
  variant?: "default" | "secondary" | "outline"
  className?: string
}) {
  return (
    <Button
      render={<Link href={href} />}
      nativeButton={false}
      variant={variant}
      className={className}
    >
      {children}
    </Button>
  )
}
