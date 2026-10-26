import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"
import ws from "ws"

declare global {
  var prisma: PrismaClient | undefined
}

const connectionString =
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    "Missing database connection string. Set POSTGRES_PRISMA_URL or DATABASE_URL.",
  )
}

neonConfig.webSocketConstructor = ws

export const db =
  global.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
    log: ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  global.prisma = db
}
