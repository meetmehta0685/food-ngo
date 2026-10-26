"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef } from "react";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type MapMouseEvent,
} from "maplibre-gl";

import { createOpenStreetMapStyle } from "@/components/maps/maplibre-config";

type MapPickerClientProps = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
};

export function MapPickerClient({ lat, lng, onChange }: MapPickerClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const initialPositionRef = useRef({ lat, lng });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const initialPosition = initialPositionRef.current;
    const map = new MapLibreMap({
      container: containerRef.current,
      center: [initialPosition.lng, initialPosition.lat],
      zoom: 13,
      style: createOpenStreetMapStyle(),
    });
    const marker = new Marker({ color: "var(--primary)", draggable: true })
      .setLngLat([initialPosition.lng, initialPosition.lat])
      .addTo(map);

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    const handleClick = (event: MapMouseEvent) => {
      onChangeRef.current(event.lngLat.lat, event.lngLat.lng);
    };
    const handleDragEnd = () => {
      const next = marker.getLngLat();
      onChangeRef.current(next.lat, next.lng);
    };

    map.on("click", handleClick);
    marker.on("dragend", handleDragEnd);
    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      resizeObserver.disconnect();
      marker.off("dragend", handleDragEnd);
      map.off("click", handleClick);
      marker.remove();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    markerRef.current?.setLngLat([lng, lat]);
    mapRef.current?.easeTo({
      center: [lng, lat],
      duration: 500,
    });
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="h-80 w-full rounded-lg border"
    />
  );
}
