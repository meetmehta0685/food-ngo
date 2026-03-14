import { db } from "@/lib/db"
import { haversineKm } from "@/lib/maps/distance"

export type RankedNgoCandidate = {
  ngoUserId: string
  distanceKm: number
  rank: number
}

export async function getTopNgoCandidates(lat: number, lng: number, limit = 3) {
  const ngoProfiles = await db.ngoProfile.findMany({
    where: { isAvailable: true },
  })

  const ranked = ngoProfiles
    .map((profile) => {
      const distanceKm = haversineKm(lat, lng, profile.lat, profile.lng)
      return {
        ngoUserId: profile.userId,
        distanceKm,
        serviceRadiusKm: profile.serviceRadiusKm,
      }
    })
    .filter((item) => item.distanceKm <= item.serviceRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
    .map((candidate, index) => ({
      ngoUserId: candidate.ngoUserId,
      distanceKm: Number(candidate.distanceKm.toFixed(2)),
      rank: index + 1,
    }))

  return ranked
}
