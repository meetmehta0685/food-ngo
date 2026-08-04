import type { RescueAssignmentStatus } from "@prisma/client"

export const activeRescueStatuses: RescueAssignmentStatus[] = [
  "OFFERED",
  "ACCEPTED",
  "EN_ROUTE_TO_PICKUP",
  "ARRIVED_AT_PICKUP",
  "PICKED_UP",
  "EN_ROUTE_TO_NGO",
  "ARRIVED_AT_NGO",
]

export const volunteerBusyStatuses: RescueAssignmentStatus[] = [
  "ACCEPTED",
  "EN_ROUTE_TO_PICKUP",
  "ARRIVED_AT_PICKUP",
  "PICKED_UP",
  "EN_ROUTE_TO_NGO",
  "ARRIVED_AT_NGO",
]

const transitions: Record<RescueAssignmentStatus, RescueAssignmentStatus[]> = {
  OFFERED: ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
  ACCEPTED: ["EN_ROUTE_TO_PICKUP", "CANCELLED", "FAILED"],
  EN_ROUTE_TO_PICKUP: [
    "ARRIVED_AT_PICKUP",
    "PICKED_UP",
    "CANCELLED",
    "FAILED",
  ],
  ARRIVED_AT_PICKUP: ["PICKED_UP", "CANCELLED", "FAILED"],
  PICKED_UP: ["EN_ROUTE_TO_NGO", "FAILED"],
  EN_ROUTE_TO_NGO: ["ARRIVED_AT_NGO", "FAILED"],
  ARRIVED_AT_NGO: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  REJECTED: [],
  EXPIRED: [],
  CANCELLED: [],
  FAILED: [],
}

export function canTransitionRescueAssignment(
  from: RescueAssignmentStatus,
  to: RescueAssignmentStatus,
) {
  return transitions[from].includes(to)
}

export function assertRescueAssignmentTransition(
  from: RescueAssignmentStatus,
  to: RescueAssignmentStatus,
) {
  if (!canTransitionRescueAssignment(from, to)) {
    throw new Error(`INVALID_RESCUE_TRANSITION:${from}->${to}`)
  }
}

export function rescueStatusLabel(status: RescueAssignmentStatus) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
