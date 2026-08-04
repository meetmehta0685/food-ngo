import { z } from "zod"

import { fail, ok } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { db } from "@/lib/db"
import { GEOFENCE_DWELL_MS } from "@/lib/rescue/geofence"
import {
  buildRescueLocationMessage,
  publishRescueLocation,
} from "@/lib/realtime/rescue-location"
import { recordVolunteerLocation } from "@/lib/rescue/service"

const simulationSchema = z.object({
  destination: z.enum(["PICKUP", "NGO"]),
})

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: Context) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_LOCATION_SIMULATOR !== "true"
  ) {
    return fail("NOT_FOUND", "Not found", 404)
  }

  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "VOLUNTEER") {
    return fail("FORBIDDEN", "Volunteer access required", 403)
  }

  try {
    const parsed = simulationSchema.safeParse(await request.json())

    if (!parsed.success) {
      return fail(
        "VALIDATION_ERROR",
        "Choose a valid simulation destination",
        400,
        parsed.error.flatten(),
      )
    }

    const { id } = await context.params
    const assignment = await db.rescueAssignment.findUnique({
      where: { id },
      select: {
        id: true,
        volunteerId: true,
        status: true,
        pickupLat: true,
        pickupLng: true,
        ngoLat: true,
        ngoLng: true,
      },
    })

    if (!assignment || assignment.volunteerId !== user.id) {
      return fail("NOT_FOUND", "Active rescue assignment not found", 404)
    }

    const expectedStatus =
      parsed.data.destination === "PICKUP"
        ? "EN_ROUTE_TO_PICKUP"
        : "EN_ROUTE_TO_NGO"

    if (assignment.status !== expectedStatus) {
      return fail(
        "SIMULATION_NOT_AVAILABLE",
        `This assignment is not currently travelling to ${parsed.data.destination.toLowerCase()}`,
        409,
      )
    }

    const enteredAt = new Date(Date.now() - GEOFENCE_DWELL_MS - 1_000)
    await db.rescueAssignment.update({
      where: { id: assignment.id },
      data:
        parsed.data.destination === "PICKUP"
          ? { pickupGeofenceEnteredAt: enteredAt }
          : { ngoGeofenceEnteredAt: enteredAt },
    })

    const result = await recordVolunteerLocation({
      assignmentId: assignment.id,
      volunteerId: user.id,
      lat:
        parsed.data.destination === "PICKUP"
          ? assignment.pickupLat
          : assignment.ngoLat,
      lng:
        parsed.data.destination === "PICKUP"
          ? assignment.pickupLng
          : assignment.ngoLng,
      accuracy: 10,
      clientTimestamp: new Date(Date.now() + 1_000),
    })

    if (!result.ignored) {
      const lat =
        parsed.data.destination === "PICKUP"
          ? assignment.pickupLat
          : assignment.ngoLat
      const lng =
        parsed.data.destination === "PICKUP"
          ? assignment.pickupLng
          : assignment.ngoLng

      await publishRescueLocation(
        buildRescueLocationMessage({
          assignmentId: assignment.id,
          lat,
          lng,
          accuracy: 10,
          rescueStatus: result.status,
          clientTimestamp: new Date(),
        }),
      ).catch((error) => {
        console.error("simulated rescue location publish failed", error)
      })
    }

    return ok({ simulation: result })
  } catch (error) {
    console.error("location simulation error", error)
    return fail("INTERNAL_ERROR", "Failed to simulate location", 500)
  }
}
