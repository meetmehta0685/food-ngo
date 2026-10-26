import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ArrowLeft, Bell, BellRinging, Clock, Envelope } from "@phosphor-icons/react/dist/ssr"

import { PageHeader } from "@/components/layout/page-header"
import { NotificationDeleteButton } from "@/components/notifications/notification-delete-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <PageHeader
        title="Notifications"
        description="Realtime rescue updates, OTP handovers, and delivery audit alerts."
        actions={<Button render={<Link href={getRoleHomePath(session.user.role) ?? "/home"} />} nativeButton={false} variant="outline"><ArrowLeft data-icon="inline-start" />Role workspace</Button>}
      />

      {notifications.length === 0 ? (
        <Empty className="kolam-sheet min-h-80 border border-dashed">
          <EmptyHeader><EmptyMedia variant="icon"><Bell weight="duotone" /></EmptyMedia><EmptyTitle>No dispatch alerts yet</EmptyTitle><EmptyDescription>Claim updates, handover confirmations, and delivery receipts will stream here.</EmptyDescription></EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col border-t">
          {notifications.map((item) => {
            const isEmail = item.channel === "EMAIL"
            return (
              <li key={item.id} className="flex items-start gap-4 border-b py-5">
                <span className={cn("mt-1 flex size-5 shrink-0 items-center justify-center", isEmail ? "text-warning-foreground" : "text-primary")}>{isEmail ? <Envelope weight="bold" /> : <BellRinging weight="bold" />}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={cn("font-sans text-base tracking-normal", item.readAt ? "font-semibold" : "font-bold")}>{item.title}</h2>
                    {!item.readAt ? <Badge className="bg-warning text-warning-foreground">New</Badge> : null}
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed">{item.body}</p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1.5"><Clock />{formatAppDateTime(item.createdAt)}</span>
                    <Badge variant="outline">{item.channel}</Badge>
                  </div>
                </div>
                <NotificationDeleteButton notificationId={item.id} notificationTitle={item.title} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
