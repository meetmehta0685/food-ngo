"use client"

import { useState } from "react"
import { getSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Leaf } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type FormValues = z.infer<typeof schema>

export function SignInForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const resolvePostLoginPath = async () => {
    const session = await getSession()

    if (session?.user?.role === "NGO") {
      return "/ngo/inbox"
    }

    if (session?.user?.role === "DONOR") {
      return "/donor/requests"
    }

    return null
  }

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
      setFormError(
        result?.error === "CredentialsSignin"
          ? "Invalid credentials"
          : "Sign in is unavailable right now. Check database connectivity and try again.",
      )
      return
    }

    const destination = await resolvePostLoginPath()
    setLoading(false)

    if (!destination) {
      setFormError("Signed in, but no user role was found in the session. Please try again.")
      return
    }

    router.replace(destination)
    router.refresh()
  })

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-xl border border-border/60 bg-card/90 shadow-xl shadow-primary/3 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf weight="fill" className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg">Food Rescue</span>
        </div>

        <h1 className="font-serif text-2xl mb-1">Welcome back</h1>
        <p className="text-muted-foreground text-sm mb-6">Sign in to your donor or NGO dashboard.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} />
            <FieldError errors={[form.formState.errors.email]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" {...form.register("password")} />
            <FieldError errors={[form.formState.errors.password]} />
          </div>

          {formError ? <FieldError>{formError}</FieldError> : null}

          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  )
}
