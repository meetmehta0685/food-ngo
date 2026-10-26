#!/usr/bin/env node
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000"
const DWELL_WAIT_MS = 21_000
const OFFER_EXPIRY_WAIT_MS = 47_000
const stamp = Date.now()
const password = `E2e!${stamp.toString(36)}pw`

const pickup = {
  lat: Number((19.07 + Math.random() * 0.01).toFixed(6)),
  lng: Number((72.87 + Math.random() * 0.01).toFixed(6)),
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class StepError extends Error {
  constructor(step, status, body) {
    super(step)
    this.step = step
    this.status = status
    this.body = body
  }
}

function pass(step, detail) {
  console.log(`PASS ${step}${detail ? ` (${detail})` : ""}`)
}

function check(step, condition, status, body) {
  if (!condition) {
    throw new StepError(step, status, body)
  }
}

function createClient(label) {
  const jar = new Map()

  async function request(method, path, { json, form, headers = {} } = {}) {
    const init = { method, redirect: "manual", headers: { ...headers } }

    if (jar.size > 0) {
      init.headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ")
    }

    if (json !== undefined) {
      init.headers["content-type"] = "application/json"
      init.body = JSON.stringify(json)
    } else if (form !== undefined) {
      init.headers["content-type"] = "application/x-www-form-urlencoded"
      init.body = new URLSearchParams(form).toString()
    }

    const res = await fetch(`${BASE}${path}`, init)

    for (const raw of res.headers.getSetCookie()) {
      const [pair] = raw.split(";")
      const idx = pair.indexOf("=")
      const name = pair.slice(0, idx).trim()
      const value = pair.slice(idx + 1).trim()

      if (value === "" || /max-age=0/i.test(raw)) {
        jar.delete(name)
      } else {
        jar.set(name, value)
      }
    }

    const text = await res.text()
    let body = text

    try {
      body = text ? JSON.parse(text) : null
    } catch {}

    return { status: res.status, body }
  }

  return { label, jar, request }
}

async function expectOk(step, client, method, path, options) {
  const res = await client.request(method, path, options)
  check(step, res.status >= 200 && res.status < 300, res.status, res.body)
  return res.body
}

async function signIn(client, email) {
  const step = `sign in ${client.label}`
  const csrf = await expectOk(step, client, "GET", "/api/auth/csrf")
  check(step, csrf?.csrfToken, 0, csrf)

  const res = await client.request("POST", "/api/auth/callback/credentials", {
    form: {
      csrfToken: csrf.csrfToken,
      email,
      password,
      json: "true",
      redirect: "false",
      callbackUrl: BASE,
    },
  })

  const sessionCookie = [...client.jar.keys()].find((name) =>
    name.endsWith("next-auth.session-token"),
  )
  check(step, res.status < 400 && sessionCookie, res.status, res.body)

  const session = await expectOk(step, client, "GET", "/api/auth/session")
  check(step, session?.user?.email === email, 0, session)
  pass(step, `${session.user.role} ${session.user.id}`)
  return session.user
}

async function postLocation(step, client, assignmentId, point) {
  return expectOk(step, client, "POST", "/api/volunteer/location", {
    json: {
      assignmentId,
      lat: point.lat,
      lng: point.lng,
      accuracy: 10,
      clientTimestamp: new Date().toISOString(),
    },
  })
}

async function dwellAt(step, client, assignmentId, point, expectedStatus) {
  const first = await postLocation(step, client, assignmentId, point)
  check(step, first?.location && !first.location.ignored, 0, first)
  await sleep(DWELL_WAIT_MS)
  const second = await postLocation(step, client, assignmentId, point)
  check(step, second?.location?.status === expectedStatus, 0, second)
  return second.location
}

async function main() {
  console.log(`e2e run ${stamp} against ${BASE}, pickup ${pickup.lat},${pickup.lng}`)

  const donor = createClient("donor")
  const ngo = createClient("ngo")
  const volunteer = createClient("volunteer")
  const standby = createClient("standby")
  const emails = {
    donor: `e2e-donor-${stamp}@example.test`,
    ngo: `e2e-ngo-${stamp}@example.test`,
    volunteer: `e2e-volunteer-${stamp}@example.test`,
    standby: `e2e-standby-${stamp}@example.test`,
  }

  const registrations = [
    [donor, { name: "E2E Donor", email: emails.donor, password, role: "DONOR" }],
    [
      ngo,
      {
        name: "E2E NGO",
        email: emails.ngo,
        password,
        role: "NGO",
        ngoProfile: {
          orgName: `E2E Kitchen ${stamp}`,
          phone: "9000000001",
          address: "E2E Test Address, Mumbai",
          lat: pickup.lat,
          lng: pickup.lng,
          serviceRadiusKm: 15,
        },
      },
    ],
    [
      volunteer,
      {
        name: "E2E Volunteer",
        email: emails.volunteer,
        password,
        role: "VOLUNTEER",
        volunteerProfile: {
          phone: "9000000002",
          vehicleType: "CAR",
          capacityKg: 100,
          serviceRadiusKm: 10,
        },
      },
    ],
    [
      standby,
      {
        name: "E2E Standby Volunteer",
        email: emails.standby,
        password,
        role: "VOLUNTEER",
        volunteerProfile: {
          phone: "9000000003",
          vehicleType: "BICYCLE",
          capacityKg: 20,
          serviceRadiusKm: 10,
        },
      },
    ],
  ]

  for (const [client, payload] of registrations) {
    const step = `register ${client.label}`
    const body = await expectOk(step, client, "POST", "/api/auth/register", { json: payload })
    check(step, body?.user?.role === payload.role, 0, body)
    pass(step, body.user.id)
  }

  await signIn(donor, emails.donor)
  const ngoUser = await signIn(ngo, emails.ngo)
  await signIn(volunteer, emails.volunteer)
  await signIn(standby, emails.standby)

  let step = "donor creates donation"
  const created = await expectOk(step, donor, "POST", "/api/donations", {
    json: {
      foodType: "E2E cooked rice",
      quantity: "10 boxes",
      servesCount: 20,
      estimatedWeightKg: 5,
      address: "E2E Pickup Point, Mumbai",
      lat: pickup.lat,
      lng: pickup.lng,
      pickupBy: new Date(Date.now() + 3 * 3600_000).toISOString(),
      notes: `e2e run ${stamp}`,
    },
  })
  check(step, created?.donationId && created.status === "NOTIFIED", 0, created)
  const donationId = created.donationId
  pass(step, `${donationId} status=${created.status} candidates=${created.candidates}`)

  step = "test NGO is among match candidates"
  const ngoView = await expectOk(step, ngo, "GET", `/api/donations/${donationId}`)
  const candidate = ngoView?.donation?.candidates?.find((c) => c.ngoUserId === ngoUser.id)
  check(step, candidate && candidate.state === "PENDING", 0, ngoView?.donation?.candidates)
  pass(step, `match ${candidate.id} rank=${candidate.rank} distanceKm=${candidate.distanceKm}`)

  step = "NGO accepts match"
  const accepted = await expectOk(step, ngo, "POST", `/api/matches/${candidate.id}/respond`, {
    json: { decision: "ACCEPT" },
  })
  check(step, accepted?.result?.state === "ACCEPTED", 0, accepted)
  check(
    `${step} (no other volunteer auto-dispatched before ours is online)`,
    !accepted.dispatch?.assignment,
    0,
    accepted,
  )
  pass(step, `auto-dispatch terminalReason=${accepted.dispatch?.terminalReason ?? "none"}`)

  step = "donation status is ACCEPTED"
  const afterAccept = await expectOk(step, donor, "GET", `/api/donations/${donationId}`)
  check(
    step,
    afterAccept?.donation?.status === "ACCEPTED" && afterAccept.donation.assignedNgoId === ngoUser.id,
    0,
    { status: afterAccept?.donation?.status, assignedNgoId: afterAccept?.donation?.assignedNgoId },
  )
  pass(step)

  step = "standby volunteer goes available at pickup point"
  const standbyAvailability = await expectOk(step, standby, "PATCH", "/api/volunteer/availability", {
    json: { isAvailable: true, lat: pickup.lat, lng: pickup.lng },
  })
  check(step, standbyAvailability?.profile?.isAvailable === true, 0, standbyAvailability)
  pass(step)

  step = "volunteer goes available next to pickup point"
  const availability = await expectOk(step, volunteer, "PATCH", "/api/volunteer/availability", {
    json: { isAvailable: true, lat: pickup.lat + 0.0003, lng: pickup.lng },
  })
  check(step, availability?.profile?.isAvailable === true, 0, availability)
  pass(step)

  step = "NGO requests volunteer"
  const requested = await expectOk(step, ngo, "POST", `/api/donations/${donationId}/rescue-assignments`)
  const firstOfferId = requested?.assignment?.id
  check(step, firstOfferId && requested.assignment.status === "OFFERED", 0, requested)
  pass(step, `assignment ${firstOfferId} distanceKm=${requested.assignment.distanceKm}`)

  const findOffer = async (client, predicate) => {
    const notes = await expectOk(step, client, "GET", "/api/notifications")
    return notes?.notifications?.find((n) => n.title === "New rescue offer" && predicate(n))
  }

  step = "first offer went to nearest (standby) volunteer"
  check(step, await findOffer(standby, (n) => n.metadata?.assignmentId === firstOfferId), 0, requested)
  pass(step)

  step = "unanswered offer expires and is reassigned without a worker"
  await sleep(OFFER_EXPIRY_WAIT_MS)
  let offerNote
  for (let attempt = 0; attempt < 10 && !offerNote; attempt += 1) {
    await sleep(3_000)
    offerNote = await findOffer(volunteer, (n) => n.metadata?.assignmentId !== firstOfferId)
  }
  check(step, offerNote, 0, "no reassigned offer reached the second volunteer")
  const assignmentId = offerNote.metadata.assignmentId
  pass(step, `assignment ${assignmentId}`)

  step = "volunteer accepts offer"
  const acceptedOffer = await expectOk(step, volunteer, "POST", `/api/volunteer/offers/${assignmentId}/accept`)
  check(step, acceptedOffer?.assignment?.status === "EN_ROUTE_TO_PICKUP", 0, acceptedOffer)
  pass(step, acceptedOffer.assignment.status)

  step = "volunteer arrives at pickup (geofence dwell)"
  const atPickup = await dwellAt(step, volunteer, assignmentId, pickup, "ARRIVED_AT_PICKUP")
  pass(step, `status=${atPickup.status} distanceMeters=${atPickup.distanceMeters?.toFixed(1)}`)

  step = "donor generates pickup OTP"
  const otp = await expectOk(step, donor, "POST", `/api/rescue-assignments/${assignmentId}/pickup-otp`)
  check(step, /^\d{6}$/.test(otp?.otp?.code ?? ""), 0, otp)
  pass(step, `expiresAt=${otp.otp.expiresAt}`)

  step = "volunteer verifies pickup OTP"
  const verified = await expectOk(step, volunteer, "POST", `/api/rescue-assignments/${assignmentId}/verify-pickup-otp`, {
    json: { code: otp.otp.code },
  })
  check(step, verified?.assignment?.status === "EN_ROUTE_TO_NGO", 0, verified)
  pass(step, verified.assignment.status)

  step = "donation status is PICKED_UP"
  const afterPickup = await expectOk(step, donor, "GET", `/api/donations/${donationId}`)
  check(step, afterPickup?.donation?.status === "PICKED_UP", 0, { status: afterPickup?.donation?.status })
  pass(step)

  step = "volunteer arrives at NGO (geofence dwell)"
  const ngoPoint = { lat: candidate.ngoUser.ngoProfile.lat, lng: candidate.ngoUser.ngoProfile.lng }
  const atNgo = await dwellAt(step, volunteer, assignmentId, ngoPoint, "ARRIVED_AT_NGO")
  pass(step, `status=${atNgo.status}`)

  step = "NGO confirms delivery"
  const delivered = await expectOk(step, ngo, "POST", `/api/rescue-assignments/${assignmentId}/confirm-delivery`)
  check(step, delivered?.assignment?.status === "DELIVERED", 0, delivered)
  pass(step, `completedAt=${delivered.assignment.completedAt}`)

  step = "final donation status is DELIVERED"
  const final = await expectOk(step, donor, "GET", `/api/donations/${donationId}`)
  const statuses = final?.donation?.statusEvents?.map((e) => e.status) ?? []
  check(step, final?.donation?.status === "DELIVERED", 0, { status: final?.donation?.status, statuses })
  pass(step, statuses.join(" > "))

  step = "donor has notifications for donation"
  const donorNotes = await expectOk(step, donor, "GET", "/api/notifications")
  const forDonation = donorNotes?.notifications?.filter((n) => n.donationId === donationId) ?? []
  check(step, forDonation.some((n) => n.title === "Delivery complete"), 0, forDonation.map((n) => n.title))
  pass(step, `${forDonation.length}: ${forDonation.map((n) => n.title).join(" | ")}`)

  for (const client of [volunteer, standby]) {
    await expectOk(`${client.label} goes offline`, client, "PATCH", "/api/volunteer/availability", {
      json: { isAvailable: false },
    })
  }
}

main()
  .then(() => {
    console.log("ALL PASS")
  })
  .catch((error) => {
    if (error instanceof StepError) {
      const body = typeof error.body === "string" ? error.body.slice(0, 500) : JSON.stringify(error.body)
      console.log(`FAIL ${error.step}: ${error.status} ${body}`)
    } else {
      console.log(`FAIL unexpected: ${error?.stack ?? error}`)
    }
    process.exit(1)
  })
