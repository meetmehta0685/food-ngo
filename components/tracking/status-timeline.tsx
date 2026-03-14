import type { DonationStatus, Role } from "@prisma/client"
import { CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { statusLabel } from "@/lib/donations/labels"

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Live status</p>
        <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px]">
          {statusLabel(currentStatus)}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STATUS_ORDER.map((status, i) => {
          const reached = i <= currentIndex
          return (
            <div
              key={status}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                reached ? "bg-primary" : "bg-border"
              }`}
            />
          )
        })}
      </div>

      <ol className="space-y-0">
        {events.map((event, index) => {
          const isLast = index === events.length - 1
          return (
            <li key={event.id} className={`relative flex gap-4 ${!isLast ? "pb-4" : ""}`}>
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border" />
              )}

              {/* Dot */}
              <div className="relative z-10 flex-shrink-0 mt-0.5">
                {isLast ? (
                  <CheckCircle weight="fill" className="h-6 w-6 text-primary" />
                ) : (
                  <Circle weight="fill" className="h-6 w-6 text-border" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{statusLabel(event.status)}</p>
                  <span className="text-muted-foreground font-mono text-[10px] flex-shrink-0">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">
                  by {event.actor.name}
                  <span className="mx-1 text-border">/</span>
                  <span className="font-mono text-[10px] uppercase">{event.actor.role}</span>
                </p>
                {event.note ? (
                  <p className="text-xs mt-1.5 text-foreground/80 leading-relaxed">{event.note}</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
