import { getServerSession } from "next-auth"

import { IntroGateway } from "@/components/landing/intro-gateway"
import { authOptions } from "@/lib/auth/options"

export default async function IntroPage() {
  const session = await getServerSession(authOptions)
  const signedInRole =
    session?.user?.role === "DONOR" || session?.user?.role === "NGO"
      ? session.user.role
      : null

  return <IntroGateway signedInRole={signedInRole} redirectDelayMs={1500} />
}
