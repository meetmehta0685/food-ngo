type GeocodeHit = {
  lat: string
  lon: string
  display_name: string
  importance?: number
  class?: string
  type?: string
  name?: string
}

export type GeocodeCandidate = {
  lat: number
  lng: number
  displayName: string
  sourceQuery: string
  relevance: number
  importance: number
  category?: string
  kind?: string
}

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search"
const WIKIDATA_ENDPOINT = "https://www.wikidata.org/w/api.php"
const WIKIDATA_FALLBACK_THRESHOLD = 0.52

type WikidataSearchItem = {
  id: string
  label?: string
  description?: string
}

type WikidataSearchResponse = {
  search?: WikidataSearchItem[]
}

type WikidataCoordinateValue = {
  latitude?: number
  longitude?: number
}

type WikidataEntity = {
  labels?: { en?: { value?: string } }
  descriptions?: { en?: { value?: string } }
  claims?: {
    P625?: Array<{
      mainsnak?: {
        datavalue?: {
          value?: WikidataCoordinateValue
        }
      }
    }>
  }
}

type WikidataEntitiesResponse = {
  entities?: Record<string, WikidataEntity>
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1)
}

function getTokenOverlapScore(source: string, target: string) {
  const sourceTokens = tokenize(source)
  const targetTokens = tokenize(target)

  if (sourceTokens.length === 0 || targetTokens.length === 0) {
    return 0
  }

  const overlapCount = sourceTokens.filter((token) => targetTokens.includes(token)).length

  return overlapCount / sourceTokens.length
}

function buildQueryAttempts(query: string) {
  const attempts: string[] = []
  const trimmed = query.trim()

  if (!trimmed) {
    return attempts
  }

  attempts.push(trimmed)

  const normalized = normalizeText(trimmed)

  if (!normalized.includes("india")) {
    attempts.push(`${trimmed}, India`)
  }

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 3) {
    attempts.push(parts.slice(0, 3).join(", "))
    attempts.push(parts.slice(-3).join(", "))
  }

  return Array.from(new Set(attempts))
}

function shouldBiasIndia(query: string) {
  return /(india|gujarat|ahmedabad|mumbai|delhi|chennai|kolkata|hyderabad|pune|bengaluru|bangalore)/i.test(
    query,
  )
}

function scoreCandidate(query: string, hit: GeocodeHit) {
  const overlapScore = getTokenOverlapScore(query, hit.display_name)

  const normalizedQuery = normalizeText(query)
  const normalizedDisplay = normalizeText(hit.display_name)

  const phraseScore = normalizedDisplay.includes(normalizedQuery) ? 1 : 0

  const nameNormalized = hit.name ? normalizeText(hit.name) : ""
  const nameScore =
    nameNormalized && (normalizedQuery.includes(nameNormalized) || nameNormalized.includes(normalizedQuery))
      ? 1
      : 0

  const importance = hit.importance ?? 0

  return overlapScore * 0.6 + phraseScore * 0.2 + nameScore * 0.1 + importance * 0.1
}

function scoreWikidataCandidate(query: string, label: string, description?: string) {
  const primaryQuery = query.split(",")[0] ?? query
  const combined = [label, description].filter(Boolean).join(" ")

  const overlapScore = getTokenOverlapScore(query, combined)
  const nameScore = getTokenOverlapScore(primaryQuery, label)
  const phraseScore = normalizeText(combined).includes(normalizeText(primaryQuery)) ? 1 : 0

  return overlapScore * 0.45 + nameScore * 0.45 + phraseScore * 0.1
}

function buildWikidataAttempts(query: string) {
  const trimmed = query.trim()

  if (!trimmed) {
    return [] as string[]
  }

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

  const primaryPart = parts[0] ?? trimmed
  const sanitizedPrimary = primaryPart
    .replace(
      /\b(flat|apartment|apt|house|plot|sector|block|near|opp|opposite|behind|road|rd|street|st)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim()

  const attempts = [
    sanitizedPrimary,
    [sanitizedPrimary, parts[parts.length - 1]].filter(Boolean).join(", "),
    parts.slice(0, 2).join(", "),
    trimmed,
  ]

  return Array.from(new Set(attempts.filter((attempt) => attempt.length >= 3)))
}

function dedupeAndSortCandidates(candidates: GeocodeCandidate[]) {
  const deduped = Array.from(
    new Map(
      candidates.map((candidate) => [
        `${candidate.lat.toFixed(6)}:${candidate.lng.toFixed(6)}:${candidate.displayName.toLowerCase()}`,
        candidate,
      ]),
    ).values(),
  )

  deduped.sort((a, b) => b.relevance - a.relevance || b.importance - a.importance)

  return deduped
}

async function fetchCandidatesForQuery(query: string) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "8",
    dedupe: "1",
    addressdetails: "1",
  })

  if (shouldBiasIndia(query)) {
    params.set("countrycodes", "in")
  }

  const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
    headers: {
      "User-Agent": "food-ngo-platform/1.0",
      Referer: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      "Accept-Language": "en",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    return [] as GeocodeHit[]
  }

  return (await response.json()) as GeocodeHit[]
}

async function searchWikidataByTerm(term: string) {
  const params = new URLSearchParams({
    action: "wbsearchentities",
    format: "json",
    language: "en",
    limit: "8",
    type: "item",
    search: term,
  })

  const response = await fetch(`${WIKIDATA_ENDPOINT}?${params.toString()}`, {
    headers: {
      "User-Agent": "food-ngo-platform/1.0",
      Referer: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    return [] as WikidataSearchItem[]
  }

  const payload = (await response.json()) as WikidataSearchResponse

  return payload.search ?? []
}

async function fetchWikidataEntityCoordinates(ids: string[]) {
  if (ids.length === 0) {
    return new Map<
      string,
      {
        lat: number
        lng: number
        label: string
        description?: string
      }
    >()
  }

  const params = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: ids.join("|"),
    props: "claims|labels|descriptions",
    languages: "en",
  })

  const response = await fetch(`${WIKIDATA_ENDPOINT}?${params.toString()}`, {
    headers: {
      "User-Agent": "food-ngo-platform/1.0",
      Referer: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    return new Map<
      string,
      {
        lat: number
        lng: number
        label: string
        description?: string
      }
    >()
  }

  const payload = (await response.json()) as WikidataEntitiesResponse
  const coordinates = new Map<
    string,
    {
      lat: number
      lng: number
      label: string
      description?: string
    }
  >()

  for (const id of ids) {
    const entity = payload.entities?.[id]
    const coordinateClaim = entity?.claims?.P625?.[0]?.mainsnak?.datavalue?.value
    const lat = coordinateClaim?.latitude
    const lng = coordinateClaim?.longitude

    if (typeof lat !== "number" || typeof lng !== "number") {
      continue
    }

    const label = entity?.labels?.en?.value ?? id
    const description = entity?.descriptions?.en?.value

    coordinates.set(id, { lat, lng, label, description })
  }

  return coordinates
}

async function searchWikidataCandidates(query: string) {
  const attempts = buildWikidataAttempts(query)
  const seedRows: Array<{
    id: string
    sourceQuery: string
    label: string
    description?: string
    relevance: number
  }> = []
  const seenIds = new Set<string>()

  for (const attempt of attempts) {
    const hits = await searchWikidataByTerm(attempt)

    for (const hit of hits) {
      if (!hit.id || seenIds.has(hit.id)) {
        continue
      }

      seenIds.add(hit.id)
      const label = hit.label ?? hit.id
      const relevance = scoreWikidataCandidate(query, label, hit.description)

      seedRows.push({
        id: hit.id,
        sourceQuery: attempt,
        label,
        description: hit.description,
        relevance,
      })
    }

    if (seedRows.length >= 8) {
      break
    }
  }

  if (seedRows.length === 0) {
    return [] as GeocodeCandidate[]
  }

  const coordinates = await fetchWikidataEntityCoordinates(seedRows.map((row) => row.id))
  const candidates: GeocodeCandidate[] = []

  for (const row of seedRows) {
    const coordinatesById = coordinates.get(row.id)

    if (!coordinatesById) {
      continue
    }

    const label = coordinatesById.label || row.label
    const description = coordinatesById.description ?? row.description
    const displayName = description ? `${label}, ${description}` : label

    candidates.push({
      lat: coordinatesById.lat,
      lng: coordinatesById.lng,
      displayName,
      sourceQuery: `wikidata:${row.sourceQuery}`,
      relevance: row.relevance,
      importance: 0.55,
      category: "wikidata",
      kind: "landmark",
    })
  }

  candidates.sort((a, b) => b.relevance - a.relevance || b.importance - a.importance)

  return candidates.slice(0, 4)
}

export async function searchAddressCandidates(address: string) {
  const query = address.trim()

  if (!query) {
    return [] as GeocodeCandidate[]
  }

  const attempts = buildQueryAttempts(query)
  const collected: GeocodeCandidate[] = []

  for (const attempt of attempts) {
    const hits = await fetchCandidatesForQuery(attempt)

    for (const hit of hits) {
      const lat = Number(hit.lat)
      const lng = Number(hit.lon)

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        continue
      }

      const relevance = scoreCandidate(query, hit)

      collected.push({
        lat,
        lng,
        displayName: hit.display_name,
        sourceQuery: attempt,
        relevance,
        importance: hit.importance ?? 0,
        category: hit.class,
        kind: hit.type,
      })
    }

    if (collected.length >= 8) {
      break
    }
  }

  let ranked = dedupeAndSortCandidates(collected)

  if (ranked.length === 0 || ranked[0].relevance < WIKIDATA_FALLBACK_THRESHOLD) {
    const wikidataCandidates = await searchWikidataCandidates(query)
    ranked = dedupeAndSortCandidates([...ranked, ...wikidataCandidates])
  }

  return ranked.slice(0, 6)
}

export async function geocodeAddress(address: string) {
  const candidates = await searchAddressCandidates(address)

  if (candidates.length === 0) {
    return null
  }

  const [best] = candidates

  return {
    lat: best.lat,
    lng: best.lng,
    displayName: best.displayName,
    relevance: best.relevance,
  }
}
