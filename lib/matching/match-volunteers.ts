import { db } from "@/lib/db"
import { haversineKm } from "@/lib/maps/distance"
import { activeRescueStatuses } from "@/lib/rescue/status"

const LOCATION_FRESHNESS_MS = 10 * 60 * 1000

export type RankedVolunteerCandidate = {
  volunteerId: string
  volunteerName: string
  distanceKm: number
}

export async function getTopVolunteerCandidate(input: {
  pickupLat: number
  pickupLng: number
  estimatedWeightKg: number | null
  excludedVolunteerIds?: string[]
}) {
  const freshAfter = new Date(Date.now() - LOCATION_FRESHNESS_MS)

  const profiles = await db.volunteerProfile.findMany({
    where: {
      isAvailable: true,
      currentLat: { not: null },
      currentLng: { not: null },
      lastLocationAt: { gte: freshAfter },
      capacityKg:
        input.estimatedWeightKg === null
          ? undefined
          : { gte: input.estimatedWeightKg },
      userId:
        input.excludedVolunteerIds && input.excludedVolunteerIds.length > 0
          ? { notIn: input.excludedVolunteerIds }
          : undefined,
      user: {
        rescueAssignments: {
          none: {
            status: { in: activeRescueStatuses },
          },
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const ranked = profiles
    .flatMap((profile) => {
      if (profile.currentLat === null || profile.currentLng === null) {
        return []
      }

      const distanceKm = haversineKm(
        profile.currentLat,
        profile.currentLng,
        input.pickupLat,
        input.pickupLng,
      )

      if (distanceKm > profile.serviceRadiusKm) {
        return []
      }

      return [
        {
          volunteerId: profile.user.id,
          volunteerName: profile.user.name,
          distanceKm: Number(distanceKm.toFixed(2)),
        },
      ]
    })
    .sort(
      (a, b) =>
        a.distanceKm - b.distanceKm ||
        a.volunteerId.localeCompare(b.volunteerId),
    )

  return ranked[0] ?? null
}
