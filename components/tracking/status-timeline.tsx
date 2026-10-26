import type { DonationStatus, Role } from "@prisma/client"
import { Clock } from "@phosphor-icons/react/dist/ssr"

import { KolamRoute } from "@/components/kolam/kolam-route"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
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
  const delivered = currentStatus === "DELIVERED"

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Now: {statusLabel(currentStatus)}</p>
        <Badge variant={delivered ? "default" : "outline"} className={cn(delivered && "bg-success text-success-foreground")}>
          {currentIndex < 0 ? "–" : `${currentIndex + 1} of ${STATUS_ORDER.length}`}
        </Badge>
      </div>

      <KolamRoute
        stages={STATUS_ORDER.map((status) => ({ key: status, label: statusLabel(status) }))}
        current={Math.max(0, currentIndex)}
        complete={delivered}
        orientation="horizontal"
        size="compact"
        showLabels={false}
        label={`Delivery progress: ${statusLabel(currentStatus)}`}
      />

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
            const live = isLast && !delivered

            return (
              <li key={event.id} className="relative flex gap-4 pb-5 last:pb-0">
                {!isLast ? (
                  <div className="bg-foreground/20 absolute bottom-0 left-[0.6875rem] top-6 w-0.5 rounded-full" />
                ) : null}

                <div className="relative z-10 mt-1 flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
                  {live ? (
                    <span className="border-warning flex size-6 items-center justify-center rounded-full border-2">
                      <span className="bg-warning size-2.5 rounded-full" />
                    </span>
                  ) : (
                    <span className={cn("size-3.5 rounded-full", isLast ? "bg-success" : "bg-foreground")} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="text-base font-semibold">{statusLabel(event.status)}</p>
                    <time className="text-muted-foreground shrink-0 text-sm">
                      {formatAppDateTime(event.createdAt)}
                    </time>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    by {event.actor.name}
                    <span className="text-border mx-1.5">/</span>
                    <span className="text-xs font-semibold">{event.actor.role}</span>
                  </p>
                  {event.note ? (
                    <p className="text-foreground/80 mt-1.5 text-sm leading-relaxed">{event.note}</p>
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
