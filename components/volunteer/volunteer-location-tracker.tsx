"use client"

import type { RescueAssignmentStatus } from "@prisma/client"
import { Crosshair, MapPin, Warning } from "@phosphor-icons/react"
import { Realtime } from "ably"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { isExpectedAblyClosure } from "@/lib/realtime/errors"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

type TrackingState = "starting" | "tracking" | "low-accuracy" | "error"

export function VolunteerLocationTracker({
  assignmentId,
  assignmentStatus,
}: {
  assignmentId: string
  assignmentStatus: RescueAssignmentStatus
}) {
  const router = useRouter()
  const lastSentAtRef = useRef(0)
  const requestInFlightRef = useRef(false)
  const [trackingState, setTrackingState] =
    useState<TrackingState>("starting")
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const realtime = new Realtime({
      authUrl: "/api/realtime/token",
      authMethod: "POST",
      echoMessages: false,
      logLevel: 0,
    })
    const channel = realtime.channels.get(`rescue:${assignmentId}`)

    // presence.enter() on an unattached channel starts an attach that ably-js
    // never handles, so closing mid-attach throws an uncaught "Connection closed".
    void channel
      .attach()
      .then(() =>
        active
          ? channel.presence.enter({
              role: "VOLUNTEER",
              assignmentId,
              rescueStatus: assignmentStatus,
            })
          : undefined,
      )
      .catch((presenceError) => {
        if (active && !isExpectedAblyClosure(presenceError)) {
          console.error("Volunteer presence connection failed", presenceError)
        }
      })

    return () => {
      active = false
      realtime.close()
    }
  }, [assignmentId, assignmentStatus])

  useEffect(() => {
    if (!navigator.geolocation) {
      setTrackingState("error")
      setError("Location tracking is not supported by this browser.")
      return
    }

    let active = true

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        if (!active) {
          return
        }

        setAccuracy(position.coords.accuracy)
        setTrackingState(
          position.coords.accuracy <= 50 ? "tracking" : "low-accuracy",
        )
        setError(null)

        const now = Date.now()
        if (
          requestInFlightRef.current ||
          now - lastSentAtRef.current < 5_000
        ) {
          return
        }

        requestInFlightRef.current = true
        lastSentAtRef.current = now

        try {
          const response = await fetch("/api/volunteer/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assignmentId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed:
                position.coords.speed === null
                  ? undefined
                  : position.coords.speed,
              heading:
                position.coords.heading === null
                  ? undefined
                  : position.coords.heading,
              clientTimestamp: new Date(position.timestamp).toISOString(),
            }),
          })
          const payload = (await response.json().catch(() => null)) as
            | {
                location?: {
                  status?: RescueAssignmentStatus
                  arrived?: boolean
                }
                error?: { message?: string }
              }
            | null

          if (!response.ok) {
            throw new Error(
              payload?.error?.message ?? "Location update failed",
            )
          }

          if (
            payload?.location?.arrived ||
            (payload?.location?.status &&
              payload.location.status !== assignmentStatus)
          ) {
            router.refresh()
          }
        } catch (caughtError) {
          if (active) {
            setTrackingState("error")
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "Location update failed",
            )
          }
        } finally {
          requestInFlightRef.current = false
        }
      },
      (locationError) => {
        if (!active) {
          return
        }

        setTrackingState("error")
        setError(
          locationError.code === locationError.PERMISSION_DENIED
            ? "Allow location access to continue this rescue."
            : "Could not read your location. Keep this page open and try again.",
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 3_000,
      },
    )

    return () => {
      active = false
      navigator.geolocation.clearWatch(watchId)
    }
  }, [assignmentId, assignmentStatus, router])

  const stateLabel = trackingState === "starting" ? "Starting" : trackingState === "tracking" ? "Live" : trackingState === "low-accuracy" ? "Low accuracy" : "Needs attention"

  return (
    <div className="mt-1 border-t pt-5">
      <div className="flex items-start gap-3">
        <span className="text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center">
          {trackingState === "error" ? (
            <Warning className="h-4 w-4" />
          ) : trackingState === "starting" ? (
            <Crosshair className="h-4 w-4 animate-pulse" />
          ) : (
            <MapPin weight="duotone" className="h-4 w-4" />
          )}
        </span>
        <div>
          <div className="flex items-center gap-2"><p className="text-sm font-semibold">{trackingState === "starting" ? "Starting live location…" : trackingState === "tracking" ? "Live location active" : trackingState === "low-accuracy" ? "Waiting for better GPS accuracy" : "Location tracking needs attention"}</p><Badge variant={trackingState === "error" ? "destructive" : trackingState === "tracking" ? "secondary" : "outline"}>{stateLabel}</Badge></div>
          <p className="mt-1 text-sm text-muted-foreground">
            {accuracy === null
              ? "Keep this page open during the rescue."
              : `Current accuracy: ±${Math.round(accuracy)} m · arrival requires 50 m or better.`}
          </p>
        </div>
      </div>

      {error ? <Alert variant="destructive" className="mt-3"><Warning /><AlertTitle>Location update failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  )
}
