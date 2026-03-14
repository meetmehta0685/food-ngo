import {
  type DonationStatus,
  type MatchState,
  type Prisma,
  type Role,
} from "@prisma/client"

import { db } from "@/lib/db"
import { assertTransition } from "@/lib/donations/status"
import { geocodeAddress } from "@/lib/maps/geocode"
import { getTopNgoCandidates } from "@/lib/matching/match-ngos"
import {
  createInAppNotification,
  createInAppNotificationsForUsers,
  sendStatusMilestoneNotifications,
} from "@/lib/notifications/service"
import { emitLiveEvents } from "@/lib/realtime/events"
import type { DonationCreateInput, DonationStatusInput } from "@/lib/validations/donation"

type Tx = Prisma.TransactionClient

async function createStatusEvent(
  tx: Tx,
  input: {
    donationId: string
    actorUserId: string
    status: DonationStatus
    note?: string
    lat?: number
    lng?: number
    recipients: string[]
  },
) {
  await tx.donationStatusEvent.create({
    data: {
      donationId: input.donationId,
      actorUserId: input.actorUserId,
      status: input.status,
      note: input.note,
      lat: input.lat,
      lng: input.lng,
    },
  })

  await emitLiveEvents(
    input.recipients,
    input.lat !== undefined && input.lng !== undefined ? "LOCATION_UPDATED" : "STATUS_CHANGED",
    {
      donationId: input.donationId,
      status: input.status,
      note: input.note,
      lat: input.lat,
      lng: input.lng,
      createdAt: new Date().toISOString(),
    },
    tx,
  )
}

export async function createDonationForDonor(
  donorId: string,
  payload: DonationCreateInput,
) {
  let lat = payload.lat
  let lng = payload.lng

  if (lat === undefined || lng === undefined) {
    const geocode = await geocodeAddress(payload.address)

    if (!geocode) {
      throw new Error("COORDINATES_REQUIRED")
    }

    lat = geocode.lat
    lng = geocode.lng
  }

  const candidates = await getTopNgoCandidates(lat, lng, 3)

  const result = await db.$transaction(async (tx) => {
    const donation = await tx.donation.create({
      data: {
        donorId,
        foodType: payload.foodType,
        quantity: payload.quantity,
        servesCount: payload.servesCount,
        address: payload.address,
        lat,
        lng,
        pickupBy: payload.pickupBy,
        notes: payload.notes,
        status: "REPORTED",
      },
    })

    await createStatusEvent(tx, {
      donationId: donation.id,
      actorUserId: donorId,
      status: "REPORTED",
      recipients: [donorId],
    })

    await tx.donation.update({
      where: { id: donation.id },
      data: { status: "MATCHING" },
    })

    await createStatusEvent(tx, {
      donationId: donation.id,
      actorUserId: donorId,
      status: "MATCHING",
      recipients: [donorId],
    })

    if (candidates.length === 0) {
      await createInAppNotification(
        {
          userId: donorId,
          donationId: donation.id,
          type: "SYSTEM",
          title: "No nearby NGO found",
          body: "We could not find an NGO in service radius right now.",
          metadata: { donationId: donation.id },
        },
        tx,
      )

      return {
        donationId: donation.id,
        candidates: 0,
        status: "MATCHING" as const,
      }
    }

    await tx.ngoMatchCandidate.createMany({
      data: candidates.map((candidate) => ({
        donationId: donation.id,
        ngoUserId: candidate.ngoUserId,
        distanceKm: candidate.distanceKm,
        rank: candidate.rank,
        state: "PENDING",
      })),
    })

    await tx.donation.update({
      where: { id: donation.id },
      data: { status: "NOTIFIED" },
    })

    const notifiedNgoIds = candidates.map((candidate) => candidate.ngoUserId)

    await createStatusEvent(tx, {
      donationId: donation.id,
      actorUserId: donorId,
      status: "NOTIFIED",
      recipients: [donorId, ...notifiedNgoIds],
    })

    await createInAppNotificationsForUsers(
      notifiedNgoIds,
      {
        donationId: donation.id,
        type: "NGO_MATCHED",
        title: "New nearby food pickup",
        body: `Donation #${donation.id.slice(-6)} is waiting for NGO acceptance.`,
        metadata: {
          donationId: donation.id,
          candidates: candidates.length,
        },
      },
      tx,
    )

    await createInAppNotification(
      {
        userId: donorId,
        donationId: donation.id,
        type: "DONATION_CREATED",
        title: "Donation request submitted",
        body: "Top nearby NGOs were notified. Waiting for acceptance.",
      },
      tx,
    )

    return {
      donationId: donation.id,
      candidates: candidates.length,
      status: "NOTIFIED" as const,
    }
  })

  return result
}

export async function listDonationsByRole(userId: string, role: Role) {
  if (role === "DONOR") {
    return db.donation.findMany({
      where: { donorId: userId },
      include: {
        assignedNgo: {
          select: {
            id: true,
            name: true,
            email: true,
            ngoProfile: {
              select: {
                orgName: true,
                phone: true,
              },
            },
          },
        },
        candidates: {
          select: {
            id: true,
            ngoUserId: true,
            distanceKm: true,
            rank: true,
            state: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  return db.donation.findMany({
    where: { assignedNgoId: userId },
    include: {
      donor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      statusEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  })
}

export async function getDonationForUser(
  donationId: string,
  userId: string,
  role: Role,
) {
  const donation = await db.donation.findUnique({
    where: { id: donationId },
    include: {
      donor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedNgo: {
        select: {
          id: true,
          name: true,
          email: true,
          ngoProfile: true,
        },
      },
      candidates: {
        include: {
          ngoUser: {
            select: {
              id: true,
              name: true,
              email: true,
              ngoProfile: true,
            },
          },
        },
        orderBy: { rank: "asc" },
      },
      statusEvents: {
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!donation) {
    return null
  }

  if (role === "DONOR" && donation.donorId !== userId) {
    return null
  }

  if (role === "NGO") {
    const hasCandidate = donation.candidates.some((candidate) => candidate.ngoUserId === userId)
    const isAssigned = donation.assignedNgoId === userId

    if (!hasCandidate && !isAssigned) {
      return null
    }
  }

  return donation
}

export async function respondToMatchCandidate(input: {
  candidateId: string
  ngoUserId: string
  decision: "ACCEPT" | "DECLINE"
}) {
  const current = await db.ngoMatchCandidate.findUnique({
    where: { id: input.candidateId },
    include: {
      donation: {
        include: {
          donor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      ngoUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!current || current.ngoUserId !== input.ngoUserId) {
    throw new Error("MATCH_NOT_FOUND")
  }

  if (current.state !== "PENDING") {
    throw new Error("MATCH_ALREADY_RESOLVED")
  }

  if (input.decision === "DECLINE") {
    return db.$transaction(async (tx) => {
      await tx.ngoMatchCandidate.update({
        where: { id: input.candidateId },
        data: { state: "DECLINED" },
      })

      const pendingLeft = await tx.ngoMatchCandidate.count({
        where: {
          donationId: current.donationId,
          state: "PENDING",
        },
      })

      if (pendingLeft === 0) {
        const donation = await tx.donation.findUnique({
          where: { id: current.donationId },
        })

        if (donation?.assignedNgoId === null && donation.status === "NOTIFIED") {
          await tx.donation.update({
            where: { id: donation.id },
            data: { status: "MATCHING" },
          })

          await createStatusEvent(tx, {
            donationId: donation.id,
            actorUserId: input.ngoUserId,
            status: "MATCHING",
            note: "All notified NGOs declined",
            recipients: [donation.donorId],
          })

          await createInAppNotification(
            {
              userId: donation.donorId,
              donationId: donation.id,
              type: "SYSTEM",
              title: "No NGO accepted yet",
              body: "All notified NGOs declined. Keep request active while we continue matching.",
            },
            tx,
          )
        }
      }

      await emitLiveEvents(
        [current.donation.donorId, input.ngoUserId],
        "MATCH_UPDATED",
        {
          donationId: current.donationId,
          candidateId: current.id,
          state: "DECLINED",
        },
        tx,
      )

      return {
        donationId: current.donationId,
        state: "DECLINED" as MatchState,
      }
    })
  }

  const acceptedResult = await db.$transaction(async (tx) => {
    const refreshed = await tx.ngoMatchCandidate.findUnique({
      where: { id: input.candidateId },
      include: {
        donation: true,
      },
    })

    if (!refreshed || refreshed.state !== "PENDING") {
      throw new Error("MATCH_ALREADY_RESOLVED")
    }

    const claim = await tx.donation.updateMany({
      where: {
        id: refreshed.donationId,
        assignedNgoId: null,
        status: { in: ["NOTIFIED", "MATCHING"] },
      },
      data: {
        assignedNgoId: refreshed.ngoUserId,
        status: "ACCEPTED",
      },
    })

    if (claim.count === 0) {
      await tx.ngoMatchCandidate.update({
        where: { id: refreshed.id },
        data: { state: "EXPIRED" },
      })

      return {
        accepted: false,
        donationId: refreshed.donationId,
      }
    }

    await tx.ngoMatchCandidate.update({
      where: { id: refreshed.id },
      data: { state: "ACCEPTED" },
    })

    await tx.ngoMatchCandidate.updateMany({
      where: {
        donationId: refreshed.donationId,
        id: { not: refreshed.id },
        state: "PENDING",
      },
      data: { state: "EXPIRED" },
    })

    const donation = await tx.donation.findUnique({
      where: { id: refreshed.donationId },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedNgo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!donation || !donation.assignedNgo) {
      throw new Error("DONATION_NOT_FOUND")
    }

    await createStatusEvent(tx, {
      donationId: donation.id,
      actorUserId: input.ngoUserId,
      status: "ACCEPTED",
      recipients: [donation.donorId, donation.assignedNgoId as string],
    })

    await emitLiveEvents(
      [donation.donorId, donation.assignedNgoId as string],
      "MATCH_UPDATED",
      {
        donationId: donation.id,
        candidateId: refreshed.id,
        state: "ACCEPTED",
      },
      tx,
    )

    return {
      accepted: true,
      donationId: donation.id,
      donor: donation.donor,
      ngo: donation.assignedNgo,
    }
  })

  if (acceptedResult.accepted) {
    if (!acceptedResult.donor) {
      throw new Error("DONATION_ALREADY_ASSIGNED")
    }

    await sendStatusMilestoneNotifications({
      donationId: acceptedResult.donationId,
      donor: acceptedResult.donor,
      ngo: acceptedResult.ngo ?? null,
      status: "ACCEPTED",
    })

    return {
      donationId: acceptedResult.donationId,
      state: "ACCEPTED" as MatchState,
    }
  }

  throw new Error("DONATION_ALREADY_ASSIGNED")
}

export async function updateAssignedDonationStatus(
  donationId: string,
  ngoUserId: string,
  payload: DonationStatusInput,
) {
  const updated = await db.$transaction(async (tx) => {
    const donation = await tx.donation.findUnique({
      where: { id: donationId },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedNgo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!donation || donation.assignedNgoId !== ngoUserId || !donation.assignedNgo) {
      throw new Error("FORBIDDEN")
    }

    assertTransition(donation.status, payload.nextStatus)

    const next = await tx.donation.update({
      where: { id: donationId },
      data: {
        status: payload.nextStatus,
      },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedNgo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    await createStatusEvent(tx, {
      donationId,
      actorUserId: ngoUserId,
      status: payload.nextStatus,
      note: payload.note,
      lat: payload.lat,
      lng: payload.lng,
      recipients: [next.donorId, ngoUserId],
    })

    return next
  })

  if (updated.status === "DELIVERED") {
    await sendStatusMilestoneNotifications({
      donationId: updated.id,
      donor: updated.donor,
      ngo: updated.assignedNgo,
      status: "DELIVERED",
    })
  }

  return updated
}
