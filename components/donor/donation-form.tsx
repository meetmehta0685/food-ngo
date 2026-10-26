"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  ArrowRight,
  Clock,
  Crosshair,
  MapPin,
  Package,
  ShieldCheck,
  SpinnerGap,
  ForkKnife,
} from "@phosphor-icons/react"

import { MapPicker } from "@/components/maps/map-picker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const schema = z.object({
  foodType: z.string().trim().min(2, "Specify food type"),
  quantity: z.string().trim().min(1, "Quantity details required"),
  servesCount: z.number().int().positive(),
  estimatedWeightKg: z.number().positive().max(1000),
  address: z.string().trim().min(6, "Valid pickup address required"),
  pickupBy: z.string().min(1, "Select pickup deadline"),
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
  result?: { lat: number; lng: number; displayName: string }
  candidates?: GeocodeCandidate[]
  error?: { message?: string }
}

const foodPresets = [
  { label: "Prepared meals", type: "Cooked Meals (Hot/Cold)" },
  { label: "Packaged goods", type: "Packaged & Canned Goods" },
  { label: "Bakery and grains", type: "Bakery & Breads" },
  { label: "Produce and dairy", type: "Fresh Produce & Dairy" },
]

const deadlinePresets = [
  { label: "+2 hours · urgent", hours: 2 },
  { label: "+4 hours · standard", hours: 4 },
  { label: "+8 hours · evening", hours: 8 },
]

export function DonationForm() {
  const router = useRouter()
  const [lat, setLat] = useState(19.076)
  const [lng, setLng] = useState(72.8777)
  const [formError, setFormError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false)
  const [addressSuggestions, setAddressSuggestions] = useState<GeocodeCandidate[]>([])
  const [addressSuggestLoading, setAddressSuggestLoading] = useState(false)
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null)
  const [deadlinePreset, setDeadlinePreset] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      foodType: "",
      quantity: "",
      servesCount: 20,
      estimatedWeightKg: 5,
      address: "",
      pickupBy: "",
      notes: "",
    },
  })

  const addressValue = form.watch("address") ?? ""

  useEffect(() => {
    const query = addressValue.trim()
    if (query.length < 4 || (selectedLocationName && query.toLowerCase() === selectedLocationName.toLowerCase())) {
      setAddressSuggestLoading(false)
      setAddressSuggestions([])
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setAddressSuggestLoading(true)
      try {
        const response = await fetch(`/api/geocode?mode=suggest&q=${encodeURIComponent(query)}`, {
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
        if (!controller.signal.aborted) {
          console.error("address suggestion lookup error", error)
          setAddressSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted) setAddressSuggestLoading(false)
      }
    }, 450)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [addressValue, selectedLocationName])

  const geocodeAddress = async () => {
    const address = form.getValues("address")
    if (!address.trim()) {
      setFormError("Enter a pickup address before looking up coordinates.")
      return
    }

    setFormError(null)
    setGeoLoading(true)
    setSelectedLocationName(null)

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`, { cache: "no-store" })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
        setFormError(payload?.error?.message ?? "Address lookup failed.")
        return
      }

      const payload = (await response.json()) as GeocodeResponse
      if (!payload.result) {
        setFormError("No coordinates were found for that address.")
        return
      }

      setLat(payload.result.lat)
      setLng(payload.result.lng)
      setSelectedLocationName(payload.result.displayName)
      setAddressSuggestions(payload.candidates?.slice(0, 5) ?? [])
    } catch (error) {
      console.error("geocode donation address error", error)
      setFormError("Address lookup failed. Try again or move the pin manually.")
    } finally {
      setGeoLoading(false)
    }
  }

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setFormError("Current location is not supported by this browser.")
      return
    }

    setFormError(null)
    setCurrentLocationLoading(true)
    setAddressSuggestions([])

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000,
        })
      })

      const nextLat = position.coords.latitude
      const nextLng = position.coords.longitude
      setLat(nextLat)
      setLng(nextLng)

      const response = await fetch(`/api/geocode?mode=reverse&lat=${encodeURIComponent(nextLat)}&lng=${encodeURIComponent(nextLng)}`, { cache: "no-store" })
      const payload = (await response.json().catch(() => null)) as GeocodeResponse | null
      const displayName = payload?.result?.displayName ?? `Current location (${nextLat.toFixed(5)}, ${nextLng.toFixed(5)})`
      form.setValue("address", displayName, { shouldDirty: true, shouldValidate: true })
      setSelectedLocationName(displayName)
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? Number(error.code) : null
      setFormError(code === 1 ? "Location access was denied. Allow access and try again." : code === 3 ? "Location lookup timed out. Try again or choose a pin manually." : "Could not get your current location. Try searching or moving the pin manually.")
    } finally {
      setCurrentLocationLoading(false)
    }
  }

  const selectCandidateLocation = (candidate: GeocodeCandidate) => {
    setLat(candidate.lat)
    setLng(candidate.lng)
    setSelectedLocationName(candidate.displayName)
  }

  const selectAddressSuggestion = (candidate: GeocodeCandidate) => {
    form.setValue("address", candidate.displayName, { shouldDirty: true, shouldValidate: true })
    selectCandidateLocation(candidate)
    setAddressSuggestions([])
  }

  const setHoursFromNow = (hours: number) => {
    const date = new Date(Date.now() + hours * 60 * 60 * 1000)
    form.setValue("pickupBy", date.toISOString().slice(0, 16), { shouldValidate: true, shouldDirty: true })
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    const response = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, servesCount: Number(values.servesCount), estimatedWeightKg: Number(values.estimatedWeightKg), lat, lng }),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
      setFormError(payload?.error?.message ?? "Failed to create donation.")
      return
    }

    const payload = (await response.json()) as { donationId: string }
    router.push(`/track/${payload.donationId}`)
    router.refresh()
  })

  const currentFoodType = form.watch("foodType")
  const errors = form.formState.errors

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:gap-8">
      <Card className="gap-0 py-0">
        <CardHeader className="bg-muted/50 border-b px-5 py-5 sm:px-8">
          <CardDescription className="text-foreground/80 max-w-xl text-base leading-relaxed">Provide the portions, safe window, and pickup pin. Nearby verified NGOs are alerted automatically.</CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-7 sm:px-8">
          <form onSubmit={onSubmit} className="flex flex-col gap-9" noValidate>
            <FieldSet>
              <FieldLegend variant="legend" className="font-display text-2xl! font-semibold">Start with the food</FieldLegend>
              <FieldGroup>
                <Field data-invalid={Boolean(errors.foodType) || undefined}>
                  <FieldLabel>Food category</FieldLabel>
                  <ToggleGroup
                    value={currentFoodType ? [currentFoodType] : []}
                    onValueChange={(value) => {
                      if (value[0]) form.setValue("foodType", value[0], { shouldValidate: true, shouldDirty: true })
                    }}
                    aria-label="Food category"
                    className="grid w-full grid-cols-2"
                    variant="outline"
                    spacing={0}
                  >
                    {foodPresets.map((item) => (
                      <ToggleGroupItem key={item.type} value={item.type} className="h-auto justify-start gap-2 px-3 py-3.5 text-left text-sm font-medium">
                        <ForkKnife data-icon="inline-start" />
                        <span>{item.label}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FieldError errors={[errors.foodType]} />
                </Field>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(errors.foodType) || undefined}>
                    <FieldLabel htmlFor="foodType">Food description</FieldLabel>
                    <Input id="foodType" placeholder="e.g. paneer, rice, dal, salads" aria-invalid={Boolean(errors.foodType)} {...form.register("foodType")} />
                    <FieldError errors={[errors.foodType]} />
                  </Field>
                  <Field data-invalid={Boolean(errors.quantity) || undefined}>
                    <FieldLabel htmlFor="quantity">Quantity and packaging</FieldLabel>
                    <Input id="quantity" placeholder="e.g. 5 thermal containers" aria-invalid={Boolean(errors.quantity)} {...form.register("quantity")} />
                    <FieldError errors={[errors.quantity]} />
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </FieldSet>

            <FieldSet className="border-t pt-8">
              <FieldLegend variant="legend" className="font-display text-2xl! font-semibold">Set the safe window</FieldLegend>
              <FieldGroup>
                <FieldGroup className="grid gap-4 sm:grid-cols-3">
                  <Field data-invalid={Boolean(errors.servesCount) || undefined}>
                    <FieldLabel htmlFor="servesCount">Portions</FieldLabel>
                    <Input id="servesCount" type="number" min={1} aria-invalid={Boolean(errors.servesCount)} {...form.register("servesCount", { valueAsNumber: true })} />
                    <FieldError errors={[errors.servesCount]} />
                  </Field>
                  <Field data-invalid={Boolean(errors.estimatedWeightKg) || undefined}>
                    <FieldLabel htmlFor="estimatedWeightKg">Weight (kg)</FieldLabel>
                    <Input id="estimatedWeightKg" type="number" min={0.1} max={1000} step={0.1} aria-invalid={Boolean(errors.estimatedWeightKg)} {...form.register("estimatedWeightKg", { valueAsNumber: true })} />
                    <FieldError errors={[errors.estimatedWeightKg]} />
                  </Field>
                  <Field data-invalid={Boolean(errors.pickupBy) || undefined}>
                    <FieldLabel htmlFor="pickupBy">Latest pickup</FieldLabel>
                    <Input id="pickupBy" type="datetime-local" aria-invalid={Boolean(errors.pickupBy)} {...form.register("pickupBy")} />
                    <FieldError errors={[errors.pickupBy]} />
                  </Field>
                </FieldGroup>
                <Field>
                  <div className="flex items-center justify-between gap-4">
                    <FieldLabel>Deadline shortcut</FieldLabel>
                    <span className="text-muted-foreground text-sm">Set from now</span>
                  </div>
                  <ToggleGroup
                    value={deadlinePreset ? [deadlinePreset] : []}
                    onValueChange={(value) => {
                      const selected = deadlinePresets.find((preset) => String(preset.hours) === value[0])
                      if (!selected) return
                      setDeadlinePreset(String(selected.hours))
                      setHoursFromNow(selected.hours)
                    }}
                    aria-label="Pickup deadline shortcut"
                    className="flex flex-wrap"
                    variant="outline"
                  >
                    {deadlinePresets.map((preset) => (
                      <ToggleGroupItem key={preset.hours} value={String(preset.hours)} className="h-10 text-sm">
                        <Clock data-icon="inline-start" />
                        {preset.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSet className="border-t pt-8">
              <FieldLegend variant="legend" className="font-display text-2xl! font-semibold">Place the pickup</FieldLegend>
              <FieldGroup>
                <Field data-invalid={Boolean(errors.address) || undefined}>
                  <FieldLabel htmlFor="address"><MapPin data-icon="inline-start" />Street address and instructions</FieldLabel>
                  <Textarea id="address" rows={3} placeholder="Building name, kitchen entrance, floor…" aria-invalid={Boolean(errors.address)} {...form.register("address")} />
                  <FieldError errors={[errors.address]} />
                </Field>
                {addressSuggestLoading ? <FieldDescription>Searching nearby address matches…</FieldDescription> : null}
                {addressSuggestions.length > 0 ? (
                  <div className="flex flex-col gap-1" aria-label="Address suggestions">
                    {addressSuggestions.map((candidate) => (
                      <Button key={`${candidate.lat}:${candidate.lng}:${candidate.displayName}`} type="button" variant="ghost" className="h-auto justify-start whitespace-normal px-3 py-2.5 text-left text-sm font-normal" onClick={() => selectAddressSuggestion(candidate)}>
                        <MapPin data-icon="inline-start" />
                        <span>{candidate.displayName}</span>
                      </Button>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={geocodeAddress} disabled={geoLoading}>
                    {geoLoading ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <MapPin data-icon="inline-start" />}
                    {geoLoading ? "Looking up…" : "Look up coordinates"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} disabled={currentLocationLoading}>
                    {currentLocationLoading ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <Crosshair data-icon="inline-start" />}
                    {currentLocationLoading ? "Detecting…" : "Use current GPS"}
                  </Button>
                  <Badge variant="outline" className="tabular ml-auto">{lat.toFixed(4)}, {lng.toFixed(4)}</Badge>
                </div>
                {selectedLocationName ? (
                  <Alert>
                    <ShieldCheck />
                    <AlertTitle>Pickup pin ready</AlertTitle>
                    <AlertDescription>{selectedLocationName}</AlertDescription>
                  </Alert>
                ) : null}
              </FieldGroup>
            </FieldSet>

            <Field>
              <FieldLabel htmlFor="notes">Storage and handling notes <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
              <Textarea id="notes" rows={3} placeholder="Dietary information, refrigeration, loading access…" {...form.register("notes")} />
            </Field>

            {formError ? (
              <Alert variant="destructive">
                <Package />
                <AlertTitle>Request could not be created</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <ArrowRight data-icon="inline-start" />}
              {form.formState.isSubmitting ? "Broadcasting rescue offer…" : "Broadcast rescue offer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader className="gap-2">
          <CardTitle>Verify the pickup pin</CardTitle>
          <CardDescription>Drag the map pin to the exact location a volunteer should use.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-lg border">
            <MapPicker lat={lat} lng={lng} onChange={(nextLat, nextLng) => { setLat(nextLat); setLng(nextLng) }} />
          </div>
          <Separator />
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-semibold">Location context</p>
            <p className="text-muted-foreground leading-6">The assigned NGO and volunteer use this coordinate to navigate the final handoff.</p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <span className="text-muted-foreground inline-flex items-center gap-2 text-sm"><ShieldCheck className="text-success" weight="bold" />Pin visible to assigned partners</span>
        </CardFooter>
      </Card>
    </div>
  )
}
