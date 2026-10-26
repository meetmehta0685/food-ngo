"use client"

import { Key, ShieldCheck, SpinnerGap, Warning } from "@phosphor-icons/react"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatAppTime } from "@/lib/format-date"

export function PickupOtpCard({ assignmentId }: { assignmentId: string }) {
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateOtp = async () => {
    setPending(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/rescue-assignments/${assignmentId}/pickup-otp`,
        { method: "POST" },
      )
      const payload = (await response.json().catch(() => null)) as
        | {
            otp?: { code: string; expiresAt: string }
            error?: { message?: string }
          }
        | null

      if (!response.ok || !payload?.otp) {
        throw new Error(payload?.error?.message ?? "Could not generate pickup OTP")
      }

      setCode(payload.otp.code)
      setExpiresAt(payload.otp.expiresAt)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not generate pickup OTP",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="flex flex-col gap-5 border-t pt-6" aria-labelledby="pickup-pin-title">
      <div className="flex items-start gap-3">
        <Key className="text-primary mt-1 size-5 shrink-0" weight="bold" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 id="pickup-pin-title" className="text-xl">Pickup Verification PIN</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Generate this 6-digit PIN when the volunteer driver arrives. Share it with the driver after food is loaded.
          </p>
        </div>
        <Badge className="hidden shrink-0 sm:inline-flex" variant="outline">
          Secure handoff
        </Badge>
      </div>
      <div className="flex flex-col gap-4">
        {code ? (
          <div className="flex flex-col items-start gap-1 py-2">
            <p className="font-display tabular pl-[0.18em] text-5xl font-semibold tracking-[0.18em]">{code}</p>
            <p className="text-muted-foreground tabular text-sm">
              Valid until: {expiresAt ? formatAppTime(expiresAt) : "Soon"}
            </p>
          </div>
        ) : null}

        <Button type="button" variant={code ? "outline" : "default"} className="w-full" onClick={generateOtp} disabled={pending}>
          {pending ? (
            <SpinnerGap data-icon="inline-start" className="animate-spin" />
          ) : (
            <ShieldCheck data-icon="inline-start" weight="bold" />
          )}
          {pending
            ? "Generating security code..."
            : code
              ? "Regenerate verification PIN"
              : "Generate handover PIN"}
        </Button>

        {error ? (
          <Alert variant="destructive">
            <Warning weight="bold" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </section>
  )
}
