import { ok, fail } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { db } from "@/lib/db"

export async function GET() {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  try {
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    })

    const unread = notifications.filter((item) => !item.readAt).length

    return ok({ notifications, unread })
  } catch (error) {
    console.error("notifications list error", error)
    return fail("INTERNAL_ERROR", "Failed to load notifications", 500)
  }
}
