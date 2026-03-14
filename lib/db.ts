import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"
import dns from "node:dns"
import ws from "ws"

declare global {
  var prisma: PrismaClient | undefined
}

const runtimeConnectionString =
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL_UNPOOLED

if (!runtimeConnectionString) {
  throw new Error(
    "Missing database connection string. Set POSTGRES_URL_NON_POOLING / POSTGRES_PRISMA_URL / DATABASE_URL.",
  )
}

const publicResolver = new dns.Resolver()
publicResolver.setServers(["8.8.8.8", "1.1.1.1"])

const neonLookup = (
  hostname: string,
  options: number | dns.LookupOneOptions | dns.LookupAllOptions,
  callback: (error: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
) => {
  const fallbackToPublicResolver = () => {
    publicResolver.resolve4(hostname as string, (resolveError, addresses) => {
      if (resolveError || !addresses?.length) {
        callback(resolveError ?? new Error(`Could not resolve ${hostname}`), undefined as never, undefined as never)
        return
      }

      if (typeof options !== "number" && options?.all) {
        callback(
          null,
          addresses.map((address) => ({
            address,
            family: 4,
          })) as never,
          undefined as never,
        )
        return
      }

      const preferredFamily = typeof options === "number" ? options : 4
      callback(null, addresses[0] as never, preferredFamily as never)
    })
  }

  dns.lookup(hostname, options as dns.LookupOptions, (lookupError, address, family) => {
    if (!lookupError) {
      callback(null, address, family)
      return
    }

    const code = (lookupError as NodeJS.ErrnoException).code

    if (code === "ENOTFOUND" || code === "EAI_AGAIN" || code === "EAI_FAIL") {
      fallbackToPublicResolver()
      return
    }

    callback(lookupError, undefined as never, undefined as never)
  })
}

class NeonWebSocket extends ws {
  constructor(
    address: string | URL,
    protocols?: string | string[] | ws.ClientOptions,
    options?: ws.ClientOptions,
  ) {
    if (typeof protocols === "string" || Array.isArray(protocols)) {
      super(address, protocols, { ...options, lookup: neonLookup })
      return
    }

    super(address, { ...(protocols ?? {}), ...(options ?? {}), lookup: neonLookup })
  }
}

neonConfig.webSocketConstructor = NeonWebSocket as unknown as typeof ws

const adapter = new PrismaNeon(
  {
    connectionString: runtimeConnectionString,
  },
  {
    onConnectionError: (error) => {
      console.error("prisma neon connection error", error)
    },
    onPoolError: (error) => {
      console.error("prisma neon pool error", error)
    },
  },
)

export const db =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  global.prisma = db
}
