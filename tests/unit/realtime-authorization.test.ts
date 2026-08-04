import { describe, expect, it } from "vitest"

import {
  buildRealtimeCapability,
  canSubscribeToRescueChannels,
  rescueChannel,
  userChannel,
} from "../../lib/realtime/authorization"

describe("realtime channel authorization", () => {
  it("grants subscribe-only access to the current user and assignments", () => {
    expect(buildRealtimeCapability("user-1", ["assignment-1"])).toEqual({
      "user:user-1": ["subscribe"],
      "rescue:assignment-1": ["subscribe"],
    })
  })

  it("deduplicates assignment channels", () => {
    expect(
      Object.keys(
        buildRealtimeCapability("user-1", ["assignment-1", "assignment-1"]),
      ),
    ).toEqual(["user:user-1", "rescue:assignment-1"])
  })

  it("uses namespaced channel names", () => {
    expect(userChannel("abc")).toBe("user:abc")
    expect(rescueChannel("xyz")).toBe("rescue:xyz")
  })

  it("keeps donors off rescue location channels", () => {
    expect(canSubscribeToRescueChannels("DONOR")).toBe(false)
    expect(canSubscribeToRescueChannels("NGO")).toBe(true)
    expect(canSubscribeToRescueChannels("VOLUNTEER")).toBe(true)
  })

  it("grants volunteer presence only on assigned rescue channels", () => {
    expect(
      buildRealtimeCapability(
        "volunteer-1",
        ["assignment-1"],
        "VOLUNTEER",
      ),
    ).toEqual({
      "user:volunteer-1": ["subscribe"],
      "rescue:assignment-1": ["subscribe", "presence"],
    })

    expect(
      buildRealtimeCapability("ngo-1", ["assignment-1"], "NGO"),
    ).toEqual({
      "user:ngo-1": ["subscribe"],
      "rescue:assignment-1": ["subscribe"],
    })
  })
})
