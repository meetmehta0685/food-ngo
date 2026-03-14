import { ok, fail } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { respondToMatchCandidate } from "@/lib/donations/service"
import { matchResponseSchema } from "@/lib/validations/match"

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: Context) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "NGO") {
    return fail("FORBIDDEN", "Only NGOs can respond to match requests", 403)
  }

  try {
    const body = await request.json()
    const parsed = matchResponseSchema.safeParse(body)

    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid match response", 400, parsed.error.flatten())
    }

    const { id } = await context.params
    const result = await respondToMatchCandidate({
      candidateId: id,
      ngoUserId: user.id,
      decision: parsed.data.decision,
    })

    return ok({ result })
  } catch (error) {
    console.error("respond match error", error)

    if (error instanceof Error) {
      if (error.message === "MATCH_NOT_FOUND") {
        return fail("NOT_FOUND", "Match candidate not found", 404)
      }

      if (error.message === "MATCH_ALREADY_RESOLVED") {
        return fail("CONFLICT", "This request was already resolved", 409)
      }

      if (error.message === "DONATION_ALREADY_ASSIGNED") {
        return fail("CONFLICT", "Donation was already accepted by another NGO", 409)
      }
    }

    return fail("INTERNAL_ERROR", "Failed to respond to match", 500)
  }
}
