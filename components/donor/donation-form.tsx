"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { MapPin } from "@phosphor-icons/react"

import { MapPicker } from "@/components/maps/map-picker"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const schema = z.object({
  foodType: z.string().trim().min(2),
  quantity: z.string().trim().min(1),
  servesCount: z.number().int().positive(),
  address: z.string().trim().min(6),
  pickupBy: z.string().min(1),
  notes: z.string().max(600).optional(),
})

type FormValues = z.infer<typeof schema>

type GeocodeCandidate = {
  lat: number
  lng: number
  displayName: string
  relevance: number
}

type GeocodeResponse = {
  result?: {
    lat: number
    lng: number
    displayName: string
  }
  candidates?: GeocodeCandidate[]
  error?: {
    message?: string
  }
}

export function DonationForm() {
  const router = useRouter()
  const [lat, setLat] = useState(40.7128)
  const [lng, setLng] = useState(-74.006)
  const [formError, setFormError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoCandidates, setGeoCandidates] = useState<GeocodeCandidate[]>([])
  const [addressSuggestions, setAddressSuggestions] = useState<GeocodeCandidate[]>([])
  const [addressSuggestLoading, setAddressSuggestLoading] = useState(false)
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      foodType: "",
      quantity: "",
      servesCount: 20,
      address: "",
      pickupBy: "",
      notes: "",
    },
  })

  const addressValue = form.watch("address") ?? ""

  useEffect(() => {
    const query = addressValue.trim()

    if (query.length < 4) {
      setAddressSuggestLoading(false)
      setAddressSuggestions([])
      return
    }

    if (selectedLocationName && query.toLowerCase() === selectedLocationName.toLowerCase()) {
      setAddressSuggestLoading(false)
      setAddressSuggestions([])
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setAddressSuggestLoading(true)

      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          setAddressSuggestions([])
          return
        }

        const payload = (await response.json()) as GeocodeResponse
        setAddressSuggestions((payload.candidates ?? []).slice(0, 5))
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        console.error("address suggestion lookup error", error)
        setAddressSuggestions([])
      } finally {
        if (!controller.signal.aborted) {
          setAddressSuggestLoading(false)
        }
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [addressValue, selectedLocationName])

  const geocodeAddress = async () => {
    const address = form.getValues("address")

    if (!address.trim()) {
      setFormError("Enter pickup address before geocoding")
      return
    }

    setFormError(null)
    setGeoLoading(true)
    setGeoCandidates([])
    setSelectedLocationName(null)

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null

        setFormError(payload?.error?.message ?? "Address lookup failed")
        return
      }

      const payload = (await response.json()) as GeocodeResponse

      if (!payload.result) {
        setFormError("Address lookup failed")
        return
      }

      setLat(payload.result.lat)
      setLng(payload.result.lng)
      setSelectedLocationName(payload.result.displayName)
      setGeoCandidates(payload.candidates ?? [])
      setAddressSuggestions(payload.candidates?.slice(0, 5) ?? [])
    } catch (error) {
      console.error("geocode donation address error", error)
      setFormError("Address lookup failed")
    } finally {
      setGeoLoading(false)
    }
  }

  const selectCandidateLocation = (candidate: GeocodeCandidate) => {
    setLat(candidate.lat)
    setLng(candidate.lng)
    setSelectedLocationName(candidate.displayName)
  }

  const selectAddressSuggestion = (candidate: GeocodeCandidate) => {
    form.setValue("address", candidate.displayName, {
      shouldDirty: true,
      shouldValidate: true,
    })
    selectCandidateLocation(candidate)
    setAddressSuggestions([])
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)

    const response = await fetch("/api/donations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...values,
        servesCount: Number(values.servesCount),
        lat,
        lng,
      }),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null

      setFormError(payload?.error?.message ?? "Failed to create donation")
      return
    }

    const payload = (await response.json()) as { donationId: string }
    router.push(`/track/${payload.donationId}`)
    router.refresh()
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-xl border border-border/60 bg-card/90 p-6 sm:p-8">
        <h2 className="font-serif text-xl mb-1">Food details</h2>
        <p className="text-muted-foreground text-sm mb-6">Share pickup details. Nearby NGOs will be notified instantly.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="foodType">Food type</Label>
              <Input id="foodType" placeholder="Cooked meals, packed food..." {...form.register("foodType")} />
              <FieldError errors={[form.formState.errors.foodType]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" placeholder="8 trays" {...form.register("quantity")} />
              <FieldError errors={[form.formState.errors.quantity]} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="servesCount">Serves count</Label>
              <Input
                id="servesCount"
                type="number"
                min={1}
                {...form.register("servesCount", { valueAsNumber: true })}
              />
              <FieldError errors={[form.formState.errors.servesCount]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupBy">Pickup by</Label>
              <Input id="pickupBy" type="datetime-local" {...form.register("pickupBy")} />
              <FieldError errors={[form.formState.errors.pickupBy]} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Pickup address</Label>
            <Textarea id="address" rows={3} {...form.register("address")} />
            <FieldError errors={[form.formState.errors.address]} />
          </div>

          {addressSuggestLoading ? (
            <p className="text-muted-foreground text-xs">Searching address suggestions...</p>
          ) : null}

          {addressSuggestions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Address suggestions</p>
              <div className="space-y-1.5">
                {addressSuggestions.map((candidate) => (
                  <button
                    key={`${candidate.lat}:${candidate.lng}:${candidate.displayName}`}
                    type="button"
                    className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                    onClick={() => selectAddressSuggestion(candidate)}
                  >
                    <p className="line-clamp-2 text-xs">{candidate.displayName}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={geocodeAddress} disabled={geoLoading}>
              <MapPin className="mr-1.5 h-3.5 w-3.5" />
              {geoLoading ? "Locating..." : "Locate on map"}
            </Button>
            <p className="text-muted-foreground font-mono text-[11px]">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>

          {selectedLocationName ? (
            <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
              <p className="text-xs font-semibold text-primary">Selected location</p>
              <p className="text-muted-foreground mt-1 text-xs">{selectedLocationName}</p>
            </div>
          ) : null}

          {geoCandidates.length > 1 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Closest address matches</p>
              <div className="space-y-1.5">
                {geoCandidates.slice(0, 4).map((candidate) => (
                  <div
                    key={`${candidate.lat}:${candidate.lng}:${candidate.displayName}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs">{candidate.displayName}</p>
                      <p className="text-muted-foreground mt-1 font-mono text-[10px]">
                        {(candidate.relevance * 100).toFixed(0)}% match
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => selectCandidateLocation(candidate)}
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} placeholder="Packaging, allergies, timing details" {...form.register("notes")} />
          </div>

          {formError ? <FieldError>{formError}</FieldError> : null}

          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto h-11">
            {form.formState.isSubmitting ? "Submitting..." : "Notify NGOs"}
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/90 p-6 sm:p-8">
        <h2 className="font-serif text-xl mb-1">Pickup pin</h2>
        <p className="text-muted-foreground text-sm mb-4">Drag the marker to match the exact pickup point.</p>
        <MapPicker
          lat={lat}
          lng={lng}
          onChange={(nextLat, nextLng) => {
            setLat(nextLat)
            setLng(nextLng)
          }}
        />
      </div>
    </div>
  )
}
