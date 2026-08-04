"use client"

import { useEffect, useState } from "react"
import { getSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  ArrowRight,
  Buildings,
  Envelope,
  HandHeart,
  Handshake,
  LockKey,
  ShieldCheck,
  Sparkle,
  SpinnerGap,
  Truck,
  WarningCircle,
} from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getRoleHomePath } from "@/lib/auth/roles"

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type FormValues = z.infer<typeof schema>

type SignInFormProps = {
  resetExistingSession?: boolean
}

const roleSignals = [
  { label: "Donor", icon: HandHeart },
  { label: "NGO partner", icon: Buildings },
  { label: "Volunteer", icon: Truck },
]

export function SignInForm({ resetExistingSession = false }: SignInFormProps) {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resettingSession, setResettingSession] = useState(resetExistingSession)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  useEffect(() => {
    if (!resetExistingSession) return

    let active = true
    const resetSession = async () => {
      try {
        await signOut({ redirect: false })
      } catch {
        if (active) setFormError("Your previous session could not be cleared. Try again.")
      } finally {
        if (active) {
          setResettingSession(false)
          router.refresh()
        }
      }
    }

    void resetSession()
    return () => {
      active = false
    }
  }, [resetExistingSession, router])

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    setLoading(true)

    const result = await signIn("credentials", {
      email: values.email.trim().toLowerCase(),
      password: values.password,
      redirect: false,
    })

    if (!result || result.error) {
      setLoading(false)
      setFormError(result?.error === "CredentialsSignin" ? "Invalid email or password." : "Sign in is unavailable right now. Try again in a moment.")
      return
    }

    const session = await getSession()
    const destination = getRoleHomePath(session?.user?.role)
    setLoading(false)

    if (!destination) {
      setFormError("Signed in, but no user role was found. Please try again.")
      return
    }

    router.replace(destination)
    router.refresh()
  })

  return (
    <Card className="w-full max-w-lg border-primary/15">
      <CardHeader className="gap-4 border-b pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Handshake weight="duotone" />
            </span>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>Access your role workspace and continue the rescue chain.</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1.5 font-mono text-[10px] uppercase">
            <Sparkle data-icon="inline-start" />
            Secure
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-6">
        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-surface p-2" aria-label="Available workspaces">
          {roleSignals.map((signal) => {
            const Icon = signal.icon
            return (
              <div key={signal.label} className="text-muted-foreground flex flex-col items-center gap-1 rounded-md px-2 py-2 text-center text-[10px] font-medium">
                <Icon className="text-primary" weight="duotone" />
                <span>{signal.label}</span>
              </div>
            )
          })}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.email) || undefined}>
              <FieldLabel htmlFor="email">
                <Envelope data-icon="inline-start" />
                Email address
              </FieldLabel>
              <Input id="email" type="email" placeholder="you@organization.org" aria-invalid={Boolean(form.formState.errors.email)} {...form.register("email")} />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.password) || undefined}>
              <FieldLabel htmlFor="password">
                <LockKey data-icon="inline-start" />
                Password
              </FieldLabel>
              <Input id="password" type="password" placeholder="Enter your password" aria-invalid={Boolean(form.formState.errors.password)} {...form.register("password")} />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
          </FieldGroup>

          {formError ? (
            <Alert variant="destructive">
              <WarningCircle />
              <AlertTitle>Sign in needs attention</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={loading || resettingSession} className="w-full">
            {loading || resettingSession ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <ArrowRight data-icon="inline-start" />}
            {resettingSession ? "Preparing workspace…" : loading ? "Checking credentials…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="text-muted-foreground flex w-full items-center gap-1.5 text-[0.625rem]">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="text-success" />Encrypted partner access</span>
        </div>
      </CardFooter>
    </Card>
  )
}
