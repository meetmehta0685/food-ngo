import { z } from "zod"

import { ok, fail } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { db } from "@/lib/db"

const availabilitySchema = z
  .object({
    isAvailable: z.boolean(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isAvailable && (data.lat === undefined || data.lng === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current location is required before going available",
      })
    }
  })

export async function PATCH(request: Request) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "VOLUNTEER") {
    return fail("FORBIDDEN", "Volunteer access required", 403)
  }

  try {
    const parsed = availabilitySchema.safeParse(await request.json())

    if (!parsed.success) {
      return fail(
        "VALIDATION_ERROR",
        "Invalid availability update",
        400,
        parsed.error.flatten(),
      )
    }

    const now = new Date()
    const profile = await db.volunteerProfile.update({
      where: { userId: user.id },
      data: parsed.data.isAvailable
        ? {
            isAvailable: true,
            currentLat: parsed.data.lat,
            currentLng: parsed.data.lng,
            lastLocationAt: now,
          }
        : {
            isAvailable: false,
          },
      select: {
        isAvailable: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true,
      },
    })

    return ok({ profile })
  } catch (error) {
    console.error("volunteer availability update error", error)
    return fail("INTERNAL_ERROR", "Failed to update availability", 500)
  }
}
