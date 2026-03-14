const buckets = new Map<string, { count: number; resetAt: number }>()

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

export function consumeRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    }
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
    }
  }

  bucket.count += 1
  buckets.set(key, bucket)

  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  }
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown"
  }

  return request.headers.get("x-real-ip") ?? "unknown"
}
