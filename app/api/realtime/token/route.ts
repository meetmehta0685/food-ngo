import { NextResponse } from "next/server"

import { fail } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { db } from "@/lib/db"
import { getAblyRest, isAblyConfigured } from "@/lib/realtime/ably-server"
import {
  buildRealtimeCapability,
  canSubscribeToRescueChannels,
  rescueChannel,
  userChannel,
} from "@/lib/realtime/authorization"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function authorizedAssignmentIds(userId: string, role: string) {
  if (!canSubscribeToRescueChannels(role)) {
    return []
  }

  const assignments = await db.rescueAssignment.findMany({
    where: {
      ...(role === "VOLUNTEER"
        ? { volunteerId: userId }
        : { donation: { assignedNgoId: userId } }),
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  })

  return assignments.map((assignment) => assignment.id)
}

export async function GET() {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  const assignmentIds = await authorizedAssignmentIds(user.id, user.role)

  return NextResponse.json({
    channels: [
      userChannel(user.id),
      ...assignmentIds.map((id) => rescueChannel(id)),
    ],
  })
}

export async function POST() {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (!isAblyConfigured()) {
    return fail("REALTIME_UNAVAILABLE", "Realtime is not configured", 503)
  }

  try {
    const assignmentIds = await authorizedAssignmentIds(user.id, user.role)
    const tokenRequest = await getAblyRest().auth.createTokenRequest({
      clientId: user.id,
      ttl: 60 * 60 * 1000,
      capability: JSON.stringify(
        buildRealtimeCapability(user.id, assignmentIds, user.role),
      ),
    })

    return NextResponse.json(tokenRequest, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("Ably token request failed", error)
    return fail("REALTIME_UNAVAILABLE", "Could not authorize realtime", 503)
  }
}
