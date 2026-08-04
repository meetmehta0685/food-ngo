import { fail, ok } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { requestVolunteerForDonation } from "@/lib/rescue/service"

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(_: Request, context: Context) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "NGO") {
    return fail("FORBIDDEN", "Only NGOs can request volunteers", 403)
  }

  try {
    const { id } = await context.params
    const assignment = await requestVolunteerForDonation({
      donationId: id,
      ngoUserId: user.id,
    })

    return ok({ assignment })
  } catch (error) {
    console.error("request volunteer error", error)

    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return fail("FORBIDDEN", "You are not assigned to this donation", 403)
      }

      if (error.message === "DONATION_NOT_READY") {
        return fail(
          "DONATION_NOT_READY",
          "Accept the donation before requesting a volunteer",
          409,
        )
      }

      if (error.message === "NGO_LOCATION_REQUIRED") {
        return fail(
          "NGO_LOCATION_REQUIRED",
          "Add the NGO location before requesting a volunteer",
          409,
        )
      }

      if (error.message === "ACTIVE_ASSIGNMENT_EXISTS") {
        return fail(
          "ACTIVE_ASSIGNMENT_EXISTS",
          "A volunteer offer or assignment is already active",
          409,
        )
      }

      if (error.message === "NO_VOLUNTEER_AVAILABLE") {
        return fail(
          "NO_VOLUNTEER_AVAILABLE",
          "No available volunteer with a fresh nearby location was found",
          404,
        )
      }
    }

    return fail("INTERNAL_ERROR", "Failed to request a volunteer", 500)
  }
}
