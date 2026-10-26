import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth/options"
import { scheduleBackgroundSync } from "@/lib/background-sync"

export async function getApiUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session.user.role) {
    return null
  }

  scheduleBackgroundSync()

  return {
    id: session.user.id,
    role: session.user.role,
  }
}
