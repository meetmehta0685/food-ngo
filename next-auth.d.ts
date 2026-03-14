import { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: "DONOR" | "NGO"
    }
  }

  interface User {
    role: "DONOR" | "NGO"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    role?: "DONOR" | "NGO"
  }
}
