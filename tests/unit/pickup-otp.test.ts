import { describe, expect, it } from "vitest"

import {
  generatePickupOtp,
  verifyPickupOtpHash,
} from "../../lib/rescue/otp"

const secret = "test-only-pickup-otp-secret"

describe("pickup OTP", () => {
  it("generates a six-digit code and verifies its HMAC", () => {
    const generated = generatePickupOtp("assignment-1", secret)

    expect(generated.code).toMatch(/^\d{6}$/)
    expect(
      verifyPickupOtpHash({
        assignmentId: "assignment-1",
        code: generated.code,
        expectedHash: generated.hash,
        secret,
      }),
    ).toBe(true)
  })

  it("rejects a different code or assignment", () => {
    const generated = generatePickupOtp("assignment-1", secret)

    expect(
      verifyPickupOtpHash({
        assignmentId: "assignment-1",
        code: "000000",
        expectedHash: generated.hash,
        secret,
      }),
    ).toBe(false)
    expect(
      verifyPickupOtpHash({
        assignmentId: "assignment-2",
        code: generated.code,
        expectedHash: generated.hash,
        secret,
      }),
    ).toBe(false)
  })

  it("rejects malformed input", () => {
    const generated = generatePickupOtp("assignment-1", secret)

    expect(
      verifyPickupOtpHash({
        assignmentId: "assignment-1",
        code: "12345",
        expectedHash: generated.hash,
        secret,
      }),
    ).toBe(false)
  })
})
