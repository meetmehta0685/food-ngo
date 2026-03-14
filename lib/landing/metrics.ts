import { db } from "@/lib/db"

export type LandingMetrics = {
  activeNgos: number
  totalDonations: number
  deliveredDonations: number
  mealsDelivered: number
}

export async function getLandingMetrics(): Promise<LandingMetrics> {
  const [activeNgos, totalDonations, deliveredDonations, mealsDeliveredAgg] = await Promise.all([
    db.ngoProfile.count({ where: { isAvailable: true } }),
    db.donation.count(),
    db.donation.count({ where: { status: "DELIVERED" } }),
    db.donation.aggregate({
      where: { status: "DELIVERED" },
      _sum: { servesCount: true },
    }),
  ])

  return {
    activeNgos,
    totalDonations,
    deliveredDonations,
    mealsDelivered: mealsDeliveredAgg._sum.servesCount ?? 0,
  }
}
