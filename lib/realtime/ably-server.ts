import { Rest } from "ably"

declare global {
  var ablyRest: Rest | undefined
}

export function isAblyConfigured() {
  return Boolean(process.env.ABLY_API_KEY?.trim())
}

export function getAblyRest() {
  const key = process.env.ABLY_API_KEY?.trim()

  if (!key) {
    throw new Error("ABLY_NOT_CONFIGURED")
  }

  if (!global.ablyRest) {
    global.ablyRest = new Rest({ key })
  }

  return global.ablyRest
}
