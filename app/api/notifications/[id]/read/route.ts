import { ok, fail } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { db } from "@/lib/db"

type Context = {
  params: Promise<{ id: string }>
}

export async function PATCH(_: Request, context: Context) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  try {
    const { id } = await context.params

    const notification = await db.notification.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!notification || notification.userId !== user.id) {
      return fail("NOT_FOUND", "Notification not found", 404)
    }

    await db.notification.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    })

    return ok({ success: true })
  } catch (error) {
    console.error("mark notification read error", error)
    return fail("INTERNAL_ERROR", "Failed to mark notification", 500)
  }
}
