import { fail, ok } from "@/lib/api/response"
import { consumeRateLimit, getRequestIp } from "@/lib/api/rate-limit"
import { db } from "@/lib/db"
import { contactInquirySchema } from "@/lib/validations/contact"

export async function POST(request: Request) {
  const limiter = consumeRateLimit({
    key: `contact:${getRequestIp(request)}`,
    limit: 10,
    windowMs: 60_000,
  })

  if (!limiter.allowed) {
    return fail("RATE_LIMITED", "Too many contact requests. Please try again shortly.", 429)
  }

  try {
    const body = await request.json()
    const parsed = contactInquirySchema.safeParse(body)

    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid contact payload", 400, parsed.error.flatten())
    }

    const inquiry = await db.contactInquiry.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        organization: parsed.data.organization,
        topic: parsed.data.topic,
        message: parsed.data.message,
      },
      select: { id: true, createdAt: true },
    })

    return ok({ inquiry })
  } catch (error) {
    console.error("contact route error", error)
    return fail("INTERNAL_ERROR", "Failed to submit inquiry", 500)
  }
}
