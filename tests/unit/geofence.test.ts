import { describe, expect, it } from "vitest"

import {
  GEOFENCE_DWELL_MS,
  evaluateGeofence,
} from "../../lib/rescue/geofence"

const target = { targetLat: 21.1702, targetLng: 72.8311 }
const startedAt = new Date("2026-07-30T17:00:00.000Z")

describe("rescue geofence", () => {
  it("starts dwell inside the radius but does not arrive immediately", () => {
    const result = evaluateGeofence({
      ...target,
      lat: 21.1702,
      lng: 72.8311,
      accuracy: 10,
      enteredAt: null,
      now: startedAt,
    })

    expect(result.inside).toBe(true)
    expect(result.arrived).toBe(false)
    expect(result.enteredAt).toEqual(startedAt)
  })

  it("arrives after continuous trusted dwell", () => {
    const result = evaluateGeofence({
      ...target,
      lat: 21.1702,
      lng: 72.8311,
      accuracy: 10,
      enteredAt: startedAt,
      now: new Date(startedAt.getTime() + GEOFENCE_DWELL_MS),
    })

    expect(result.arrived).toBe(true)
  })

  it("resets dwell after a trustworthy outside sample", () => {
    const result = evaluateGeofence({
      ...target,
      lat: 21.18,
      lng: 72.84,
      accuracy: 10,
      enteredAt: startedAt,
      now: new Date(startedAt.getTime() + GEOFENCE_DWELL_MS),
    })

    expect(result.inside).toBe(false)
    expect(result.enteredAt).toBeNull()
  })

  it("does not trigger arrival from low-accuracy GPS", () => {
    const result = evaluateGeofence({
      ...target,
      lat: 21.1702,
      lng: 72.8311,
      accuracy: 80,
      enteredAt: startedAt,
      now: new Date(startedAt.getTime() + GEOFENCE_DWELL_MS),
    })

    expect(result.trusted).toBe(false)
    expect(result.arrived).toBe(false)
    expect(result.enteredAt).toEqual(startedAt)
  })
})
