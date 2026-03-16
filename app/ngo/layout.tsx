import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";

type NgoLayoutProps = {
  children: ReactNode;
};

export default async function NgoLayout({ children }: NgoLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "NGO") {
    redirect("/donor/requests");
  }

  return <>{children}</>;
}
