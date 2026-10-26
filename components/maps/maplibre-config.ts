import { setWorkerUrl, type StyleSpecification } from "maplibre-gl"

// Bundling breaks MapLibre's import.meta.url worker lookup; postinstall copies
// the worker and its shared chunk into public/maplibre.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs")

export function createOpenStreetMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      openStreetMap: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: "openStreetMap",
        type: "raster",
        source: "openStreetMap",
      },
    ],
  }
}
