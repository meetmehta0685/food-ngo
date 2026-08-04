import { describe, expect, it } from "vitest"

import {
  getRescueDispatchConfig,
  isTerminalDispatchError,
} from "../../lib/rescue/dispatch"

describe("rescue dispatch configuration", () => {
  it("uses bounded MVP defaults", () => {
    expect(getRescueDispatchConfig({})).toEqual({
      offerDurationMs: 45_000,
      maxAttempts: 5,
      workerPollIntervalMs: 2_000,
      workerBatchSize: 20,
    })
  })

  it("accepts valid overrides and clamps unsafe values", () => {
    expect(
      getRescueDispatchConfig({
        RESCUE_OFFER_DURATION_MS: "1000",
        RESCUE_MAX_OFFER_ATTEMPTS: "50",
        RESCUE_WORKER_POLL_INTERVAL_MS: "250",
        RESCUE_WORKER_BATCH_SIZE: "0",
      }),
    ).toEqual({
      offerDurationMs: 10_000,
      maxAttempts: 20,
      workerPollIntervalMs: 500,
      workerBatchSize: 1,
    })
  })

  it("only classifies expected exhaustion errors as terminal", () => {
    expect(isTerminalDispatchError(new Error("NO_VOLUNTEER_AVAILABLE"))).toBe(
      true,
    )
    expect(
      isTerminalDispatchError(new Error("DISPATCH_ATTEMPTS_EXHAUSTED")),
    ).toBe(true)
    expect(isTerminalDispatchError(new Error("DATABASE_UNAVAILABLE"))).toBe(
      false,
    )
  })
})
