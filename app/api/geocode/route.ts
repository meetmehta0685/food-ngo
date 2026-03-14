import { ok, fail } from "@/lib/api/response"
import { searchAddressCandidates } from "@/lib/maps/geocode"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get("q")

  if (!query || query.trim().length < 3) {
    return fail("VALIDATION_ERROR", "Query must be at least 3 characters", 400)
  }

  try {
    const candidates = await searchAddressCandidates(query)

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
