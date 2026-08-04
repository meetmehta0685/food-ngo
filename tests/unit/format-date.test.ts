import { describe, expect, it } from "vitest"

import { formatAppDateTime, formatAppTime } from "../../lib/format-date"

describe("deterministic application dates", () => {
  const timestamp = "2026-08-03T15:50:00.000Z"

  it("uses the configured India time zone for time-only labels", () => {
    expect(formatAppTime(timestamp)).toBe("09:20 pm")
  })

  it("uses one server/client-safe date-time representation", () => {
    expect(formatAppDateTime(timestamp)).toBe("3 Aug 2026, 9:20:00 pm")
  })
})
