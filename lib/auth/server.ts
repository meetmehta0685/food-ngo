import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth/options"

export async function getAuthSession() {
  return getServerSession(authOptions)
}

export async function requireAuthSession() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }

  return session
}

export async function requireRole(role: "DONOR" | "NGO") {
  const session = await requireAuthSession()

  if (session.user.role !== role) {
    throw new Error("FORBIDDEN")
  }

  return session
}
