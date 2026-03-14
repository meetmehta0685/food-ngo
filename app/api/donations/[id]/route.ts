import { ok, fail } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { getDonationForUser } from "@/lib/donations/service"

type Context = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: Context) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  try {
    const { id } = await context.params
    const donation = await getDonationForUser(id, user.id, user.role)

    if (!donation) {
      return fail("NOT_FOUND", "Donation not found", 404)
    }

    return ok({ donation })
  } catch (error) {
    console.error("get donation error", error)
    return fail("INTERNAL_ERROR", "Failed to load donation", 500)
  }
}
