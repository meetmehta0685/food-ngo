import { describe, expect, it } from "vitest"

import {
  buildRescueLocationMessage,
  RESCUE_LOCATION_EVENT,
} from "../../lib/realtime/rescue-location"

describe("rescue location realtime messages", () => {
  it("builds a stable assignment-scoped location payload", () => {
    expect(
      buildRescueLocationMessage({
        assignmentId: "assignment-1",
        lat: 21.19,
        lng: 72.79,
        accuracy: 12,
        speed: 8,
        heading: 135,
        rescueStatus: "EN_ROUTE_TO_PICKUP",
        clientTimestamp: new Date("2026-08-03T16:00:00.000Z"),
        serverTimestamp: new Date("2026-08-03T16:00:01.000Z"),
      }),
    ).toEqual({
      assignmentId: "assignment-1",
      lat: 21.19,
      lng: 72.79,
      accuracy: 12,
      speed: 8,
      heading: 135,
      rescueStatus: "EN_ROUTE_TO_PICKUP",
      clientTimestamp: "2026-08-03T16:00:00.000Z",
      serverTimestamp: "2026-08-03T16:00:01.000Z",
    })
    expect(RESCUE_LOCATION_EVENT).toBe("location:update")
  })
})
