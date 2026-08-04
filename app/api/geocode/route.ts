import { ok, fail } from "@/lib/api/response"
import {
  reverseGeocodeLocation,
  searchAddressCandidates,
  searchAddressSuggestions,
} from "@/lib/maps/geocode"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get("mode")
  const query = url.searchParams.get("q")

  try {
    if (mode === "reverse") {
      const lat = Number(url.searchParams.get("lat"))
      const lng = Number(url.searchParams.get("lng"))

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return fail("VALIDATION_ERROR", "Valid latitude and longitude are required", 400)
      }

      const result = await reverseGeocodeLocation(lat, lng)

      if (!result) {
        return fail("NOT_FOUND", "Could not identify an address for this location", 404)
      }

      return ok({ result, candidates: [result] })
    }

    if (!query || query.trim().length < 3) {
      return fail("VALIDATION_ERROR", "Query must be at least 3 characters", 400)
    }

    const candidates =
      mode === "suggest"
        ? await searchAddressSuggestions(query)
        : await searchAddressCandidates(query)

    if (candidates.length === 0) {
      return fail(
        "NOT_FOUND",
        "Address not found. Try adding landmark, area, city, and state.",
        404,
      )
    }

    return ok({
      result: candidates[0],
      candidates,
    })
  } catch (error) {
    console.error("geocode route error", error)
    return fail("INTERNAL_ERROR", "Geocoding failed", 500)
  }
}
