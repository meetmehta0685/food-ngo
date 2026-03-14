import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { PublicLanding } from "@/components/landing/public-landing"
import { authOptions } from "@/lib/auth/options"
import { getLandingMetrics } from "@/lib/landing/metrics"

export default async function PublicHomePage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role === "DONOR") {
    redirect("/donor/requests")
  }

  if (session?.user?.role === "NGO") {
    redirect("/ngo/inbox")
  }

  const metrics = await getLandingMetrics().catch((error) => {
    console.error("landing metrics error", error)
    return {
      activeNgos: 0,
      totalDonations: 0,
      deliveredDonations: 0,
      mealsDelivered: 0,
    }
  })

  return <PublicLanding metrics={metrics} />
}
