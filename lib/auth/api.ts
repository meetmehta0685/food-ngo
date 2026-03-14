import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth/options"

export async function getApiUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session.user.role) {
    return null
  }

  return {
    id: session.user.id,
    role: session.user.role,
  }
}
