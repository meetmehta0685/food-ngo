"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  Bell,
  Buildings,
  CaretRight,
  HandHeart,
  List,
  Truck,
  X,
} from "@phosphor-icons/react"

import { KolamMark } from "@/components/kolam/kolam-mark"
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
import { cn } from "@/lib/utils"

type TopNavProps = {
  user?: {
    id: string
    name?: string | null
    role?: AppRole
  }
  hideRoleLinks?: boolean
  forcePublicAuthCtas?: boolean
  tone?: "threshold" | "sheet"
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
  if (role === "NGO") return <Buildings weight="bold" className="size-4" />
  if (role === "VOLUNTEER") return <Truck weight="bold" className="size-4" />
  return <HandHeart weight="bold" className="size-4" />
}

export function TopNav({
  user,
  hideRoleLinks = false,
  forcePublicAuthCtas = false,
  tone = "sheet",
}: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const showPublic = !user || forcePublicAuthCtas
  const links = user?.role ? roleLinks[user.role] : []
  const displayName = user?.name || (user?.role ? roleLabels[user.role] : "")
  const publicAuthHref = pathname === "/sign-in" ? "/sign-up" : "/sign-in"
  const publicAuthLabel = pathname === "/sign-in" ? "Create account" : "Sign in"

  const onThreshold = tone === "threshold"

  return (
    <header
      className={cn(
        "relative z-20",
        onThreshold
          ? "bg-threshold text-threshold-foreground"
          : "bg-background/92 supports-[backdrop-filter]:bg-background/80 sticky top-0 border-b backdrop-blur-sm",
      )}
    >
      <div className={cn("mx-auto flex w-full items-center justify-between gap-4 px-4 sm:px-8", onThreshold ? "max-w-7xl py-5" : "max-w-6xl py-3")}>
        <Link href="/home" className="group flex min-w-0 items-center gap-2.5 rounded-sm">
          <KolamMark className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-[8deg]" />
          <span className="flex min-w-0 flex-col">
            <span className="font-display truncate text-lg font-semibold leading-none tracking-[-0.015em] sm:text-xl">
              Food Rescue Network
            </span>
            <span className={cn("hidden truncate pt-1 text-xs sm:block", onThreshold ? "text-threshold-muted" : "text-muted-foreground")}>
              Food rescue, made clear
            </span>
          </span>
        </Link>

        {user && !hideRoleLinks ? (
          <nav className="hidden items-center gap-6 md:flex" aria-label="Workspace navigation">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-sm font-semibold transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    "after:bg-primary after:absolute after:inset-x-0 after:-bottom-[0.85rem] after:h-0.5 after:origin-left after:scale-x-0 after:transition-transform after:duration-300 aria-[current=page]:after:scale-x-100",
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          {user?.role && !forcePublicAuthCtas ? (
            <span className="text-muted-foreground hidden items-center gap-2 text-sm lg:inline-flex">
              <RoleIcon role={user.role} />
              <span className="max-w-36 truncate font-medium text-foreground">{displayName}</span>
            </span>
          ) : null}

          {user && !forcePublicAuthCtas ? <NotificationBell /> : null}

          {showPublic ? (
            <Link
              href={publicAuthHref}
              className={cn(
                "rounded-sm px-2 py-2 text-sm font-semibold underline-offset-4 transition-colors hover:underline",
                onThreshold ? "text-threshold-foreground" : "text-foreground",
              )}
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
                  <Button variant="ghost" size="icon" aria-label="Open navigation" className="md:hidden" />
                }
              >
                {mobileMenuOpen ? <X /> : <List />}
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(88vw,22rem)] px-0">
                <SheetHeader className="border-b px-6 pb-5">
                  <SheetTitle className="font-display flex items-center gap-2.5 text-left text-xl">
                    <KolamMark className="size-7" />
                    Food Rescue Network
                  </SheetTitle>
                  <SheetDescription className="text-left">
                    Choose a route for your rescue work.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col px-3 py-4">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className="hover:bg-muted aria-[current=page]:text-primary flex items-center justify-between rounded-md px-3 py-3 text-base font-semibold transition-colors"
                    >
                      {link.label}
                      <CaretRight />
                    </Link>
                  ))}
                  <div className="mt-4 flex flex-col gap-2 border-t px-3 pt-4">
                    {user?.role ? (
                      <Badge variant="outline" className="mb-1 w-fit">
                        <RoleIcon role={user.role} />
                        {displayName}
                      </Badge>
                    ) : null}
                    <Link
                      href="/notifications"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-2 py-2 text-base font-medium"
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
