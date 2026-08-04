"use client"

import { useState } from "react"
import { getSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Buildings,
  HandHeart,
  Handshake,
  MapPin,
  NavigationArrow,
  Phone,
  ShieldCheck,
  Sparkle,
  SpinnerGap,
  Truck,
  User,
  WarningCircle,
} from "@phosphor-icons/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { getRoleHomePath, type AppRole } from "@/lib/auth/roles"

type VehicleType = "BICYCLE" | "MOTORCYCLE" | "CAR" | "VAN" | "OTHER"

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
  volunteerProfile: {
    phone: string
    vehicleType: VehicleType
    capacityKg: string
    serviceRadiusKm: string
  }
}

const vehicleItems = [
  { value: "BICYCLE", label: "Bicycle · ultra-local trips" },
  { value: "MOTORCYCLE", label: "Motorcycle / scooter · quick rescue" },
  { value: "CAR", label: "Car / SUV · medium batch" },
  { value: "VAN", label: "Van / mini truck · bulk rescue" },
  { value: "OTHER", label: "Other transport" },
]

const roleOptions: { role: AppRole; label: string; description: string; icon: typeof HandHeart }[] = [
  { role: "DONOR", label: "Donor", description: "Broadcast surplus", icon: HandHeart },
  { role: "NGO", label: "NGO partner", description: "Match nearby food", icon: Buildings },
  { role: "VOLUNTEER", label: "Volunteer", description: "Move the handoff", icon: Truck },
]

export function SignUpForm() {
  const router = useRouter()
  const [role, setRole] = useState<AppRole>("DONOR")
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
      lat: "19.0760",
      lng: "72.8777",
      serviceRadiusKm: "15",
    },
    volunteerProfile: {
      phone: "",
      vehicleType: "MOTORCYCLE",
      capacityKg: "20",
      serviceRadiusKm: "10",
    },
  })

  const updateField = (field: keyof FormState, value: string) => {
    setState((previous) => ({ ...previous, [field]: value }))
  }

  const updateNgoField = (field: keyof FormState["ngoProfile"], value: string) => {
    setState((previous) => ({
      ...previous,
      ngoProfile: { ...previous.ngoProfile, [field]: value },
    }))
  }

  const updateVolunteerField = (field: keyof FormState["volunteerProfile"], value: string) => {
    setState((previous) => ({
      ...previous,
      volunteerProfile: { ...previous.volunteerProfile, [field]: value },
    }))
  }

  const geocodeNgoAddress = async () => {
    setError(null)
    if (!state.ngoProfile.address.trim()) {
      setError("Add the NGO address before looking up coordinates.")
      return
    }

    const response = await fetch(`/api/geocode?q=${encodeURIComponent(state.ngoProfile.address)}`, { cache: "no-store" })
    if (!response.ok) {
      setError("Could not resolve that address. Check it and try again.")
      return
    }

    const payload = (await response.json()) as { result: { lat: number; lng: number } }
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

    if (role === "VOLUNTEER") {
      payload.volunteerProfile = {
        phone: state.volunteerProfile.phone,
        vehicleType: state.volunteerProfile.vehicleType,
        capacityKg: Number(state.volunteerProfile.capacityKg),
        serviceRadiusKm: Number(state.volunteerProfile.serviceRadiusKm),
      }
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
      setLoading(false)
      setError(errorPayload?.error?.message ?? "Failed to create account.")
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

    const session = await getSession()
    const destination = getRoleHomePath(session?.user?.role)
    if (!destination) {
      setError("Account created, but role routing failed. Please sign in again.")
      router.push("/sign-in")
      return
    }

    router.replace(destination)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-3xl border-primary/15">
      <CardHeader className="gap-4 border-b pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Handshake weight="duotone" />
            </span>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl">Join the rescue network</CardTitle>
              <CardDescription>Choose the part of the handoff you want to move forward.</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1.5 font-mono text-[10px] uppercase">
            <Sparkle data-icon="inline-start" />
            New partner
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="flex flex-col gap-6">
          <Field>
            <FieldLabel>Choose your role</FieldLabel>
            <Tabs value={role} onValueChange={(value) => setRole(value as AppRole)}>
              <TabsList className="grid h-auto w-full grid-cols-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <TabsTrigger key={option.role} value={option.role} className="h-auto min-h-12 flex-col gap-1 py-2 text-[10px] sm:flex-row sm:text-xs">
                      <Icon data-icon="inline-start" />
                      <span>{option.label}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              {roleOptions.map((option) => (
                <TabsContent key={option.role} value={option.role} className="mt-2 text-muted-foreground text-[0.625rem]">
                  {option.description} · Fields below adapt to this workspace.
                </TabsContent>
              ))}
            </Tabs>
          </Field>

          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name"><User data-icon="inline-start" />Full name</FieldLabel>
              <Input id="name" placeholder="e.g. Jane Doe" value={state.name} onChange={(event) => updateField("name", event.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input id="email" type="email" placeholder="partner@organization.org" value={state.email} onChange={(event) => updateField("email", event.target.value)} required />
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel htmlFor="password">Security password</FieldLabel>
            <Input id="password" type="password" placeholder="At least 8 characters" value={state.password} onChange={(event) => updateField("password", event.target.value)} minLength={8} required />
            <FieldDescription>Use a password you do not reuse on other services.</FieldDescription>
          </Field>

          {role === "NGO" ? (
            <FieldSet className="bg-surface rounded-lg border p-4 sm:p-5">
              <FieldLegend variant="label" className="flex items-center gap-2"><Buildings /> NGO partner profile</FieldLegend>
              <FieldDescription>Give dispatchers the address and response radius for your kitchen or shelter.</FieldDescription>
              <FieldGroup className="mt-4">
                <Field>
                  <FieldLabel htmlFor="orgName">Registered NGO or shelter name</FieldLabel>
                  <Input id="orgName" placeholder="Hope Community Kitchen" value={state.ngoProfile.orgName} onChange={(event) => updateNgoField("orgName", event.target.value)} required />
                </Field>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="ngo-phone"><Phone data-icon="inline-start" />Dispatch phone</FieldLabel>
                    <Input id="ngo-phone" type="tel" placeholder="+91 9876543210" value={state.ngoProfile.phone} onChange={(event) => updateNgoField("phone", event.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ngo-radius">Service radius (km)</FieldLabel>
                    <Input id="ngo-radius" type="number" min={1} max={100} value={state.ngoProfile.serviceRadiusKm} onChange={(event) => updateNgoField("serviceRadiusKm", event.target.value)} required />
                  </Field>
                </FieldGroup>
                <Field>
                  <FieldLabel htmlFor="ngo-address"><MapPin data-icon="inline-start" />Kitchen or drop-off address</FieldLabel>
                  <Textarea id="ngo-address" placeholder="Full street address for courier dispatch" value={state.ngoProfile.address} onChange={(event) => updateNgoField("address", event.target.value)} required />
                </Field>
                <Button type="button" variant="outline" size="sm" className="w-fit" onClick={geocodeNgoAddress}>
                  <NavigationArrow data-icon="inline-start" />
                  Look up coordinates
                </Button>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="ngo-lat">Latitude</FieldLabel>
                    <Input id="ngo-lat" type="number" step="0.000001" className="font-mono" value={state.ngoProfile.lat} onChange={(event) => updateNgoField("lat", event.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ngo-lng">Longitude</FieldLabel>
                    <Input id="ngo-lng" type="number" step="0.000001" className="font-mono" value={state.ngoProfile.lng} onChange={(event) => updateNgoField("lng", event.target.value)} required />
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </FieldSet>
          ) : null}

          {role === "VOLUNTEER" ? (
            <FieldSet className="bg-surface rounded-lg border p-4 sm:p-5">
              <FieldLegend variant="label" className="flex items-center gap-2"><Truck /> Volunteer transport profile</FieldLegend>
              <FieldDescription>Set the range and capacity that should shape your rescue offers.</FieldDescription>
              <FieldGroup className="mt-4">
                <Field>
                  <FieldLabel htmlFor="volunteer-phone"><Phone data-icon="inline-start" />Mobile phone</FieldLabel>
                  <Input id="volunteer-phone" type="tel" placeholder="+91 9876543210" value={state.volunteerProfile.phone} onChange={(event) => updateVolunteerField("phone", event.target.value)} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="vehicle-type">Vehicle transport mode</FieldLabel>
                  <Select items={vehicleItems} value={state.volunteerProfile.vehicleType} onValueChange={(value) => updateVolunteerField("vehicleType", value ?? "MOTORCYCLE")}>
                    <SelectTrigger id="vehicle-type" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectGroup>{vehicleItems.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
                  </Select>
                </Field>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="capacity-kg">Cargo capacity (kg)</FieldLabel>
                    <Input id="capacity-kg" type="number" min={1} max={1000} step="0.5" value={state.volunteerProfile.capacityKg} onChange={(event) => updateVolunteerField("capacityKg", event.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="volunteer-radius">Operating radius (km)</FieldLabel>
                    <Input id="volunteer-radius" type="number" min={1} max={100} value={state.volunteerProfile.serviceRadiusKm} onChange={(event) => updateVolunteerField("serviceRadiusKm", event.target.value)} required />
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </FieldSet>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <WarningCircle />
              <AlertTitle>Registration needs attention</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <SpinnerGap data-icon="inline-start" className="animate-spin" /> : <ArrowRight data-icon="inline-start" />}
            {loading ? "Creating partner account…" : `Complete ${role.charAt(0) + role.slice(1).toLowerCase()} registration`}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="text-muted-foreground flex w-full items-center gap-1.5 text-[0.625rem]">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="text-success" />Role-based workspace access</span>
        </div>
      </CardFooter>
    </Card>
  )
}
