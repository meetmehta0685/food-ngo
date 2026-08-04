import { z } from "zod"

import { fail, ok } from "@/lib/api/response"
import { consumeRateLimit, getRequestIp } from "@/lib/api/rate-limit"
import { getApiUser } from "@/lib/auth/api"
import { verifyPickupOtpForVolunteer } from "@/lib/rescue/service"

const verifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit OTP"),
})

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: Context) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "VOLUNTEER") {
    return fail("FORBIDDEN", "Volunteer access required", 403)
  }

  const { id } = await context.params
  const limiter = consumeRateLimit({
    key: `pickup-otp-verify:${user.id}:${id}:${getRequestIp(request)}`,
    limit: 8,
    windowMs: 10 * 60_000,
  })

  if (!limiter.allowed) {
    return fail(
      "RATE_LIMITED",
      "Too many verification attempts. Wait before trying again.",
      429,
    )
  }

  try {
    const parsed = verifySchema.safeParse(await request.json())

    if (!parsed.success) {
      return fail(
        "VALIDATION_ERROR",
        "Enter a valid six-digit OTP",
        400,
        parsed.error.flatten(),
      )
    }

    const assignment = await verifyPickupOtpForVolunteer({
      assignmentId: id,
      volunteerId: user.id,
      code: parsed.data.code,
    })

    return ok({
      assignment: {
        id: assignment.id,
        status: assignment.status,
        pickupOtpVerifiedAt: assignment.pickupOtpVerifiedAt,
      },
    })
  } catch (error) {
    console.error("verify pickup OTP error", error)

    if (error instanceof Error) {
      if (error.message === "ASSIGNMENT_NOT_FOUND") {
        return fail("NOT_FOUND", "Rescue assignment not found", 404)
      }

      if (error.message === "OTP_NOT_AVAILABLE") {
        return fail(
          "OTP_NOT_AVAILABLE",
          "Pickup OTP cannot be verified at this stage",
          409,
        )
      }

      if (error.message === "OTP_NOT_GENERATED") {
        return fail(
          "OTP_NOT_GENERATED",
          "Ask the donor to generate the pickup OTP",
          409,
        )
      }

      if (error.message === "OTP_EXPIRED") {
        return fail(
          "OTP_EXPIRED",
          "The OTP expired. Ask the donor to generate a new one.",
          409,
        )
      }

      if (error.message.startsWith("OTP_INVALID:")) {
        const remaining = Number(error.message.split(":")[1] ?? 0)
        return fail(
          "OTP_INVALID",
          `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
          400,
        )
      }

      if (
        error.message === "OTP_LOCKED" ||
        error.message.startsWith("OTP_LOCKED:")
      ) {
        return fail(
          "OTP_LOCKED",
          "OTP verification is locked. Ask the donor to generate a new code.",
          423,
        )
      }

      if (error.message === "OTP_SECRET_MISSING") {
        return fail(
          "OTP_UNAVAILABLE",
          "Pickup OTP is not configured on the server",
          503,
        )
      }
    }

    return fail("INTERNAL_ERROR", "Failed to verify pickup OTP", 500)
  }
}
