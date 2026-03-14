import type { DonationStatus } from "@prisma/client"

export function statusLabel(status: DonationStatus) {
  return status.replaceAll("_", " ")
}

export function nextNgoStatus(current: DonationStatus): DonationStatus | null {
  if (current === "ACCEPTED") {
    return "PICKUP_IN_PROGRESS"
  }

  if (current === "PICKUP_IN_PROGRESS") {
    return "PICKED_UP"
  }

  if (current === "PICKED_UP") {
    return "DELIVERED"
  }

  return null
}
