const ABLY_CONNECTION_CLOSED_CODE = 80017

export function isExpectedAblyClosure(error: unknown) {
  if (!error || typeof error !== "object") {
    return false
  }

  const candidate = error as { code?: unknown; message?: unknown }

  return (
    candidate.code === ABLY_CONNECTION_CLOSED_CODE ||
    candidate.message === "Connection closed" ||
    candidate.message === "Connection closing"
  )
}
