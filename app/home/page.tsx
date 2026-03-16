import { PublicLanding } from "@/components/landing/public-landing";
import { getLandingMetrics } from "@/lib/landing/metrics";

export default async function PublicHomePage() {
  const metrics = await getLandingMetrics().catch((error) => {
    console.error("landing metrics error", error);
    return {
      activeNgos: 0,
      totalDonations: 0,
      deliveredDonations: 0,
      mealsDelivered: 0,
    };
  });

  return <PublicLanding metrics={metrics} />;
}
