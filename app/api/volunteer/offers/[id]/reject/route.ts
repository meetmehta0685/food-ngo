import { fail, ok } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { rejectVolunteerOffer } from "@/lib/rescue/service"

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(_: Request, context: Context) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "VOLUNTEER") {
    return fail("FORBIDDEN", "Volunteer access required", 403)
  }

  try {
    const { id } = await context.params
    const assignment = await rejectVolunteerOffer({
      assignmentId: id,
      volunteerId: user.id,
    })

    return ok({
      assignment: {
        id: assignment.id,
        status: assignment.status,
        respondedAt: assignment.respondedAt,
      },
    })
  } catch (error) {
    console.error("reject volunteer offer error", error)

    if (error instanceof Error) {
      if (error.message === "OFFER_NOT_FOUND") {
        return fail("NOT_FOUND", "Volunteer offer not found", 404)
      }

      if (error.message === "OFFER_ALREADY_RESOLVED") {
        return fail("CONFLICT", "This volunteer offer was already resolved", 409)
      }
    }

    return fail("INTERNAL_ERROR", "Failed to reject volunteer offer", 500)
  }
}
