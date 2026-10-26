"use client"

import { useEffect, useState } from "react"
import { getSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  ArrowRight,
  Envelope,
  LockKey,
  ShieldCheck,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react"

import { KolamRoute } from "@/components/kolam/kolam-route"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  { key: "donor", label: "Donor" },
  { key: "ngo", label: "NGO partner" },
  { key: "volunteer", label: "Volunteer" },
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
    <Card className="w-full max-w-md gap-0 py-0 shadow-[0_24px_48px_-28px_color-mix(in_oklch,var(--foreground)_35%,transparent)]">
      <CardHeader className="gap-2 px-6 pb-2 pt-8 sm:px-8">
        <CardTitle className="text-4xl">Welcome back</CardTitle>
        <CardDescription className="text-base">Access your role workspace and continue the rescue chain.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-7 px-6 pb-8 pt-4 sm:px-8">
        <KolamRoute
          stages={roleSignals}
          current={2}
          complete
          orientation="horizontal"
          size="compact"
          label="Available workspaces"
          className="text-muted-foreground"
        />

        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
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

          <Button type="submit" size="lg" disabled={loading || resettingSession} className="w-full">
            {loading || resettingSession ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <ArrowRight data-icon="inline-start" />}
            {resettingSession ? "Preparing workspace…" : loading ? "Checking credentials…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="bg-muted/60 border-t px-6 py-4 sm:px-8">
        <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
          <ShieldCheck className="text-success" weight="bold" />
          Encrypted partner access
        </span>
      </CardFooter>
    </Card>
  )
}
