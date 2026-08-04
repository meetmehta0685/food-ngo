import type { DonationStatus, Role } from "@prisma/client"
import { CheckCircle, Circle, Clock } from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { statusLabel } from "@/lib/donations/labels"
import { formatAppDateTime } from "@/lib/format-date"

type TimelineEvent = {
  id: string
  status: DonationStatus
  note: string | null
  createdAt: string | Date
  actor: {
    name: string
    role: Role
  }
}

const STATUS_ORDER: DonationStatus[] = [
  "REPORTED",
  "MATCHING",
  "NOTIFIED",
  "ACCEPTED",
  "PICKUP_IN_PROGRESS",
  "PICKED_UP",
  "DELIVERED",
]

export function StatusTimeline({
  currentStatus,
  events,
}: {
  currentStatus: DonationStatus
  events: TimelineEvent[]
}) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  const progressValue = currentIndex < 0 ? 0 : ((currentIndex + 1) / STATUS_ORDER.length) * 100

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground font-mono text-[10px] font-medium uppercase tracking-widest">
          Live status
        </p>
        <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px]">
          {statusLabel(currentStatus)}
        </Badge>
      </div>

      <Progress value={progressValue} aria-label={`Delivery progress: ${statusLabel(currentStatus)}`} />

      {events.length === 0 ? (
        <Empty className="min-h-36 border-dashed p-4">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Clock weight="duotone" /></EmptyMedia>
            <EmptyTitle>Waiting for the first update</EmptyTitle>
            <EmptyDescription>Status milestones will appear here as the rescue moves.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ol className="flex flex-col">
          {events.map((event, index) => {
            const isLast = index === events.length - 1

            return (
              <li key={event.id} className="relative flex gap-4 pb-4 last:pb-0">
                {!isLast ? (
                  <div className="bg-border absolute left-3 top-7 bottom-0 w-px" />
                ) : null}

                <div className="relative z-10 mt-0.5 shrink-0">
                  {isLast ? (
                    <CheckCircle weight="fill" className="size-6 text-success" />
                  ) : (
                    <Circle weight="fill" className="size-6 text-muted-foreground/40" />
                  )}
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{statusLabel(event.status)}</p>
                    <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                      {formatAppDateTime(event.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    by {event.actor.name}
                    <span className="text-border mx-1">/</span>
                    <span className="font-mono text-[10px] uppercase">{event.actor.role}</span>
                  </p>
                  {event.note ? (
                    <p className="text-foreground/80 mt-1.5 text-xs leading-relaxed">{event.note}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
