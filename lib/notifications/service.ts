import { type NotificationType, type Prisma, type DonationStatus, type User } from "@prisma/client"

import { db } from "@/lib/db"
import { emitLiveEvent, emitLiveEvents } from "@/lib/realtime/events"

type Executor = Prisma.TransactionClient | typeof db

type NotificationInput = {
  userId: string
  donationId?: string
  type: NotificationType
  title: string
  body: string
  metadata?: Prisma.InputJsonValue
}

function getExecutor(tx?: Prisma.TransactionClient): Executor {
  return tx ?? db
}

export async function createInAppNotification(
  input: NotificationInput,
  tx?: Prisma.TransactionClient,
) {
  const executor = getExecutor(tx)

  const notification = await executor.notification.create({
    data: {
      userId: input.userId,
      donationId: input.donationId,
      type: input.type,
      channel: "IN_APP",
      title: input.title,
      body: input.body,
      metadata: input.metadata,
      sentAt: new Date(),
    },
  })

  await emitLiveEvent(
    input.userId,
    "NOTIFICATION_CREATED",
    {
      notificationId: notification.id,
      donationId: input.donationId,
      title: input.title,
      body: input.body,
      createdAt: notification.createdAt.toISOString(),
    },
    tx,
  )

  return notification
}

export async function createInAppNotificationsForUsers(
  userIds: string[],
  payload: Omit<NotificationInput, "userId">,
  tx?: Prisma.TransactionClient,
) {
  const ids = Array.from(new Set(userIds))

  if (ids.length === 0) {
    return
  }

  const executor = getExecutor(tx)

  await executor.notification.createMany({
    data: ids.map((userId) => ({
      userId,
      donationId: payload.donationId,
      type: payload.type,
      channel: "IN_APP",
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata,
      sentAt: new Date(),
    })),
  })

  await emitLiveEvents(
    ids,
    "NOTIFICATION_CREATED",
    {
      donationId: payload.donationId,
      title: payload.title,
      body: payload.body,
      createdAt: new Date().toISOString(),
    },
    tx,
  )
}

export async function sendStatusMilestoneNotifications(input: {
  donor: Pick<User, "id" | "name">
  ngo: Pick<User, "id" | "name"> | null
  donationId: string
  status: DonationStatus
}) {
  const recipients = [input.donor, input.ngo].filter(Boolean) as Pick<User, "id" | "name">[]

  if (recipients.length === 0) {
    return
  }

  const title = `Donation ${input.status.replaceAll("_", " ")}`
  const body = `Donation #${input.donationId.slice(-6)} status updated to ${input.status.replaceAll("_", " ")}.`

  await createInAppNotificationsForUsers(
    recipients.map((user) => user.id),
    {
      donationId: input.donationId,
      type: "STATUS_CONFIRMED",
      title,
      body,
      metadata: { status: input.status },
    },
  )
}
