import { Prisma, type LiveEvent } from "@prisma/client"

import { db } from "@/lib/db"
import { getAblyRest, isAblyConfigured } from "@/lib/realtime/ably-server"
import { userChannel } from "@/lib/realtime/authorization"

const DEFAULT_BATCH_SIZE = 50
const CLAIM_LEASE_MS = 30_000
const MAX_RETRY_DELAY_MS = 5 * 60_000

export type RealtimeEventEnvelope = {
  version: 1
  eventId: string
  type: LiveEvent["eventType"]
  payload: Prisma.JsonValue
  createdAt: string
  serverTimestamp: string
}

export function toRealtimeEnvelope(event: LiveEvent): RealtimeEventEnvelope {
  return {
    version: 1,
    eventId: event.id.toString(),
    type: event.eventType,
    payload: event.payloadJson,
    createdAt: event.createdAt.toISOString(),
    serverTimestamp: new Date().toISOString(),
  }
}

function retryDelayMs(attempts: number) {
  return Math.min(MAX_RETRY_DELAY_MS, 1_000 * 2 ** Math.min(attempts, 8))
}

async function claimPendingEvents(batchSize: number) {
  const safeBatchSize = Math.min(100, Math.max(1, batchSize))

  return db.$transaction(async (tx) => {
    const claimed = await tx.$queryRaw<Array<{ id: bigint }>>(Prisma.sql`
      SELECT "id"
      FROM "LiveEvent"
      WHERE "ablyPublishedAt" IS NULL
        AND "ablyNextAttemptAt" <= NOW()
      ORDER BY "id" ASC
      LIMIT ${safeBatchSize}
      FOR UPDATE SKIP LOCKED
    `)

    const ids = claimed.map((event) => event.id)

    if (ids.length === 0) {
      return ids
    }

    await tx.liveEvent.updateMany({
      where: {
        id: { in: ids },
        ablyPublishedAt: null,
      },
      data: {
        ablyPublishAttempts: { increment: 1 },
        ablyNextAttemptAt: new Date(Date.now() + CLAIM_LEASE_MS),
        ablyLastError: null,
      },
    })

    return ids
  })
}

export async function publishPendingLiveEvents(input?: { batchSize?: number }) {
  if (!isAblyConfigured()) {
    return { claimed: 0, published: 0, failed: 0, skipped: true }
  }

  const ids = await claimPendingEvents(input?.batchSize ?? DEFAULT_BATCH_SIZE)

  if (ids.length === 0) {
    return { claimed: 0, published: 0, failed: 0, skipped: false }
  }

  const events = await db.liveEvent.findMany({
    where: { id: { in: ids }, ablyPublishedAt: null },
    orderBy: { id: "asc" },
  })
  const ably = getAblyRest()
  let published = 0
  let failed = 0

  for (const event of events) {
    try {
      await ably.channels
        .get(userChannel(event.userId))
        .publish(event.eventType, toRealtimeEnvelope(event))

      await db.liveEvent.updateMany({
        where: { id: event.id, ablyPublishedAt: null },
        data: {
          ablyPublishedAt: new Date(),
          ablyLastError: null,
        },
      })
      published += 1
    } catch (error) {
      const message =
        error instanceof Error ? error.message.slice(0, 500) : "Unknown Ably error"

      await db.liveEvent.updateMany({
        where: { id: event.id, ablyPublishedAt: null },
        data: {
          ablyLastError: message,
          ablyNextAttemptAt: new Date(
            Date.now() + retryDelayMs(event.ablyPublishAttempts),
          ),
        },
      })
      failed += 1
    }
  }

  return { claimed: ids.length, published, failed, skipped: false }
}
