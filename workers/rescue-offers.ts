import { db } from "@/lib/db"
import { isAblyConfigured } from "@/lib/realtime/ably-server"
import { publishPendingLiveEvents } from "@/lib/realtime/outbox"
import { getRescueDispatchConfig } from "@/lib/rescue/dispatch"
import { processExpiredRescueOffers } from "@/lib/rescue/service"

const config = getRescueDispatchConfig()
let stopping = false
let timer: NodeJS.Timeout | undefined
let lastHeartbeatAt = 0

function scheduleNextRun() {
  if (stopping) {
    return
  }

  timer = setTimeout(runOnce, config.workerPollIntervalMs)
}

async function runOnce() {
  try {
    const [rescueResult, realtimeResult] = await Promise.all([
      processExpiredRescueOffers({
        batchSize: config.workerBatchSize,
      }),
      publishPendingLiveEvents(),
    ])
    const now = Date.now()

    if (rescueResult.expired > 0) {
      console.info("[rescue-worker] offer batch complete", rescueResult)
    }

    if (realtimeResult.claimed > 0) {
      console.info("[rescue-worker] realtime batch complete", realtimeResult)
    }

    if (now - lastHeartbeatAt >= 30_000) {
      console.info("[rescue-worker] healthy", {
        pollIntervalMs: config.workerPollIntervalMs,
        batchSize: config.workerBatchSize,
        realtimeConfigured: isAblyConfigured(),
      })
      lastHeartbeatAt = now
    }
  } catch (error) {
    console.error("[rescue-worker] batch failed", error)
  } finally {
    scheduleNextRun()
  }
}

async function shutdown(signal: string) {
  if (stopping) {
    return
  }

  stopping = true

  if (timer) {
    clearTimeout(timer)
  }

  console.info("[rescue-worker] stopping", { signal })
  await db.$disconnect()
  process.exit(0)
}

process.once("SIGINT", () => {
  void shutdown("SIGINT")
})
process.once("SIGTERM", () => {
  void shutdown("SIGTERM")
})

console.info("[rescue-worker] started", {
  pollIntervalMs: config.workerPollIntervalMs,
  offerDurationMs: config.offerDurationMs,
  maxAttempts: config.maxAttempts,
  batchSize: config.workerBatchSize,
  realtimeConfigured: isAblyConfigured(),
})

void runOnce()
