"use client"

import { Key, ShieldCheck, SpinnerGap, WarningCircle } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

export function PickupOtpVerification({ assignmentId }: { assignmentId: string }) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit OTP from the donor.")
      return
    }

    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/rescue-assignments/${assignmentId}/verify-pickup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
      if (!response.ok) throw new Error(payload?.error?.message ?? "OTP verification failed.")
      setCode("")
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "OTP verification failed.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-1 flex flex-col gap-4 border-t pt-5">
      <div className="flex items-start gap-3">
        <Key className="text-primary mt-0.5 size-5 shrink-0" weight="bold" />
        <div className="flex flex-col gap-1"><p className="font-display text-xl font-semibold">Confirm pickup handover</p><p className="text-muted-foreground text-sm leading-relaxed">Ask the donor for the six-digit code to confirm the food quality and quantity at collection.</p></div>
      </div>
      <Field>
        <FieldLabel htmlFor={`pickup-otp-${assignmentId}`}>Six-digit handover code</FieldLabel>
        <InputGroup>
          <InputGroupInput id={`pickup-otp-${assignmentId}`} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="tabular text-base" aria-invalid={Boolean(error)} />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="button" onClick={verify} disabled={pending || code.length !== 6} variant="default" size="sm">
              {pending ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <ShieldCheck data-icon="inline-start" />}
              {pending ? "Verifying…" : "Verify"}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>Only the donor can provide this code.</FieldDescription>
      </Field>
      {error ? <Alert variant="destructive"><WarningCircle /><AlertTitle>Code not accepted</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
    </div>
  )
}
