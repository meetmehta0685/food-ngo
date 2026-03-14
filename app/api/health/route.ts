import { ok } from "@/lib/api/response"
import { db } from "@/lib/db"

export async function GET() {
  let dbHealthy = false

  try {
    await db.$queryRaw`SELECT 1`
    dbHealthy = true
  } catch (error) {
    console.error("health db check failed", error)
  }

  return ok({
    status: dbHealthy ? "ok" : "degraded",
    checks: {
      db: dbHealthy,
      notificationMode: "IN_APP_TOAST_ONLY",
    },
    timestamp: new Date().toISOString(),
  })
}
