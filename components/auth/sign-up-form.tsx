"use client"

import { useState } from "react"
import { getSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Leaf } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type Role = "DONOR" | "NGO"

type FormState = {
  name: string
  email: string
  password: string
  ngoProfile: {
    orgName: string
    phone: string
    address: string
    lat: string
    lng: string
    serviceRadiusKm: string
  }
}

export function SignUpForm() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("DONOR")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [state, setState] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    ngoProfile: {
      orgName: "",
      phone: "",
      address: "",
      lat: "40.7128",
      lng: "-74.006",
      serviceRadiusKm: "15",
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

  const updateField = (field: keyof FormState, value: string) => {
    setState((prev) => ({ ...prev, [field]: value }))
  }

  const updateNgoField = (field: keyof FormState["ngoProfile"], value: string) => {
    setState((prev) => ({
      ...prev,
      ngoProfile: {
        ...prev.ngoProfile,
        [field]: value,
      },
    }))
  }

  const geocodeNgoAddress = async () => {
    setError(null)

    if (!state.ngoProfile.address.trim()) {
      setError("Add NGO address before looking up coordinates")
      return
    }

    const response = await fetch(
      `/api/geocode?q=${encodeURIComponent(state.ngoProfile.address)}`,
      {
        cache: "no-store",
      },
    )

    if (!response.ok) {
      setError("Could not resolve NGO address")
      return
    }

    const payload = (await response.json()) as {
      result: {
        lat: number
        lng: number
      }
    }

    updateNgoField("lat", payload.result.lat.toString())
    updateNgoField("lng", payload.result.lng.toString())
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const payload: Record<string, unknown> = {
      name: state.name,
      email: state.email.trim().toLowerCase(),
      password: state.password,
      role,
    }

    if (role === "NGO") {
      payload.ngoProfile = {
        orgName: state.ngoProfile.orgName,
        phone: state.ngoProfile.phone,
        address: state.ngoProfile.address,
        lat: Number(state.ngoProfile.lat),
        lng: Number(state.ngoProfile.lng),
        serviceRadiusKm: Number(state.ngoProfile.serviceRadiusKm),
      }
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null

      setLoading(false)
      setError(errorPayload?.error?.message ?? "Failed to create account")
      return
    }

    const login = await signIn("credentials", {
      email: state.email,
      password: state.password,
      redirect: false,
    })

    setLoading(false)

    if (!login || login.error) {
      setError("Account created, but automatic sign-in failed. Please sign in manually.")
      router.push("/sign-in")
      return
    }

    const destination = await resolvePostLoginPath()

    if (!destination) {
      setError("Account created and signed in, but role routing failed. Please sign in again.")
      router.push("/sign-in")
      return
    }

    router.replace(destination)
    router.refresh()
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-xl border border-border/60 bg-card/90 shadow-xl shadow-primary/3 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf weight="fill" className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg">Food Rescue</span>
        </div>

        <h1 className="font-serif text-2xl mb-1">Create your account</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Register as a donor or NGO to start coordinated food rescue.
        </p>

        <form onSubmit={submit} className="space-y-5">
          <Tabs value={role} onValueChange={(next) => setRole(next as Role)}>
            <TabsList>
              <TabsTrigger value="DONOR">Donor</TabsTrigger>
              <TabsTrigger value="NGO">NGO</TabsTrigger>
            </TabsList>
            <TabsContent value="DONOR" />
            <TabsContent value="NGO" />
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={state.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={state.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={state.password}
              onChange={(event) => updateField("password", event.target.value)}
              minLength={8}
              required
            />
          </div>

          {role === "NGO" ? (
            <div className="space-y-4 rounded-lg border border-primary/15 bg-primary/3 p-4">
              <h3 className="font-serif text-base">NGO profile</h3>

              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  value={state.ngoProfile.orgName}
                  onChange={(event) => updateNgoField("orgName", event.target.value)}
                  required={role === "NGO"}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={state.ngoProfile.phone}
                    onChange={(event) => updateNgoField("phone", event.target.value)}
                    required={role === "NGO"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radius">Service radius (km)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min={1}
                    max={100}
                    value={state.ngoProfile.serviceRadiusKm}
                    onChange={(event) => updateNgoField("serviceRadiusKm", event.target.value)}
                    required={role === "NGO"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={state.ngoProfile.address}
                  onChange={(event) => updateNgoField("address", event.target.value)}
                  required={role === "NGO"}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={geocodeNgoAddress}>
                  Lookup coordinates
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="0.000001"
                    value={state.ngoProfile.lat}
                    onChange={(event) => updateNgoField("lat", event.target.value)}
                    required={role === "NGO"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="0.000001"
                    value={state.ngoProfile.lng}
                    onChange={(event) => updateNgoField("lng", event.target.value)}
                    required={role === "NGO"}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {error ? <FieldError>{error}</FieldError> : null}

          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  )
}
