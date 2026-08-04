"use client"

import { BellIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type NotificationResponse = {
  unread: number
}

export function NotificationBell() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as NotificationResponse

        if (mounted) {
          setUnread(payload.unread ?? 0)
        }
      } catch (error) {
        console.error("notification bell fetch error", error)
      }
    }

    const refresh = () => {
      void load()
    }

    void load()
    window.addEventListener("notifications:refresh", refresh)

    return () => {
      mounted = false
      window.removeEventListener("notifications:refresh", refresh)
    }
  }, [])

  return (
    <span className="relative inline-flex">
      <Button
        render={<Link href="/notifications" />}
        nativeButton={false}
        variant="ghost"
        size="icon"
        aria-label="Open notifications"
        className="rounded-lg"
      >
        <BellIcon weight={unread > 0 ? "fill" : "regular"} />
      </Button>
      {unread > 0 ? (
        <Badge className="motion-safe:animate-pulse absolute -right-1 -top-1 min-w-4 justify-center px-1 font-mono text-[0.625rem]">
          {unread > 9 ? "9+" : unread}
        </Badge>
      ) : null}
    </span>
  )
}
