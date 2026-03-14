import type { DonationStatus, LiveEventType, MatchState, NotificationChannel, NotificationType, Role } from "@prisma/client"

export type AppRole = Role
export type AppDonationStatus = DonationStatus
export type AppLiveEventType = LiveEventType
export type AppNotificationType = NotificationType
export type AppNotificationChannel = NotificationChannel
export type AppMatchState = MatchState

export type ApiErrorShape = {
  code: string
  message: string
  details?: unknown
}
