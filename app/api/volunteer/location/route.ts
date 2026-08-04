import { z } from "zod"

import { fail, ok } from "@/lib/api/response"
import { consumeRateLimit, getRequestIp } from "@/lib/api/rate-limit"
import { getApiUser } from "@/lib/auth/api"
import {
  buildRescueLocationMessage,
  publishRescueLocation,
} from "@/lib/realtime/rescue-location"
import { recordVolunteerLocation } from "@/lib/rescue/service"

const locationSchema = z.object({
  assignmentId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().max(5000),
  speed: z.number().nonnegative().max(200).optional(),
  heading: z.number().min(0).max(360).optional(),
  clientTimestamp: z.coerce.date(),
})

export async function POST(request: Request) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "VOLUNTEER") {
    return fail("FORBIDDEN", "Volunteer access required", 403)
  }

  const limiter = consumeRateLimit({
    key: `volunteer-location:${user.id}:${getRequestIp(request)}`,
    limit: 40,
    windowMs: 60_000,
  })

  if (!limiter.allowed) {
    return fail(
      "RATE_LIMITED",
      "Location updates are arriving too quickly",
      429,
    )
  }

  try {
    const parsed = locationSchema.safeParse(await request.json())

    if (!parsed.success) {
      return fail(
        "VALIDATION_ERROR",
        "Invalid location update",
        400,
        parsed.error.flatten(),
      )
    }

    const result = await recordVolunteerLocation({
      assignmentId: parsed.data.assignmentId,
      volunteerId: user.id,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      accuracy: parsed.data.accuracy,
      speed: parsed.data.speed,
      heading: parsed.data.heading,
      clientTimestamp: parsed.data.clientTimestamp,
    })

    if (!result.ignored) {
      const message = buildRescueLocationMessage({
        ...parsed.data,
        rescueStatus: result.status,
      })

      await publishRescueLocation(message).catch((error) => {
        console.error("direct rescue location publish failed", error)
      })
    }

    return ok({ location: result })
  } catch (error) {
    console.error("volunteer location update error", error)

    if (error instanceof Error) {
      if (error.message === "ASSIGNMENT_NOT_FOUND") {
        return fail("NOT_FOUND", "Active rescue assignment not found", 404)
      }

      if (error.message === "LOCATION_NOT_AVAILABLE") {
        return fail(
          "LOCATION_NOT_AVAILABLE",
          "Location tracking is not active for this assignment",
          409,
        )
      }

      if (
        error.message === "LOCATION_STALE" ||
        error.message === "LOCATION_TIME_INVALID"
      ) {
        return fail(
          "LOCATION_STALE",
          "This location sample is too old or has an invalid timestamp",
          400,
        )
      }
    }

    return fail("INTERNAL_ERROR", "Failed to update volunteer location", 500)
  }
}
