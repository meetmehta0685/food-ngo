import { ok, fail } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { db } from "@/lib/db"

type Context = {
  params: Promise<{ id: string }>
}

export async function DELETE(_: Request, context: Context) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  try {
    const { id } = await context.params
    const result = await db.notification.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    })

    if (result.count === 0) {
      return fail("NOT_FOUND", "Notification not found", 404)
    }

    return ok({ success: true })
  } catch (error) {
    console.error("delete notification error", error)
    return fail("INTERNAL_ERROR", "Failed to delete notification", 500)
  }
}
