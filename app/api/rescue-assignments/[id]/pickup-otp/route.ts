import { fail, ok } from "@/lib/api/response"
import { consumeRateLimit, getRequestIp } from "@/lib/api/rate-limit"
import { getApiUser } from "@/lib/auth/api"
import { generatePickupOtpForDonor } from "@/lib/rescue/service"

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: Context) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "DONOR") {
    return fail("FORBIDDEN", "Only the donor can generate the pickup OTP", 403)
  }

  const { id } = await context.params
  const limiter = consumeRateLimit({
    key: `pickup-otp-generate:${user.id}:${id}:${getRequestIp(request)}`,
    limit: 5,
    windowMs: 10 * 60_000,
  })

  if (!limiter.allowed) {
    return fail(
      "RATE_LIMITED",
      "Too many OTP requests. Wait before trying again.",
      429,
    )
  }

  try {
    const otp = await generatePickupOtpForDonor({
      assignmentId: id,
      donorUserId: user.id,
    })

    return ok({
      otp: {
        code: otp.code,
        expiresAt: otp.expiresAt,
      },
    })
  } catch (error) {
    console.error("generate pickup OTP error", error)

    if (error instanceof Error) {
      if (error.message === "ASSIGNMENT_NOT_FOUND") {
        return fail("NOT_FOUND", "Rescue assignment not found", 404)
      }

      if (error.message === "OTP_NOT_AVAILABLE") {
        return fail(
          "OTP_NOT_AVAILABLE",
          "Pickup OTP is available after the volunteer arrives",
          409,
        )
      }

      if (error.message === "OTP_COOLDOWN") {
        return fail(
          "OTP_COOLDOWN",
          "Wait 30 seconds before generating another OTP",
          429,
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

    return fail("INTERNAL_ERROR", "Failed to generate pickup OTP", 500)
  }
}
