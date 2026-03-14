import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { Bell, ArrowLeft, EnvelopeSimple, BellRinging, Clock } from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth/options"

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  let notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 60,
  })

  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  if (unreadCount > 0) {
    const readAt = new Date()

    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        readAt: null,
      },
      data: { readAt },
    })

    notifications = notifications.map((notification) =>
      notification.readAt ? notification : { ...notification, readAt },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">Activity log</p>
          <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">In-app and email delivery confirmations.</p>
        </div>
        {session.user.role === "NGO" ? (
          <Link href="/ngo/inbox">
            <Button variant="outline" size="sm">
              <ArrowLeft weight="bold" className="mr-1.5 h-3.5 w-3.5" />
              Inbox
            </Button>
          </Link>
        ) : (
          <Link href="/donor/requests">
            <Button variant="outline" size="sm">
              <ArrowLeft weight="bold" className="mr-1.5 h-3.5 w-3.5" />
              Requests
            </Button>
          </Link>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/90 p-8 sm:p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <Bell weight="duotone" className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-xl mb-1">No notifications yet</h2>
          <p className="text-muted-foreground text-sm">Status updates will appear here in real time.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`group relative rounded-xl border bg-card/90 p-4 sm:p-5 transition-all hover:shadow-sm ${
                !item.readAt
                  ? "border-primary/25 bg-primary/[0.02]"
                  : "border-border/60"
              }`}
            >
              {!item.readAt && (
                <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-[pulse-dot_2s_ease-in-out_infinite]" />
              )}

              <div className="flex items-start gap-3.5">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  item.channel === "EMAIL"
                    ? "bg-warm/10 text-warm"
                    : "bg-primary/10 text-primary"
                }`}>
                  {item.channel === "EMAIL" ? (
                    <EnvelopeSimple weight="duotone" className="h-4 w-4" />
                  ) : (
                    <BellRinging weight="duotone" className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {!item.readAt && (
                      <Badge className="bg-primary/15 text-primary border-0 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0">
                        new
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[13px] leading-relaxed">{item.body}</p>
                  <div className="flex items-center gap-3 pt-0.5">
                    <span className="inline-flex items-center gap-1 text-muted-foreground text-[11px] font-mono">
                      <Clock weight="bold" className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                    <Badge variant="outline" className="border-border/80 font-mono text-[9px] uppercase tracking-wider px-1.5 py-0">
                      {item.channel}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
