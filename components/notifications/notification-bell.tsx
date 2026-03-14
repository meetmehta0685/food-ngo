"use client"

import { BellIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

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
    <Link href="/notifications" className="relative">
      <Button variant="ghost" size="icon" aria-label="Open notifications" className="rounded-lg hover:bg-primary/5">
        <BellIcon weight={unread > 0 ? "fill" : "regular"} className="h-[18px] w-[18px]" />
      </Button>
      {unread > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] rounded-full bg-primary text-primary-foreground px-1 text-center font-mono text-[9px] font-bold leading-[18px] animate-[pulse-dot_2s_ease-in-out_infinite]">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  )
}
