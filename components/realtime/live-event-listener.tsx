"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function LiveEventListener() {
  const router = useRouter()
  const previousUnreadRef = useRef<number | null>(null)

  useEffect(() => {
    let active = true

    const syncUpdates = async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { unread?: number }
        const unread = Number(payload.unread ?? 0)

        // Keep badge in sync with polling mode.
        window.dispatchEvent(new CustomEvent("notifications:refresh"))

        if (previousUnreadRef.current !== null && unread > previousUnreadRef.current) {
          toast.info("New update", {
            description: "You have new notifications.",
          })
          router.refresh()
        }

        previousUnreadRef.current = unread
      } catch (error) {
        console.error("live polling error", error)
      }
    }

    void syncUpdates()

    const notificationsInterval = window.setInterval(() => {
      if (!active) {
        return
      }

      void syncUpdates()
    }, 10000)

    const refreshInterval = window.setInterval(() => {
      if (!active) {
        return
      }

      router.refresh()
    }, 30000)

    return () => {
      active = false
      window.clearInterval(notificationsInterval)
      window.clearInterval(refreshInterval)
    }
  }, [router])

  return null
}
