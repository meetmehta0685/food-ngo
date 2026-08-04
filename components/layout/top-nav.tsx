"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  Bell,
  Buildings,
  CaretRight,
  HandHeart,
  Handshake,
  List,
  Truck,
  X,
} from "@phosphor-icons/react"

import { NotificationBell } from "@/components/notifications/notification-bell"
import { SignOutButton } from "@/components/layout/sign-out-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { AppRole } from "@/lib/auth/roles"

type TopNavProps = {
  user?: {
    id: string
    name?: string | null
    role?: AppRole
  }
  hideRoleLinks?: boolean
  forcePublicAuthCtas?: boolean
}

const roleLinks: Record<NonNullable<AppRole>, { href: string; label: string }[]> = {
  DONOR: [
    { href: "/donor/requests", label: "My rescues" },
    { href: "/donor/new", label: "Report surplus" },
  ],
  NGO: [
    { href: "/ngo/inbox", label: "Rescue inbox" },
    { href: "/ngo/deliveries", label: "Logistics" },
  ],
  VOLUNTEER: [{ href: "/volunteer", label: "Dispatch radar" }],
}

const roleLabels: Record<NonNullable<AppRole>, string> = {
  DONOR: "Donor",
  NGO: "NGO partner",
  VOLUNTEER: "Volunteer",
}

function RoleIcon({ role }: { role?: AppRole }) {
  if (role === "NGO") return <Buildings weight="duotone" />
  if (role === "VOLUNTEER") return <Truck weight="duotone" />
  return <HandHeart weight="duotone" />
}

export function TopNav({
  user,
  hideRoleLinks = false,
  forcePublicAuthCtas = false,
}: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const showPublic = !user || forcePublicAuthCtas
  const links = user?.role ? roleLinks[user.role] : []
  const displayName = user?.name || (user?.role ? roleLabels[user.role] : "")
  const publicAuthHref = pathname === "/sign-in" ? "/sign-up" : "/sign-in"
  const publicAuthLabel = pathname === "/sign-in" ? "Create account" : "Sign in"

  return (
    <header className="border-border/70 bg-background border-b">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/home" className="group flex min-w-0 items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm transition-transform group-hover:rotate-[-4deg]">
            <Handshake weight="duotone" />
          </span>
          <span className="min-w-0">
            <span className="text-foreground block truncate text-sm font-bold tracking-tight sm:text-base">
              Food Rescue <span className="text-primary">Network</span>
            </span>
            <span className="text-muted-foreground hidden truncate font-mono text-[0.625rem] uppercase tracking-[0.16em] sm:block">
              Food rescue, made clear
            </span>
          </span>
        </Link>

        {user && !hideRoleLinks ? (
          <nav className="hidden items-center gap-1.5 md:flex" aria-label="Workspace navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-1.5">
          {user?.role && !forcePublicAuthCtas ? (
            <Badge variant="secondary" className="hidden items-center gap-1.5 sm:inline-flex">
              <RoleIcon role={user.role} />
              <span className="max-w-28 truncate">{displayName}</span>
            </Badge>
          ) : null}

          {user && !forcePublicAuthCtas ? <NotificationBell /> : null}

          {showPublic ? (
            <Link
              href={publicAuthHref}
              className="text-muted-foreground hover:text-foreground px-2 text-xs font-medium transition-colors"
            >
              {publicAuthLabel}
            </Link>
          ) : (
            <div className="hidden sm:block">
              <SignOutButton />
            </div>
          )}

          {!showPublic ? (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Open navigation" />
                }
              >
                {mobileMenuOpen ? <X /> : <List />}
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(88vw,22rem)] px-0">
                <SheetHeader className="border-border border-b px-6 pb-5">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                      <Handshake weight="duotone" />
                    </span>
                    Food Rescue Network
                  </SheetTitle>
                  <SheetDescription className="text-left">
                    Choose a route for your rescue work.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-1 px-6 py-5">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-foreground hover:bg-muted flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                    >
                      {link.label}
                      <CaretRight />
                    </Link>
                  ))}
                  <div className="border-border mt-4 flex flex-col gap-2 border-t pt-4">
                    <Link
                      href="/notifications"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium"
                    >
                      <Bell /> Notifications
                    </Link>
                    <SignOutButton />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      </div>
    </header>
  )
}
