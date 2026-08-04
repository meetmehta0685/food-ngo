"use client"

import dynamic from "next/dynamic"

const DynamicMapView = dynamic(
  () => import("@/components/maps/map-view-client").then((module) => module.MapViewClient),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted/30 text-muted-foreground flex h-80 w-full items-center justify-center rounded-lg border text-xs" aria-label="Loading map">
        Loading map…
      </div>
    ),
  },
)

type MarkerPoint = {
  lat: number
  lng: number
  label: string
}

type MapViewProps = {
  donor: MarkerPoint
  ngo?: MarkerPoint | null
  courier?: MarkerPoint | null
  liveAssignmentId?: string | null
  liveCourierLabel?: string
  className?: string
}

export function MapView({
  donor,
  ngo,
  courier,
  liveAssignmentId,
  liveCourierLabel,
  className,
}: MapViewProps) {
  return (
    <DynamicMapView
      donor={donor}
      ngo={ngo}
      courier={courier}
      liveAssignmentId={liveAssignmentId}
      liveCourierLabel={liveCourierLabel}
      className={className}
    />
  )
}
