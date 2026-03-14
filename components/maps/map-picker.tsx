"use client"

import dynamic from "next/dynamic"

const DynamicMapPicker = dynamic(
  () => import("@/components/maps/map-picker-client").then((module) => module.MapPickerClient),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted/30 text-muted-foreground flex h-80 w-full items-center justify-center rounded-lg border text-xs">
        Loading map picker...
      </div>
    ),
  },
)

export function MapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}) {
  return <DynamicMapPicker lat={lat} lng={lng} onChange={onChange} />
}
