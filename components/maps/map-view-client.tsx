"use client";

import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
} from "react-leaflet";

import { ensureLeafletIcons } from "@/components/maps/leaflet-config";

type MarkerPoint = {
  lat: number;
  lng: number;
  label: string;
};

type MapViewClientProps = {
  donor: MarkerPoint;
  ngo?: MarkerPoint | null;
  courier?: MarkerPoint | null;
};

export function MapViewClient({ donor, ngo, courier }: MapViewClientProps) {
  ensureLeafletIcons();

  const center: [number, number] = courier
    ? [courier.lat, courier.lng]
    : ngo
      ? [(donor.lat + ngo.lat) / 2, (donor.lng + ngo.lng) / 2]
      : [donor.lat, donor.lng];

  const routePoints: [number, number][] = [];

  if (ngo) {
    routePoints.push([ngo.lat, ngo.lng]);
  }

  routePoints.push([donor.lat, donor.lng]);

  if (courier) {
    routePoints.push([courier.lat, courier.lng]);
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-80 w-full rounded-lg border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[donor.lat, donor.lng]}>
        <Popup>{donor.label}</Popup>
      </Marker>

      {ngo ? (
        <Marker position={[ngo.lat, ngo.lng]}>
          <Popup>{ngo.label}</Popup>
        </Marker>
      ) : null}

      {courier ? (
        <Marker position={[courier.lat, courier.lng]}>
          <Popup>{courier.label}</Popup>
        </Marker>
      ) : null}

      {routePoints.length >= 2 ? <Polyline positions={routePoints} /> : null}
    </MapContainer>
  );
}
