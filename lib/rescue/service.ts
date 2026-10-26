import {
  Prisma,
  type RescueAssignmentStatus,
  type RescueEventType,
} from "@prisma/client"

import { db } from "@/lib/db"
import { createStatusEvent } from "@/lib/donations/service"
import { getTopVolunteerCandidate } from "@/lib/matching/match-volunteers"
import {
  createInAppNotification,
  createInAppNotificationsForUsers,
} from "@/lib/notifications/service"
import { emitLiveEvents } from "@/lib/realtime/events"
import {
  ngoProgressNotificationRecipients,
  volunteerTrackingRecipients,
} from "@/lib/rescue/audience"
import {
  getRescueDispatchConfig,
  isTerminalDispatchError,
  type TerminalDispatchError,
} from "@/lib/rescue/dispatch"
import { evaluateGeofence } from "@/lib/rescue/geofence"
import {
  generatePickupOtp,
  verifyPickupOtpHash,
} from "@/lib/rescue/otp"
import {
  activeRescueStatuses,
  assertRescueAssignmentTransition,
} from "@/lib/rescue/status"

type Tx = Prisma.TransactionClient

const PICKUP_OTP_DURATION_MS = 10 * 60 * 1000
const PICKUP_OTP_RESEND_COOLDOWN_MS = 30 * 1000
const PICKUP_OTP_MAX_ATTEMPTS = 5

async function nextEventSequence(tx: Tx, assignmentId: string) {
  const aggregate = await tx.rescueEvent.aggregate({
    where: { assignmentId },
    _max: { sequence: true },
  })

  return (aggregate._max.sequence ?? 0) + 1
}

async function createRescueEvent(
  tx: Tx,
  input: {
    assignmentId: string
    actorUserId?: string
    type: RescueEventType
    fromStatus?: RescueAssignmentStatus
    toStatus?: RescueAssignmentStatus
    note?: string
    metadata?: Prisma.InputJsonValue
  },
) {
  return tx.rescueEvent.create({
    data: {
      assignmentId: input.assignmentId,
      actorUserId: input.actorUserId,
      sequence: await nextEventSequence(tx, input.assignmentId),
      type: input.type,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      note: input.note,
      metadata: input.metadata,
    },
  })
}

export async function expireRescueOffers(input: {
  donationId?: string
  volunteerId?: string
  batchSize?: number
}) {
  const batchSize = input.batchSize ?? 20

  return db.$transaction(async (tx) => {
    const donationFilter = input.donationId
      ? Prisma.sql`AND "donationId" = ${input.donationId}`
      : Prisma.empty
    const volunteerFilter = input.volunteerId
      ? Prisma.sql`AND "volunteerId" = ${input.volunteerId}`
      : Prisma.empty

    const claimed = await tx.$queryRaw<
      Array<{ id: string; donationId: string }>
    >(Prisma.sql`
      SELECT "id", "donationId"
      FROM "RescueAssignment"
      WHERE "status" = 'OFFERED'::"RescueAssignmentStatus"
        AND "offerExpiresAt" <= NOW()
        ${donationFilter}
        ${volunteerFilter}
      ORDER BY "offerExpiresAt" ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    `)

    const expiredAt = new Date()

    for (const assignment of claimed) {
      await tx.rescueAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "EXPIRED",
          respondedAt: expiredAt,
        },
      })

      await createRescueEvent(tx, {
        assignmentId: assignment.id,
        type: "OFFER_EXPIRED",
        fromStatus: "OFFERED",
        toStatus: "EXPIRED",
        note: "Volunteer offer expired",
      })
    }

    return claimed
  })
}

export async function requestVolunteerForDonation(input: {
  donationId: string
  ngoUserId: string
}) {
  await expireRescueOffers({ donationId: input.donationId })

  const donation = await db.donation.findUnique({
    where: { id: input.donationId },
    include: {
      assignedNgo: {
        include: {
          ngoProfile: true,
        },
      },
      rescueAssignments: {
        select: {
          volunteerId: true,
          attemptNumber: true,
          status: true,
        },
      },
    },
  })

  if (!donation || donation.assignedNgoId !== input.ngoUserId) {
    throw new Error("FORBIDDEN")
  }

  if (donation.status !== "ACCEPTED") {
    throw new Error("DONATION_NOT_READY")
  }

  if (!donation.assignedNgo?.ngoProfile) {
    throw new Error("NGO_LOCATION_REQUIRED")
  }

  const ngoProfile = donation.assignedNgo.ngoProfile

  const activeAssignment = donation.rescueAssignments.find((assignment) =>
    activeRescueStatuses.includes(assignment.status),
  )

  if (activeAssignment) {
    throw new Error("ACTIVE_ASSIGNMENT_EXISTS")
  }

  const config = getRescueDispatchConfig()
  const previousAttemptCount = donation.rescueAssignments.length

  if (previousAttemptCount >= config.maxAttempts) {
    throw new Error("DISPATCH_ATTEMPTS_EXHAUSTED")
  }

  const candidate = await getTopVolunteerCandidate({
    pickupLat: donation.lat,
    pickupLng: donation.lng,
    estimatedWeightKg: donation.estimatedWeightKg,
    excludedVolunteerIds: donation.rescueAssignments.map(
      (assignment) => assignment.volunteerId,
    ),
  })

  if (!candidate) {
    throw new Error("NO_VOLUNTEER_AVAILABLE")
  }

  const attemptNumber =
    Math.max(
      0,
      ...donation.rescueAssignments.map((assignment) => assignment.attemptNumber),
    ) + 1
  const offerExpiresAt = new Date(Date.now() + config.offerDurationMs)

  return db.$transaction(async (tx) => {
    const current = await tx.donation.findUnique({
      where: { id: donation.id },
      select: {
        donorId: true,
        assignedNgoId: true,
        status: true,
      },
    })

    if (
      !current ||
      current.assignedNgoId !== input.ngoUserId ||
      current.status !== "ACCEPTED"
    ) {
      throw new Error("DONATION_NOT_READY")
    }

    const activeCount = await tx.rescueAssignment.count({
      where: {
        donationId: donation.id,
        status: { in: activeRescueStatuses },
      },
    })

    if (activeCount > 0) {
      throw new Error("ACTIVE_ASSIGNMENT_EXISTS")
    }

    const assignment = await tx.rescueAssignment.create({
      data: {
        donationId: donation.id,
        volunteerId: candidate.volunteerId,
        attemptNumber,
        status: "OFFERED",
        distanceKm: candidate.distanceKm,
        offerExpiresAt,
        pickupLat: donation.lat,
        pickupLng: donation.lng,
        ngoLat: ngoProfile.lat,
        ngoLng: ngoProfile.lng,
      },
    })

    await tx.donation.update({
      where: { id: donation.id },
      data: { deliveryMode: "VOLUNTEER_DELIVERY" },
    })

    await createRescueEvent(tx, {
      assignmentId: assignment.id,
      actorUserId: input.ngoUserId,
      type: "OFFER_CREATED",
      toStatus: "OFFERED",
      note: "NGO requested a volunteer",
      metadata: {
        distanceKm: candidate.distanceKm,
        offerExpiresAt: offerExpiresAt.toISOString(),
      },
    })

    await createInAppNotification(
      {
        userId: candidate.volunteerId,
        donationId: donation.id,
        type: "SYSTEM",
        title: "New rescue offer",
        body: `Pickup ${candidate.distanceKm.toFixed(1)} km away. Respond before the offer expires.`,
        metadata: {
          assignmentId: assignment.id,
          donationId: donation.id,
          offerExpiresAt: offerExpiresAt.toISOString(),
        },
      },
      tx,
    )

    await emitLiveEvents(
      [candidate.volunteerId, input.ngoUserId],
      "MATCH_UPDATED",
      {
        donationId: donation.id,
        assignmentId: assignment.id,
        rescueStatus: "OFFERED",
      },
      tx,
    )

    return {
      id: assignment.id,
      status: assignment.status,
      volunteerName: candidate.volunteerName,
      distanceKm: assignment.distanceKm,
      offerExpiresAt: assignment.offerExpiresAt,
    }
  })
}

async function recordTerminalDispatchFailure(input: {
  donationId: string
  reason: TerminalDispatchError
}) {
  await db.$transaction(async (tx) => {
    const donation = await tx.donation.findUnique({
      where: { id: input.donationId },
      select: {
        donorId: true,
        assignedNgoId: true,
        rescueAssignments: {
          orderBy: { attemptNumber: "desc" },
          take: 1,
          select: { id: true },
        },
      },
    })

    const latestAssignment = donation?.rescueAssignments[0]

    if (!donation || !latestAssignment) {
      return
    }

    const exhausted = input.reason === "DISPATCH_ATTEMPTS_EXHAUSTED"
    const body = exhausted
      ? "The automatic volunteer search reached its attempt limit. The NGO can continue with self-pickup."
      : "No other eligible volunteer is currently available. The NGO can retry later or continue with self-pickup."

    await createRescueEvent(tx, {
      assignmentId: latestAssignment.id,
      type: "SYSTEM_NOTE",
      note: "Automatic volunteer dispatch stopped",
      metadata: { reason: input.reason },
    })

    const recipients = ngoProgressNotificationRecipients(
      donation.assignedNgoId,
    )

    await createInAppNotificationsForUsers(
      recipients,
      {
        donationId: input.donationId,
        type: "SYSTEM",
        title: "Volunteer search paused",
        body,
        metadata: {
          assignmentId: latestAssignment.id,
          reason: input.reason,
        },
      },
      tx,
    )

    await emitLiveEvents(
      recipients,
      "MATCH_UPDATED",
      {
        donationId: input.donationId,
        assignmentId: latestAssignment.id,
        rescueStatus: "FAILED",
        reason: input.reason,
      },
      tx,
    )
  })
}

export async function dispatchNextVolunteerForDonation(input: {
  donationId: string
  ngoUserId: string
}) {
  try {
    const assignment = await requestVolunteerForDonation(input)
    return { assignment, terminalReason: null }
  } catch (error) {
    if (!isTerminalDispatchError(error)) {
      throw error
    }

    await recordTerminalDispatchFailure({
      donationId: input.donationId,
      reason: error.message,
    })

    return {
      assignment: null,
      terminalReason: error.message,
    }
  }
}

export async function processExpiredRescueOffers(input?: {
  batchSize?: number
}) {
  const claimed = await expireRescueOffers({
    batchSize: input?.batchSize,
  })
  let reassigned = 0
  let terminal = 0

  for (const expired of claimed) {
    const donation = await db.donation.findUnique({
      where: { id: expired.donationId },
      select: { assignedNgoId: true },
    })

    if (!donation?.assignedNgoId) {
      terminal += 1
      continue
    }

    const result = await dispatchNextVolunteerForDonation({
      donationId: expired.donationId,
      ngoUserId: donation.assignedNgoId,
    })

    if (result.assignment) {
      reassigned += 1
    } else {
      terminal += 1
    }
  }

  return {
    expired: claimed.length,
    reassigned,
    terminal,
  }
}

export async function listVolunteerAssignments(volunteerId: string) {
  await expireRescueOffers({ volunteerId })

  return db.rescueAssignment.findMany({
    where: {
      volunteerId,
      status: {
        in: activeRescueStatuses,
      },
    },
    include: {
      donation: {
        include: {
          donor: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedNgo: {
            select: {
              id: true,
              name: true,
              ngoProfile: {
                select: {
                  orgName: true,
                  address: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
      events: {
        orderBy: { sequence: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function acceptVolunteerOffer(input: {
  assignmentId: string
  volunteerId: string
}) {
  const result = await db.$transaction(async (tx) => {
    const assignment = await tx.rescueAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        donation: {
          select: {
            id: true,
            donorId: true,
            assignedNgoId: true,
          },
        },
      },
    })

    if (!assignment || assignment.volunteerId !== input.volunteerId) {
      throw new Error("OFFER_NOT_FOUND")
    }

    if (assignment.status === "EN_ROUTE_TO_PICKUP") {
      return { assignment, alreadyAccepted: true, expired: false }
    }

    if (assignment.status === "ACCEPTED") {
      const started = await tx.rescueAssignment.update({
        where: { id: assignment.id },
        data: { status: "EN_ROUTE_TO_PICKUP" },
      })

      await createRescueEvent(tx, {
        assignmentId: assignment.id,
        actorUserId: input.volunteerId,
        type: "STATUS_CHANGED",
        fromStatus: "ACCEPTED",
        toStatus: "EN_ROUTE_TO_PICKUP",
        note: "Volunteer started travelling to pickup",
      })

      return { assignment: started, alreadyAccepted: true, expired: false }
    }

    if (
      assignment.status !== "OFFERED" ||
      assignment.offerExpiresAt.getTime() <= Date.now()
    ) {
      if (assignment.status === "OFFERED") {
        await tx.rescueAssignment.update({
          where: { id: assignment.id },
          data: { status: "EXPIRED", respondedAt: new Date() },
        })
        await createRescueEvent(tx, {
          assignmentId: assignment.id,
          type: "OFFER_EXPIRED",
          fromStatus: "OFFERED",
          toStatus: "EXPIRED",
        })
      }

      return { assignment, alreadyAccepted: false, expired: true }
    }

    assertRescueAssignmentTransition(assignment.status, "ACCEPTED")
    assertRescueAssignmentTransition("ACCEPTED", "EN_ROUTE_TO_PICKUP")

    const acceptedAt = new Date()

    const claim = await tx.rescueAssignment.updateMany({
      where: {
        id: assignment.id,
        volunteerId: input.volunteerId,
        status: "OFFERED",
        offerExpiresAt: { gt: new Date() },
      },
      data: {
        status: "EN_ROUTE_TO_PICKUP",
        acceptedAt,
        respondedAt: acceptedAt,
      },
    })

    if (claim.count === 0) {
      throw new Error("OFFER_ALREADY_RESOLVED")
    }

    await tx.volunteerProfile.update({
      where: { userId: input.volunteerId },
      data: { isAvailable: false },
    })

    await createRescueEvent(tx, {
      assignmentId: assignment.id,
      actorUserId: input.volunteerId,
      type: "OFFER_ACCEPTED",
      fromStatus: "OFFERED",
      toStatus: "ACCEPTED",
      note: "Volunteer accepted the rescue offer",
    })

    await createRescueEvent(tx, {
      assignmentId: assignment.id,
      actorUserId: input.volunteerId,
      type: "STATUS_CHANGED",
      fromStatus: "ACCEPTED",
      toStatus: "EN_ROUTE_TO_PICKUP",
      note: "Volunteer started travelling to pickup",
    })

    const recipients = ngoProgressNotificationRecipients(
      assignment.donation.assignedNgoId,
    )

    await createInAppNotificationsForUsers(
      recipients,
      {
        donationId: assignment.donation.id,
        type: "SYSTEM",
        title: "Volunteer assigned",
        body: "A volunteer is travelling to pickup. The handoff OTP will unlock after arrival.",
        metadata: {
          assignmentId: assignment.id,
          volunteerId: input.volunteerId,
        },
      },
      tx,
    )

    await emitLiveEvents(
      [...recipients, input.volunteerId],
      "MATCH_UPDATED",
      {
        donationId: assignment.donation.id,
        assignmentId: assignment.id,
        rescueStatus: "EN_ROUTE_TO_PICKUP",
      },
      tx,
    )

    return {
      assignment: {
        ...assignment,
        status: "EN_ROUTE_TO_PICKUP" as const,
        acceptedAt,
        respondedAt: acceptedAt,
      },
      alreadyAccepted: false,
      expired: false,
    }
  })

  if (result.expired) {
    throw new Error("OFFER_EXPIRED")
  }

  return result.assignment
}

export async function generatePickupOtpForDonor(input: {
  assignmentId: string
  donorUserId: string
}) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + PICKUP_OTP_DURATION_MS)

  return db.$transaction(async (tx) => {
    const assignment = await tx.rescueAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        donation: {
          select: {
            id: true,
            donorId: true,
          },
        },
      },
    })

    if (!assignment || assignment.donation.donorId !== input.donorUserId) {
      throw new Error("ASSIGNMENT_NOT_FOUND")
    }

    if (assignment.status !== "ARRIVED_AT_PICKUP") {
      throw new Error("OTP_NOT_AVAILABLE")
    }

    if (
      assignment.pickupOtpGeneratedAt &&
      now.getTime() - assignment.pickupOtpGeneratedAt.getTime() <
        PICKUP_OTP_RESEND_COOLDOWN_MS
    ) {
      throw new Error("OTP_COOLDOWN")
    }

    const generated = generatePickupOtp(input.assignmentId)

    await tx.rescueAssignment.update({
      where: { id: assignment.id },
      data: {
        pickupOtpHash: generated.hash,
        pickupOtpExpiresAt: expiresAt,
        pickupOtpAttempts: 0,
        pickupOtpGeneratedAt: now,
      },
    })

    await createRescueEvent(tx, {
      assignmentId: assignment.id,
      actorUserId: input.donorUserId,
      type: "SYSTEM_NOTE",
      note: "Donor generated a pickup OTP",
      metadata: { expiresAt: expiresAt.toISOString() },
    })

    await createInAppNotification(
      {
        userId: assignment.volunteerId,
        donationId: assignment.donation.id,
        type: "SYSTEM",
        title: "Pickup OTP ready",
        body: "Ask the donor for the six-digit code only after receiving the food.",
        metadata: { assignmentId: assignment.id },
      },
      tx,
    )

    return {
      code: generated.code,
      expiresAt,
    }
  })
}

export async function verifyPickupOtpForVolunteer(input: {
  assignmentId: string
  volunteerId: string
  code: string
}) {
  const result = await db.$transaction(async (tx) => {
    const assignment = await tx.rescueAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        donation: {
          select: {
            id: true,
            donorId: true,
            assignedNgoId: true,
            status: true,
          },
        },
      },
    })

    if (!assignment || assignment.volunteerId !== input.volunteerId) {
      throw new Error("ASSIGNMENT_NOT_FOUND")
    }

    if (
      assignment.pickupOtpVerifiedAt &&
      ["PICKED_UP", "EN_ROUTE_TO_NGO", "ARRIVED_AT_NGO", "DELIVERED"].includes(
        assignment.status,
      )
    ) {
      return {
        assignment,
        error: null,
        remainingAttempts: PICKUP_OTP_MAX_ATTEMPTS,
      }
    }

    if (assignment.status !== "ARRIVED_AT_PICKUP") {
      throw new Error("OTP_NOT_AVAILABLE")
    }

    if (!assignment.pickupOtpHash || !assignment.pickupOtpExpiresAt) {
      throw new Error("OTP_NOT_GENERATED")
    }

    if (assignment.pickupOtpExpiresAt.getTime() <= Date.now()) {
      throw new Error("OTP_EXPIRED")
    }

    if (assignment.pickupOtpAttempts >= PICKUP_OTP_MAX_ATTEMPTS) {
      throw new Error("OTP_LOCKED")
    }

    const valid = verifyPickupOtpHash({
      assignmentId: assignment.id,
      code: input.code,
      expectedHash: assignment.pickupOtpHash,
    })

    if (!valid) {
      const attempts = assignment.pickupOtpAttempts + 1
      await tx.rescueAssignment.update({
        where: { id: assignment.id },
        data: { pickupOtpAttempts: attempts },
      })

      return {
        assignment,
        error:
          attempts >= PICKUP_OTP_MAX_ATTEMPTS
            ? ("OTP_LOCKED" as const)
            : ("OTP_INVALID" as const),
        remainingAttempts: Math.max(0, PICKUP_OTP_MAX_ATTEMPTS - attempts),
      }
    }

    const pickupFromStatus = assignment.status

    assertRescueAssignmentTransition(pickupFromStatus, "PICKED_UP")
    assertRescueAssignmentTransition("PICKED_UP", "EN_ROUTE_TO_NGO")

    const verifiedAt = new Date()
    const updatedAssignment = await tx.rescueAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "EN_ROUTE_TO_NGO",
        pickupOtpHash: null,
        pickupOtpExpiresAt: null,
        pickupOtpVerifiedAt: verifiedAt,
      },
    })

    await createRescueEvent(tx, {
      assignmentId: assignment.id,
      actorUserId: input.volunteerId,
      type: "OTP_VERIFIED",
      fromStatus: pickupFromStatus,
      toStatus: "PICKED_UP",
      note: "Donor pickup OTP verified",
    })

    await createRescueEvent(tx, {
      assignmentId: assignment.id,
      actorUserId: input.volunteerId,
      type: "STATUS_CHANGED",
      fromStatus: "PICKED_UP",
      toStatus: "EN_ROUTE_TO_NGO",
      note: "Volunteer is travelling to the NGO",
    })

    const statusRecipients = [
      assignment.donation.donorId,
      assignment.donation.assignedNgoId,
      input.volunteerId,
    ].filter((id): id is string => Boolean(id))

    if (assignment.donation.status === "ACCEPTED") {
      await tx.donation.update({
        where: { id: assignment.donation.id },
        data: { status: "PICKUP_IN_PROGRESS" },
      })
      await createStatusEvent(tx, {
        donationId: assignment.donation.id,
        actorUserId: input.volunteerId,
        status: "PICKUP_IN_PROGRESS",
        note: "Volunteer pickup handoff started",
        recipients: statusRecipients,
      })
    }

    if (
      assignment.donation.status === "ACCEPTED" ||
      assignment.donation.status === "PICKUP_IN_PROGRESS"
    ) {
      await tx.donation.update({
        where: { id: assignment.donation.id },
        data: { status: "PICKED_UP" },
      })
      await createStatusEvent(tx, {
        donationId: assignment.donation.id,
        actorUserId: input.volunteerId,
        status: "PICKED_UP",
        note: "Donor OTP verified; food collected by volunteer",
        recipients: statusRecipients,
      })
    }

    await createInAppNotificationsForUsers(
      ngoProgressNotificationRecipients(
        assignment.donation.assignedNgoId,
      ),
      {
        donationId: assignment.donation.id,
        type: "STATUS_CONFIRMED",
        title: "Food picked up",
        body: "The donor OTP was verified. The volunteer is travelling to the NGO.",
        metadata: {
          assignmentId: assignment.id,
          rescueStatus: "EN_ROUTE_TO_NGO",
        },
      },
      tx,
    )

    await emitLiveEvents(
      statusRecipients,
      "STATUS_CHANGED",
      {
        donationId: assignment.donation.id,
        assignmentId: assignment.id,
        status: "PICKED_UP",
        rescueStatus: "EN_ROUTE_TO_NGO",
      },
      tx,
    )

    return {
      assignment: updatedAssignment,
      error: null,
      remainingAttempts: PICKUP_OTP_MAX_ATTEMPTS,
    }
  })

  if (result.error) {
    throw new Error(`${result.error}:${result.remainingAttempts}`)
  }

  return result.assignment
}

export async function recordVolunteerLocation(input: {
  assignmentId: string
  volunteerId: string
  lat: number
  lng: number
  accuracy: number
  clientTimestamp: Date
  speed?: number
  heading?: number
}) {
  const now = new Date()

  if (input.clientTimestamp.getTime() > now.getTime() + 60_000) {
    throw new Error("LOCATION_TIME_INVALID")
  }

  if (now.getTime() - input.clientTimestamp.getTime() > 5 * 60_000) {
    throw new Error("LOCATION_STALE")
  }

  return db.$transaction(async (tx) => {
    const assignment = await tx.rescueAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        donation: {
          select: {
            id: true,
            donorId: true,
            assignedNgoId: true,
          },
        },
      },
    })

    if (!assignment || assignment.volunteerId !== input.volunteerId) {
      throw new Error("ASSIGNMENT_NOT_FOUND")
    }

    if (
      ![
        "EN_ROUTE_TO_PICKUP",
        "ARRIVED_AT_PICKUP",
        "EN_ROUTE_TO_NGO",
        "ARRIVED_AT_NGO",
      ].includes(assignment.status)
    ) {
      throw new Error("LOCATION_NOT_AVAILABLE")
    }

    if (
      assignment.lastLocationClientAt &&
      input.clientTimestamp.getTime() <=
        assignment.lastLocationClientAt.getTime()
    ) {
      return {
        ignored: true,
        status: assignment.status,
        arrived: false,
        distanceMeters: null,
        trusted: false,
      }
    }

    await tx.volunteerLocationSample.create({
      data: {
        assignmentId: assignment.id,
        volunteerId: input.volunteerId,
        lat: input.lat,
        lng: input.lng,
        accuracy: input.accuracy,
        speed: input.speed,
        heading: input.heading,
        clientTimestamp: input.clientTimestamp,
      },
    })

    await tx.volunteerProfile.update({
      where: { userId: input.volunteerId },
      data: {
        currentLat: input.lat,
        currentLng: input.lng,
        lastLocationAt: now,
      },
    })

    let nextStatus = assignment.status
    let pickupGeofenceEnteredAt = assignment.pickupGeofenceEnteredAt
    let ngoGeofenceEnteredAt = assignment.ngoGeofenceEnteredAt
    let distanceMeters: number | null = null
    let trusted = input.accuracy <= 50
    let arrived = false
    let arrivalTitle: string | null = null
    let arrivalBody: string | null = null

    if (assignment.status === "EN_ROUTE_TO_PICKUP") {
      const evaluation = evaluateGeofence({
        lat: input.lat,
        lng: input.lng,
        accuracy: input.accuracy,
        targetLat: assignment.pickupLat,
        targetLng: assignment.pickupLng,
        enteredAt: assignment.pickupGeofenceEnteredAt,
        now,
      })

      distanceMeters = evaluation.distanceMeters
      trusted = evaluation.trusted
      pickupGeofenceEnteredAt = evaluation.enteredAt

      if (evaluation.arrived) {
        assertRescueAssignmentTransition(
          "EN_ROUTE_TO_PICKUP",
          "ARRIVED_AT_PICKUP",
        )
        nextStatus = "ARRIVED_AT_PICKUP"
        arrived = true
        arrivalTitle = "Volunteer arrived for pickup"
        arrivalBody =
          "Complete the food handoff, then the donor should generate the pickup OTP."
      }
    } else if (assignment.status === "EN_ROUTE_TO_NGO") {
      const evaluation = evaluateGeofence({
        lat: input.lat,
        lng: input.lng,
        accuracy: input.accuracy,
        targetLat: assignment.ngoLat,
        targetLng: assignment.ngoLng,
        enteredAt: assignment.ngoGeofenceEnteredAt,
        now,
      })

      distanceMeters = evaluation.distanceMeters
      trusted = evaluation.trusted
      ngoGeofenceEnteredAt = evaluation.enteredAt

      if (evaluation.arrived) {
        assertRescueAssignmentTransition("EN_ROUTE_TO_NGO", "ARRIVED_AT_NGO")
        nextStatus = "ARRIVED_AT_NGO"
        arrived = true
        arrivalTitle = "Volunteer arrived at NGO"
        arrivalBody =
          "The NGO should confirm receipt after checking the food handoff."
      }
    }

    const updated = await tx.rescueAssignment.update({
      where: { id: assignment.id },
      data: {
        status: nextStatus,
        lastLat: input.lat,
        lastLng: input.lng,
        lastAccuracy: input.accuracy,
        lastLocationAt: now,
        lastLocationClientAt: input.clientTimestamp,
        pickupGeofenceEnteredAt,
        ngoGeofenceEnteredAt,
      },
    })

    const locationRecipients = volunteerTrackingRecipients({
      assignedNgoId: assignment.donation.assignedNgoId,
      volunteerId: input.volunteerId,
    })

    if (arrived && arrivalTitle && arrivalBody) {
      await createRescueEvent(tx, {
        assignmentId: assignment.id,
        actorUserId: input.volunteerId,
        type: "GEOFENCE_ENTERED",
        fromStatus: assignment.status,
        toStatus: nextStatus,
        note: arrivalTitle,
        metadata: {
          distanceMeters,
          accuracy: input.accuracy,
        },
      })

      await createInAppNotificationsForUsers(locationRecipients, {
        donationId: assignment.donation.id,
        type: "STATUS_CONFIRMED",
        title: arrivalTitle,
        body: arrivalBody,
        metadata: {
          assignmentId: assignment.id,
          rescueStatus: nextStatus,
        },
      }, tx)
    }

    await emitLiveEvents(
      locationRecipients,
      "LOCATION_UPDATED",
      {
        donationId: assignment.donation.id,
        assignmentId: assignment.id,
        lat: input.lat,
        lng: input.lng,
        accuracy: input.accuracy,
        rescueStatus: nextStatus,
        createdAt: now.toISOString(),
      },
      tx,
    )

    if (arrived && nextStatus === "ARRIVED_AT_PICKUP") {
      await emitLiveEvents(
        [assignment.donation.donorId],
        "STATUS_CHANGED",
        {
          donationId: assignment.donation.id,
          assignmentId: assignment.id,
          rescueStatus: nextStatus,
          createdAt: now.toISOString(),
        },
        tx,
      )
    }

    return {
      ignored: false,
      status: updated.status,
      arrived,
      distanceMeters,
      trusted,
    }
  })
}

export async function confirmRescueDelivery(input: {
  assignmentId: string
  ngoUserId: string
}) {
  return db.$transaction(async (tx) => {
    const assignment = await tx.rescueAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        donation: {
          select: {
            id: true,
            donorId: true,
            assignedNgoId: true,
            status: true,
          },
        },
      },
    })

    if (
      !assignment ||
      assignment.donation.assignedNgoId !== input.ngoUserId
    ) {
      throw new Error("ASSIGNMENT_NOT_FOUND")
    }

    if (assignment.status === "DELIVERED") {
      return assignment
    }

    if (assignment.status !== "ARRIVED_AT_NGO") {
      throw new Error("DELIVERY_NOT_READY")
    }

    assertRescueAssignmentTransition("ARRIVED_AT_NGO", "DELIVERED")

    const completedAt = new Date()
    const delivered = await tx.rescueAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "DELIVERED",
        completedAt,
      },
    })

    await createRescueEvent(tx, {
      assignmentId: assignment.id,
      actorUserId: input.ngoUserId,
      type: "DELIVERY_CONFIRMED",
      fromStatus: "ARRIVED_AT_NGO",
      toStatus: "DELIVERED",
      note: "NGO confirmed food receipt",
    })

    const recipients = [
      assignment.donation.donorId,
      input.ngoUserId,
      assignment.volunteerId,
    ]

    if (assignment.donation.status === "PICKED_UP") {
      await tx.donation.update({
        where: { id: assignment.donation.id },
        data: { status: "DELIVERED" },
      })
      await createStatusEvent(tx, {
        donationId: assignment.donation.id,
        actorUserId: input.ngoUserId,
        status: "DELIVERED",
        note: "NGO confirmed delivery from volunteer",
        recipients,
      })
    }

    await createInAppNotificationsForUsers(recipients, {
      donationId: assignment.donation.id,
      type: "STATUS_CONFIRMED",
      title: "Delivery complete",
      body: "The NGO confirmed receipt of the rescued food.",
      metadata: {
        assignmentId: assignment.id,
        rescueStatus: "DELIVERED",
      },
    }, tx)

    await emitLiveEvents(
      recipients,
      "STATUS_CHANGED",
      {
        donationId: assignment.donation.id,
        assignmentId: assignment.id,
        status: "DELIVERED",
        rescueStatus: "DELIVERED",
      },
      tx,
    )

    return delivered
  })
}

export async function rejectVolunteerOffer(input: {
  assignmentId: string
  volunteerId: string
}) {
  const result = await db.$transaction(async (tx) => {
    const assignment = await tx.rescueAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        donation: {
          select: {
            id: true,
            assignedNgoId: true,
          },
        },
      },
    })

    if (!assignment || assignment.volunteerId !== input.volunteerId) {
      throw new Error("OFFER_NOT_FOUND")
    }

    if (assignment.status === "REJECTED") {
      return {
        rejected: assignment,
        donationId: assignment.donation.id,
        ngoUserId: assignment.donation.assignedNgoId,
        shouldRedispatch: false,
      }
    }

    if (assignment.status !== "OFFERED") {
      throw new Error("OFFER_ALREADY_RESOLVED")
    }

    assertRescueAssignmentTransition(assignment.status, "REJECTED")

    const rejected = await tx.rescueAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "REJECTED",
        respondedAt: new Date(),
      },
    })

    await createRescueEvent(tx, {
      assignmentId: assignment.id,
      actorUserId: input.volunteerId,
      type: "OFFER_REJECTED",
      fromStatus: "OFFERED",
      toStatus: "REJECTED",
      note: "Volunteer declined the rescue offer",
    })

    if (assignment.donation.assignedNgoId) {
      await createInAppNotification(
        {
          userId: assignment.donation.assignedNgoId,
          donationId: assignment.donation.id,
          type: "SYSTEM",
          title: "Volunteer declined",
          body: "The system is searching for the next eligible volunteer.",
          metadata: { assignmentId: assignment.id },
        },
        tx,
      )
    }

    return {
      rejected,
      donationId: assignment.donation.id,
      ngoUserId: assignment.donation.assignedNgoId,
      shouldRedispatch: true,
    }
  })

  if (result.shouldRedispatch && result.ngoUserId) {
    await dispatchNextVolunteerForDonation({
      donationId: result.donationId,
      ngoUserId: result.ngoUserId,
    })
  }

  return result.rejected
}
