import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ArrowLeft, Bell, BellRinging, Clock, Envelope, Pulse } from "@phosphor-icons/react/dist/ssr"

import { NotificationDeleteButton } from "@/components/notifications/notification-delete-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { db } from "@/lib/db"
import { formatAppDateTime } from "@/lib/format-date"
import { authOptions } from "@/lib/auth/options"
import { getRoleHomePath } from "@/lib/auth/roles"
import { cn } from "@/lib/utils"

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/sign-in")

  let notifications = await db.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 60 })
  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  if (unreadCount > 0) {
    const readAt = new Date()
    await db.notification.updateMany({ where: { userId: session.user.id, readAt: null }, data: { readAt } })
    notifications = notifications.map((notification) => notification.readAt ? notification : { ...notification, readAt })
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]"><Pulse data-icon="inline-start" />System dispatch feed</Badge>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Notifications</h1>
          <p className="text-muted-foreground text-sm leading-6">Realtime rescue updates, OTP handovers, and delivery audit alerts.</p>
        </div>
        <Button render={<Link href={getRoleHomePath(session.user.role) ?? "/home"} />} nativeButton={false} variant="outline"><ArrowLeft data-icon="inline-start" />Role workspace</Button>
      </div>

      {notifications.length === 0 ? (
        <Empty className="min-h-80 border">
          <EmptyHeader><EmptyMedia variant="icon"><Bell weight="duotone" /></EmptyMedia><EmptyTitle>No dispatch alerts yet</EmptyTitle><EmptyDescription>Claim updates, handover confirmations, and delivery receipts will stream here.</EmptyDescription></EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((item) => {
            const isEmail = item.channel === "EMAIL"
            return (
              <Card key={item.id} className={cn(!item.readAt && "border-primary/30")}>
                <CardHeader className="gap-3 pb-3">
                  <div className="flex items-start gap-3">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", isEmail ? "bg-warning/15 text-warning-foreground" : "bg-primary/10 text-primary")}>{isEmail ? <Envelope /> : <BellRinging />}</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1"><div className="flex items-center gap-2"><CardTitle className="truncate text-sm">{item.title}</CardTitle>{!item.readAt ? <Badge variant="secondary" className="font-mono text-[9px] uppercase">New</Badge> : null}</div><CardDescription className="leading-6">{item.body}</CardDescription></div>
                    <NotificationDeleteButton notificationId={item.id} notificationTitle={item.title} />
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-3 pt-0 text-muted-foreground text-[10px]">
                  <span className="inline-flex items-center gap-1.5"><Clock className="text-warning-foreground" />{formatAppDateTime(item.createdAt)}</span>
                  <Badge variant="outline" className="font-mono text-[9px] uppercase">{item.channel}</Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
