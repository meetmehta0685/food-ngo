import { haversineKm } from "../maps/distance"

export const GEOFENCE_RADIUS_METERS = 125
export const GEOFENCE_MAX_ACCURACY_METERS = 50
export const GEOFENCE_DWELL_MS = 20_000

export type GeofenceEvaluation = {
  distanceMeters: number
  trusted: boolean
  inside: boolean
  arrived: boolean
  enteredAt: Date | null
}

export function evaluateGeofence(input: {
  lat: number
  lng: number
  accuracy: number
  targetLat: number
  targetLng: number
  enteredAt: Date | null
  now: Date
}): GeofenceEvaluation {
  const distanceMeters =
    haversineKm(input.lat, input.lng, input.targetLat, input.targetLng) * 1000
  const trusted = input.accuracy <= GEOFENCE_MAX_ACCURACY_METERS

  if (!trusted) {
    return {
      distanceMeters,
      trusted,
      inside: false,
      arrived: false,
      enteredAt: input.enteredAt,
    }
  }

  const inside = distanceMeters <= GEOFENCE_RADIUS_METERS

  if (!inside) {
    return {
      distanceMeters,
      trusted,
      inside,
      arrived: false,
      enteredAt: null,
    }
  }

  const enteredAt = input.enteredAt ?? input.now
  const arrived =
    input.now.getTime() - enteredAt.getTime() >= GEOFENCE_DWELL_MS

  return {
    distanceMeters,
    trusted,
    inside,
    arrived,
    enteredAt,
  }
}
