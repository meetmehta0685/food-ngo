"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

import { TopNav } from "@/components/layout/top-nav"
import { LiveEventListener } from "@/components/realtime/live-event-listener"

type AppShellProps = {
  children: ReactNode
  user?: {
    id: string
    name?: string | null
    role?: "DONOR" | "NGO"
  }
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const isIntroRoute = pathname === "/"

  if (isIntroRoute) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav user={user} />
      {user && !isIntroRoute ? <LiveEventListener /> : null}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}
