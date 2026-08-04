import { describe, expect, it } from "vitest"

import { isExpectedAblyClosure } from "../../lib/realtime/errors"

describe("Ably lifecycle errors", () => {
  it("recognizes deliberate connection cleanup", () => {
    expect(
      isExpectedAblyClosure({ code: 80017, message: "Connection closed" }),
    ).toBe(true)
    expect(isExpectedAblyClosure({ message: "Connection closing" })).toBe(true)
  })

  it("does not hide genuine realtime failures", () => {
    expect(
      isExpectedAblyClosure({ code: 40140, message: "Token expired" }),
    ).toBe(false)
    expect(isExpectedAblyClosure(new Error("Network unavailable"))).toBe(false)
  })
})
