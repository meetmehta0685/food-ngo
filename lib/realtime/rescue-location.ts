import type { RescueAssignmentStatus } from "@prisma/client"

import { getAblyRest, isAblyConfigured } from "./ably-server"
import { rescueChannel } from "./authorization"

export const RESCUE_LOCATION_EVENT = "location:update"

export type RescueLocationMessage = {
  assignmentId: string
  lat: number
  lng: number
  accuracy: number
  speed: number | null
  heading: number | null
  rescueStatus: RescueAssignmentStatus
  clientTimestamp: string
  serverTimestamp: string
}

export function buildRescueLocationMessage(input: {
  assignmentId: string
  lat: number
  lng: number
  accuracy: number
  speed?: number
  heading?: number
  rescueStatus: RescueAssignmentStatus
  clientTimestamp: Date
  serverTimestamp?: Date
}): RescueLocationMessage {
  return {
    assignmentId: input.assignmentId,
    lat: input.lat,
    lng: input.lng,
    accuracy: input.accuracy,
    speed: input.speed ?? null,
    heading: input.heading ?? null,
    rescueStatus: input.rescueStatus,
    clientTimestamp: input.clientTimestamp.toISOString(),
    serverTimestamp: (input.serverTimestamp ?? new Date()).toISOString(),
  }
}

export async function publishRescueLocation(
  message: RescueLocationMessage,
) {
  if (!isAblyConfigured()) {
    return false
  }

  await getAblyRest()
    .channels.get(rescueChannel(message.assignmentId))
    .publish(RESCUE_LOCATION_EVENT, message)

  return true
}
