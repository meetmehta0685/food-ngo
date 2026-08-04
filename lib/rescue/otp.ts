import { createHmac, randomInt, timingSafeEqual } from "node:crypto"

const OTP_LENGTH = 6

function resolveSecret(secret?: string) {
  const value =
    secret ?? process.env.PICKUP_OTP_SECRET ?? process.env.NEXTAUTH_SECRET

  if (!value || value.length < 16) {
    throw new Error("OTP_SECRET_MISSING")
  }

  return value
}

export function hashPickupOtp(
  assignmentId: string,
  code: string,
  secret?: string,
) {
  return createHmac("sha256", resolveSecret(secret))
    .update(`${assignmentId}:${code}`)
    .digest("hex")
}

export function generatePickupOtp(assignmentId: string, secret?: string) {
  const code = randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, "0")

  return {
    code,
    hash: hashPickupOtp(assignmentId, code, secret),
  }
}

export function verifyPickupOtpHash(input: {
  assignmentId: string
  code: string
  expectedHash: string
  secret?: string
}) {
  if (!/^\d{6}$/.test(input.code)) {
    return false
  }

  const actual = Buffer.from(
    hashPickupOtp(input.assignmentId, input.code, input.secret),
    "hex",
  )
  const expected = Buffer.from(input.expectedHash, "hex")

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
