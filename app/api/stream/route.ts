import { fail } from "@/lib/api/response"
import { getApiUser } from "@/lib/auth/api"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const encoder = new TextEncoder()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function GET(request: Request) {
  const user = await getApiUser()

  if (!user) {
    return fail("UNAUTHORIZED", "Sign in required", 401)
  }

  const url = new URL(request.url)
  const cursorParam = url.searchParams.get("cursor")
  let cursor = BigInt(0)

  if (cursorParam) {
    try {
      cursor = BigInt(cursorParam)
    } catch {
      return fail("VALIDATION_ERROR", "Cursor must be a valid integer", 400)
    }
  }

  let closed = false
  request.signal.addEventListener("abort", () => {
    closed = true
  })

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("retry: 3000\n\n"))

      let lastHeartbeat = Date.now()

      while (!closed) {
        try {
          const events = await db.liveEvent.findMany({
            where: {
              userId: user.id,
              id: {
                gt: cursor,
              },
            },
            orderBy: { id: "asc" },
            take: 100,
          })

          for (const event of events) {
            cursor = event.id
            const payload = JSON.stringify({
              id: event.id.toString(),
              type: event.eventType,
              payload: event.payloadJson,
              createdAt: event.createdAt.toISOString(),
            })

            controller.enqueue(
              encoder.encode(`id: ${event.id.toString()}\nevent: ${event.eventType}\ndata: ${payload}\n\n`),
            )
          }

          if (Date.now() - lastHeartbeat > 15000) {
            controller.enqueue(
              encoder.encode(
                `event: heartbeat\ndata: ${JSON.stringify({
                  cursor: cursor.toString(),
                  ts: new Date().toISOString(),
                })}\n\n`,
              ),
            )
            lastHeartbeat = Date.now()
          }

          await sleep(1000)
        } catch (error) {
          console.error("sse stream error", error)
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ message: "stream_error" })}\n\n`,
            ),
          )
          await sleep(2000)
        }
      }

      controller.close()
    },
    cancel() {
      closed = true
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
