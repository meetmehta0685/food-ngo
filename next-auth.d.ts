import { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: "DONOR" | "NGO" | "VOLUNTEER"
    }
  }

  interface User {
    role: "DONOR" | "NGO" | "VOLUNTEER"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    role?: "DONOR" | "NGO" | "VOLUNTEER"
  }
}
