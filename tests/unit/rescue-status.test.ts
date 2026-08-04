import { describe, expect, it } from "vitest"

import {
  assertRescueAssignmentTransition,
  canTransitionRescueAssignment,
} from "../../lib/rescue/status"

describe("rescue assignment transitions", () => {
  it("allows a volunteer to accept an active offer", () => {
    expect(canTransitionRescueAssignment("OFFERED", "ACCEPTED")).toBe(true)
  })

  it("allows an offered assignment to expire or be rejected", () => {
    expect(canTransitionRescueAssignment("OFFERED", "EXPIRED")).toBe(true)
    expect(canTransitionRescueAssignment("OFFERED", "REJECTED")).toBe(true)
  })

  it("prevents pickup from being skipped before acceptance and arrival", () => {
    expect(canTransitionRescueAssignment("OFFERED", "PICKED_UP")).toBe(false)
    expect(() =>
      assertRescueAssignmentTransition("OFFERED", "PICKED_UP"),
    ).toThrow("INVALID_RESCUE_TRANSITION:OFFERED->PICKED_UP")
  })

  it("keeps terminal assignments terminal", () => {
    expect(canTransitionRescueAssignment("DELIVERED", "ACCEPTED")).toBe(false)
    expect(canTransitionRescueAssignment("REJECTED", "OFFERED")).toBe(false)
  })
})
