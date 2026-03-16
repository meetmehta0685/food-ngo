import Link from "next/link";
import { Leaf } from "@phosphor-icons/react/dist/ssr";

import { SignOutButton } from "@/components/layout/sign-out-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TopNavProps = {
  user?: {
    id: string;
    name?: string | null;
    role?: "DONOR" | "NGO";
  };
  hideRoleLinks?: boolean;
  forcePublicAuthCtas?: boolean;
};

export function TopNav({
  user,
  hideRoleLinks = false,
  forcePublicAuthCtas = false,
}: TopNavProps) {
  const donorLinks = [
    { href: "/donor/new", label: "Report food" },
    { href: "/donor/requests", label: "My requests" },
  ];

  const ngoLinks = [
    { href: "/ngo/inbox", label: "Inbox" },
    { href: "/ngo/deliveries", label: "Deliveries" },
  ];

  const links = user?.role === "NGO" ? ngoLinks : donorLinks;

  return (
    <header className="border-b border-border/60 bg-background/80 sticky top-0 z-40 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/home" className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Leaf weight="fill" className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg tracking-tight hidden sm:block">
              Food Rescue
            </span>
          </Link>
          {user && !hideRoleLinks ? (
            <nav className="hidden items-center gap-0.5 sm:flex">
              {links.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground text-sm font-medium"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {user?.role && !forcePublicAuthCtas ? (
            <Badge
              variant="outline"
              className="border-primary/30 text-primary font-mono text-[10px] uppercase tracking-widest"
            >
              {user.role}
            </Badge>
          ) : null}
          {user && !forcePublicAuthCtas ? <NotificationBell /> : null}
          {user && !forcePublicAuthCtas ? (
            <SignOutButton />
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="text-sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
