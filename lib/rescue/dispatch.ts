const DEFAULT_OFFER_DURATION_MS = 45_000
const DEFAULT_MAX_ATTEMPTS = 5
const DEFAULT_WORKER_POLL_INTERVAL_MS = 2_000
const DEFAULT_WORKER_BATCH_SIZE = 20

function boundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(maximum, Math.max(minimum, parsed))
}

export type RescueDispatchConfig = {
  offerDurationMs: number
  maxAttempts: number
  workerPollIntervalMs: number
  workerBatchSize: number
}

export function getRescueDispatchConfig(
  env: Record<string, string | undefined> = process.env,
): RescueDispatchConfig {
  return {
    offerDurationMs: boundedInteger(
      env.RESCUE_OFFER_DURATION_MS,
      DEFAULT_OFFER_DURATION_MS,
      10_000,
      10 * 60_000,
    ),
    maxAttempts: boundedInteger(
      env.RESCUE_MAX_OFFER_ATTEMPTS,
      DEFAULT_MAX_ATTEMPTS,
      1,
      20,
    ),
    workerPollIntervalMs: boundedInteger(
      env.RESCUE_WORKER_POLL_INTERVAL_MS,
      DEFAULT_WORKER_POLL_INTERVAL_MS,
      500,
      60_000,
    ),
    workerBatchSize: boundedInteger(
      env.RESCUE_WORKER_BATCH_SIZE,
      DEFAULT_WORKER_BATCH_SIZE,
      1,
      100,
    ),
  }
}

export const terminalDispatchErrors = [
  "NO_VOLUNTEER_AVAILABLE",
  "DISPATCH_ATTEMPTS_EXHAUSTED",
] as const

export type TerminalDispatchError = (typeof terminalDispatchErrors)[number]

export function isTerminalDispatchError(
  error: unknown,
): error is Error & { message: TerminalDispatchError } {
  return (
    error instanceof Error &&
    terminalDispatchErrors.includes(error.message as TerminalDispatchError)
  )
}
