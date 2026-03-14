"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type IncomingEvent = {
  id?: string
  type?: string
  payload?: {
    title?: string
    body?: string
    [key: string]: unknown
  }
}

function parseEvent(data: string): IncomingEvent | null {
  try {
    return JSON.parse(data) as IncomingEvent
  } catch {
    return null
  }
}

export function LiveEventListener() {
  const router = useRouter()
  const reconnectRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  useEffect(() => {
    let eventSource: EventSource | null = null

    const setup = () => {
      const cursor = window.localStorage.getItem("live_cursor") ?? "0"
      eventSource = new EventSource(`/api/stream?cursor=${cursor}`)

      const handleEvent = (raw: MessageEvent<string>) => {
        const data = parseEvent(raw.data)

        if (!data) {
          return
        }

        if (data.id) {
          window.localStorage.setItem("live_cursor", data.id)
        }

        if (data.type === "NOTIFICATION_CREATED" && data.payload) {
          window.dispatchEvent(new CustomEvent("notifications:refresh"))
          toast.info(data.payload.title ?? "New update", {
            description: data.payload.body,
          })
        }

        if (
          data.type === "STATUS_CHANGED" ||
          data.type === "MATCH_UPDATED" ||
          data.type === "LOCATION_UPDATED"
        ) {
          router.refresh()
        }
      }

      const types = [
        "NOTIFICATION_CREATED",
        "STATUS_CHANGED",
        "MATCH_UPDATED",
        "LOCATION_UPDATED",
      ]

      types.forEach((type) => {
        eventSource?.addEventListener(type, handleEvent as EventListener)
      })

      eventSource.onmessage = handleEvent

      eventSource.onerror = () => {
        eventSource?.close()

        reconnectRef.current = setTimeout(() => {
          setup()
        }, 3000)
      }
    }

    setup()

    return () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
      }

      eventSource?.close()
    }
  }, [router])

  return null
}
