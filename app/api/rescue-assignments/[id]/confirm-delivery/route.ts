import { fail, ok } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { confirmRescueDelivery } from "@/lib/rescue/service"

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(_: Request, context: Context) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  if (user.role !== "NGO") {
    return fail("FORBIDDEN", "Only the assigned NGO can confirm delivery", 403)
  }

  try {
    const { id } = await context.params
    const assignment = await confirmRescueDelivery({
      assignmentId: id,
      ngoUserId: user.id,
    })

    return ok({
      assignment: {
        id: assignment.id,
        status: assignment.status,
        completedAt: assignment.completedAt,
      },
    })
  } catch (error) {
    console.error("confirm rescue delivery error", error)

    if (error instanceof Error) {
      if (error.message === "ASSIGNMENT_NOT_FOUND") {
        return fail("NOT_FOUND", "Rescue assignment not found", 404)
      }

      if (error.message === "DELIVERY_NOT_READY") {
        return fail(
          "DELIVERY_NOT_READY",
          "The volunteer must arrive at the NGO before receipt can be confirmed",
          409,
        )
      }
    }

    return fail("INTERNAL_ERROR", "Failed to confirm delivery", 500)
  }
}
