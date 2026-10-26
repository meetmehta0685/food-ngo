import { after } from "next/server"

import { publishPendingLiveEvents } from "@/lib/realtime/outbox"
import { processExpiredRescueOffers } from "@/lib/rescue/service"

const MIN_INTERVAL_MS = 2_000

let lastRunAt = 0

// There is no long-running worker on serverless hosts, so authenticated
// requests drive offer expiry and the realtime outbox after their response.
// Both steps claim rows with SKIP LOCKED, so overlapping runs are safe.
export function scheduleBackgroundSync() {
  const now = Date.now()

  if (now - lastRunAt < MIN_INTERVAL_MS) {
    return
  }

  lastRunAt = now

  after(async () => {
    try {
      await processExpiredRescueOffers()
      await publishPendingLiveEvents()
    } catch (error) {
      console.error("background sync failed", error)
    }
  })
}
