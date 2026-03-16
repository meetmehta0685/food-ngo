"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import type { DragEndEvent } from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { ensureLeafletIcons } from "@/components/maps/leaflet-config";

type MapPickerClientProps = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
};

function ClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (event) => {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function ViewportSync({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);

  return null;
}

export function MapPickerClient({ lat, lng, onChange }: MapPickerClientProps) {
  ensureLeafletIcons();

  const position: [number, number] = [lat, lng];

  return (
    <MapContainer
      center={position}
      zoom={13}
      className="h-80 w-full rounded-lg border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ViewportSync lat={lat} lng={lng} />
      <ClickHandler onChange={onChange} />
      <Marker
        position={position}
        draggable
        eventHandlers={{
          dragend: (event: DragEndEvent) => {
            const marker = event.target;
            const next = marker.getLatLng();
            onChange(next.lat, next.lng);
          },
        }}
      />
    </MapContainer>
  );
}
