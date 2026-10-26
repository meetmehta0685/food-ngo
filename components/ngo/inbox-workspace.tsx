"use client"

import { useMemo, useState } from "react"
import { Package } from "@phosphor-icons/react"

import { NgoInboxList, type InboxCandidate } from "@/components/ngo/inbox-list"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const filterItems = [
  { value: "ALL", label: "All rescue alerts" },
  { value: "URGENT", label: "Urgent · under 1 hour" },
  { value: "HIGH", label: "High priority" },
]

export function NgoInboxWorkspace({ candidates }: { candidates: InboxCandidate[] }) {
  const [filter, setFilter] = useState("ALL")
  const filteredCandidates = useMemo(
    () => candidates.filter((candidate) => {
      if (filter === "ALL") return true
      const urgent = candidate.rank === 1 || candidate.distanceKm < 2
      const high = candidate.rank === 2 || candidate.distanceKm < 3.5
      return filter === "URGENT" ? urgent : high && !urgent
    }),
    [candidates, filter],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="outline">
          {filteredCandidates.length} visible
        </Badge>
        <Select items={filterItems} value={filter} onValueChange={(value) => setFilter(value ?? "ALL")}>
          <SelectTrigger aria-label="Filter rescue alerts" className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {filterItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {filteredCandidates.length === 0 && candidates.length > 0 ? (
        <Empty className="min-h-60 border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Package weight="duotone" /></EmptyMedia>
            <EmptyTitle>No alerts match this filter</EmptyTitle>
            <EmptyDescription>Switch to all rescue alerts to see the full nearby queue.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <NgoInboxList candidates={filteredCandidates} />
      )}
    </div>
  )
}
