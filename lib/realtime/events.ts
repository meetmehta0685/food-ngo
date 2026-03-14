import { type LiveEventType, type Prisma } from "@prisma/client"

import { db } from "@/lib/db"

type Executor = Prisma.TransactionClient | typeof db

function getExecutor(tx?: Prisma.TransactionClient): Executor {
  return tx ?? db
}

export async function emitLiveEvent(
  userId: string,
  eventType: LiveEventType,
  payloadJson: Prisma.InputJsonValue,
  tx?: Prisma.TransactionClient,
) {
  const executor = getExecutor(tx)

  await executor.liveEvent.create({
    data: {
      userId,
      eventType,
      payloadJson,
    },
  })
}

export async function emitLiveEvents(
  userIds: string[],
  eventType: LiveEventType,
  payloadJson: Prisma.InputJsonValue,
  tx?: Prisma.TransactionClient,
) {
  const uniqueIds = Array.from(new Set(userIds))

  if (uniqueIds.length === 0) {
    return
  }

  const executor = getExecutor(tx)

  await executor.liveEvent.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      eventType,
      payloadJson,
    })),
  })
}
