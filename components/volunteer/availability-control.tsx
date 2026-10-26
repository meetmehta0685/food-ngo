"use client"

import { Crosshair, MapPin, ShieldCheck, SpinnerGap, WarningCircle } from "@phosphor-icons/react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { formatAppDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"

type AvailabilityProfile = { isAvailable: boolean; currentLat: number | null; currentLng: number | null; lastLocationAt: string | null }

export function AvailabilityControl({ initialProfile }: { initialProfile: AvailabilityProfile }) {
  const [profile, setProfile] = useState(initialProfile)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveAvailability = async (isAvailable: boolean, coordinates?: { lat: number; lng: number }) => {
    const response = await fetch("/api/volunteer/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable, ...coordinates }),
    })
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
      throw new Error(payload?.error?.message ?? "Availability update failed.")
    }
    const payload = (await response.json()) as { profile: AvailabilityProfile }
    setProfile(payload.profile)
  }

  const changeAvailability = async (nextAvailable: boolean) => {
    if (pending || nextAvailable === profile.isAvailable) return
    setPending(true)
    setError(null)
    try {
      if (!nextAvailable) {
        await saveAvailability(false)
      } else {
        if (!navigator.geolocation) throw new Error("Current location is not supported by this browser.")
        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }))
        await saveAvailability(true, { lat: position.coords.latitude, lng: position.coords.longitude })
      }
    } catch (caughtError) {
      const code = typeof caughtError === "object" && caughtError !== null && "code" in caughtError ? Number(caughtError.code) : null
      setError(code === 1 ? "Allow location access before going available." : code === 3 ? "Location request timed out. Try again." : caughtError instanceof Error ? caughtError.message : "Could not update availability.")
    } finally {
      setPending(false)
    }
  }

  const refreshLocation = async () => {
    if (!profile.isAvailable) return
    setPending(true)
    setError(null)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }))
      await saveAvailability(true, { lat: position.coords.latitude, lng: position.coords.longitude })
    } catch {
      setError("Could not refresh your location. Check permission and try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5"><CardTitle>Dispatch availability</CardTitle><CardDescription className="max-w-xl text-base leading-relaxed">Going online shares your live position with nearby dispatchers so rescue offers can be assigned quickly.</CardDescription></div>
        <div className="bg-muted/70 flex w-fit items-center gap-3 self-start rounded-full py-1.5 pl-1.5 pr-3">
          <Badge variant={profile.isAvailable ? "secondary" : "outline"} className="gap-1.5 tabular text-xs "><span className={cn("size-1.5 rounded-full", profile.isAvailable ? "bg-success" : "bg-muted-foreground")} />{pending ? "Updating" : profile.isAvailable ? "On standby" : "Off duty"}</Badge>
          <Switch checked={profile.isAvailable} disabled={pending} onCheckedChange={changeAvailability} aria-label="Volunteer availability" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-5">
        <div className="flex flex-wrap items-center gap-3 border-b pb-5">
          <MapPin className="text-primary size-5 shrink-0" weight="bold" />
          <div className="flex min-w-0 flex-1 flex-col gap-1"><p className="text-sm font-semibold">Current GPS dispatch pin</p><p className="text-primary tabular break-all text-base font-semibold">{profile.currentLat !== null && profile.currentLng !== null ? `${profile.currentLat.toFixed(5)}, ${profile.currentLng.toFixed(5)}` : "Location not transmitted yet"}</p></div>
          <Button type="button" variant="outline" size="sm" onClick={refreshLocation} disabled={pending || !profile.isAvailable}>{pending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <Crosshair data-icon="inline-start" />}Refresh pin</Button>
        </div>
        {profile.lastLocationAt ? <p className="text-muted-foreground text-right tabular text-sm">Last signal update: {formatAppDateTime(profile.lastLocationAt)}</p> : null}
        {error ? <Alert variant="destructive"><WarningCircle /><AlertTitle>Availability needs attention</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
        <p className="text-muted-foreground inline-flex items-center gap-2 text-sm"><ShieldCheck className="text-success" />Only active rescue operations use your live location.</p>
      </CardContent>
    </Card>
  )
}
