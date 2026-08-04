"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { TopNav } from "@/components/layout/top-nav";
import { LiveEventListener } from "@/components/realtime/live-event-listener";
import { getRoleHomePath, type AppRole } from "@/lib/auth/roles";

type AppShellProps = {
  children: ReactNode;
  user?: {
    id: string;
    name?: string | null;
    role?: AppRole;
  };
};

export function AppShell({ children, user }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isIntroRoute = pathname === "/";
  const isRegistrationRoute = pathname === "/sign-up";

  useEffect(() => {
    if (!user || !isRegistrationRoute) {
      return;
    }

    const destination = getRoleHomePath(user.role);

    if (destination) {
      router.replace(destination);
    }
  }, [isRegistrationRoute, router, user]);

  if (isIntroRoute) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <div className="flex-1">
        <TopNav
          user={user}
          hideRoleLinks={pathname === "/home"}
          forcePublicAuthCtas={pathname === "/home"}
        />
        {user && !isIntroRoute ? (
          <LiveEventListener userId={user.id} />
        ) : null}
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
      </div>

      {!user ? <Footer /> : null}
    </div>
  );
}
