import { ok, fail } from "@/lib/api/response"
import { consumeRateLimit, getRequestIp } from "@/lib/api/rate-limit"
import { getApiUser } from "@/lib/auth/api"
import { createDonationForDonor, listDonationsByRole } from "@/lib/donations/service"
import { donationCreateSchema } from "@/lib/validations/donation"

export async function GET() {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  try {
    const donations = await listDonationsByRole(user.id, user.role)
    return ok({ donations })
  } catch (error) {
    console.error("list donations error", error)
    return fail("INTERNAL_ERROR", "Failed to load donations", 500)
  }
}

export async function POST(request: Request) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "DONOR") {
    return fail("FORBIDDEN", "Only donors can create donations", 403)
  }

  const limiter = consumeRateLimit({
    key: `create-donation:${user.id}:${getRequestIp(request)}`,
    limit: 30,
    windowMs: 60_000,
  })

  if (!limiter.allowed) {
    return fail("RATE_LIMITED", "Too many donation submissions. Please wait a minute.", 429)
  }

  try {
    const body = await request.json()
    const parsed = donationCreateSchema.safeParse(body)

    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid donation payload", 400, parsed.error.flatten())
    }

    const result = await createDonationForDonor(user.id, parsed.data)

    return ok({
      donationId: result.donationId,
      status: result.status,
      candidates: result.candidates,
    })
  } catch (error) {
    console.error("create donation error", error)

    if (error instanceof Error && error.message === "COORDINATES_REQUIRED") {
      return fail("COORDINATES_REQUIRED", "Could not resolve pickup location coordinates", 400)
    }

    return fail("INTERNAL_ERROR", "Failed to create donation", 500)
  }
}
