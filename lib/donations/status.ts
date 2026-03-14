import type { DonationStatus } from "@prisma/client"

const transitions: Record<DonationStatus, DonationStatus[]> = {
  REPORTED: ["MATCHING", "CANCELLED"],
  MATCHING: ["NOTIFIED", "CANCELLED"],
  NOTIFIED: ["ACCEPTED", "MATCHING", "CANCELLED"],
  ACCEPTED: ["PICKUP_IN_PROGRESS", "CANCELLED"],
  PICKUP_IN_PROGRESS: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
}

export function canTransition(from: DonationStatus, to: DonationStatus) {
  return transitions[from].includes(to)
}

export function assertTransition(from: DonationStatus, to: DonationStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`INVALID_STATUS_TRANSITION:${from}->${to}`)
  }
}
