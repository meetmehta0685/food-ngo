import { Prisma } from "@prisma/client"

import { fail, ok } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { acceptVolunteerOffer } from "@/lib/rescue/service"

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
    const assignment = await acceptVolunteerOffer({
      assignmentId: id,
      volunteerId: user.id,
    })

    return ok({
      assignment: {
        id: assignment.id,
        status: assignment.status,
        acceptedAt: assignment.acceptedAt,
      },
    })
  } catch (error) {
    console.error("accept volunteer offer error", error)

    if (error instanceof Error) {
      if (error.message === "OFFER_NOT_FOUND") {
        return fail("NOT_FOUND", "Volunteer offer not found", 404)
      }

      if (error.message === "OFFER_EXPIRED") {
        return fail("OFFER_EXPIRED", "This volunteer offer has expired", 409)
      }

      if (error.message === "OFFER_ALREADY_RESOLVED") {
        return fail("CONFLICT", "This volunteer offer was already resolved", 409)
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail(
        "VOLUNTEER_BUSY",
        "You already have another active rescue assignment",
        409,
      )
    }

    return fail("INTERNAL_ERROR", "Failed to accept volunteer offer", 500)
  }
}
