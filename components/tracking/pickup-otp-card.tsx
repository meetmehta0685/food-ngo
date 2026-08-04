"use client"

import { Key, ShieldCheck, SpinnerGap, Warning } from "@phosphor-icons/react"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
            <Key data-icon="inline-start" weight="bold" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <CardTitle>Pickup Verification PIN</CardTitle>
            <CardDescription>
              Generate this 6-digit PIN when the volunteer driver arrives. Share it with the driver after food is loaded.
            </CardDescription>
          </div>
          <Badge className="hidden shrink-0 sm:inline-flex" variant="secondary">
            Secure handoff
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {code ? (
          <div className="border-primary/30 bg-background flex flex-col gap-1 rounded-md border px-4 py-4 text-center">
            <p className="text-primary pl-3 font-mono text-3xl font-bold tracking-[0.4em]">{code}</p>
            <p className="text-muted-foreground font-mono text-[11px]">
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
      </CardContent>
    </Card>
  )
}
