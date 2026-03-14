import { ok, fail } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { updateAssignedDonationStatus } from "@/lib/donations/service"
import { donationStatusSchema } from "@/lib/validations/donation"

type Context = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: Context) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "NGO") {
    return fail("FORBIDDEN", "Only NGOs can update donation status", 403)
  }

  try {
    const body = await request.json()
    const parsed = donationStatusSchema.safeParse(body)

    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid status payload", 400, parsed.error.flatten())
    }

    const { id } = await context.params
    const donation = await updateAssignedDonationStatus(id, user.id, parsed.data)

    return ok({
      donation: {
        id: donation.id,
        status: donation.status,
        updatedAt: donation.updatedAt,
      },
    })
  } catch (error) {
    console.error("update donation status error", error)

    if (error instanceof Error && error.message.startsWith("INVALID_STATUS_TRANSITION:")) {
      return fail("INVALID_STATUS_TRANSITION", "This status change is not allowed", 400)
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail("FORBIDDEN", "You are not assigned to this donation", 403)
    }

    return fail("INTERNAL_ERROR", "Failed to update status", 500)
  }
}
