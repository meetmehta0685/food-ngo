# Volunteer Rescue Automation — Implementation Plan Index

Planned: 2026-07-30  
Repository: `/Users/meetmehta/Desktop/project/food-ngo`  
Base commit: `d8f91a1` plus the current uncommitted working tree

## Current foundation

The working tree already contains the first foundation slice:

- `VOLUNTEER` and `VehicleType` Prisma enums
- `VolunteerProfile`
- volunteer registration and profile fields
- protected `/volunteer` dashboard
- availability API with fresh browser geolocation
- database migration `20260730160000_add_volunteer_role`

Do not recreate that work. Commit or preserve it before starting Plan 001.

## Execution order

| Order | Plan | Outcome | New packages |
|---|---|---|---|
| 1 | [001-test-baseline.md](001-test-baseline.md) | Automated safety net and repeatable commands | `vitest`, `@vitest/coverage-v8`, `@playwright/test` |
| 2 | [002-rescue-domain-model.md](002-rescue-domain-model.md) | Assignment/event schema and guarded state machine | None |
| 3 | [003-dispatch-and-offers.md](003-dispatch-and-offers.md) | NGO dispatch, volunteer matching, atomic accept/reject | None |
| 4 | [004-offer-expiry-worker.md](004-offer-expiry-worker.md) | Reliable offer timeout and reassignment | `tsx` |
| 5 | [005-pickup-otp.md](005-pickup-otp.md) | Donor OTP gates food handoff | None; use Node `crypto` |
| 6 | [006-location-and-geofencing.md](006-location-and-geofencing.md) | Authenticated GPS ingestion and automatic arrival states | None; use browser Geolocation API |
| 7 | [007-ably-realtime.md](007-ably-realtime.md) | Live status/location on donor, NGO, and volunteer portals | `ably` |
| 8 | [008-automatic-workflow-ui.md](008-automatic-workflow-ui.md) | Role dashboards, live map, no manual “Next action” workflow | None |
| 9 | [009-simulator-e2e-and-hardening.md](009-simulator-e2e-and-hardening.md) | Local location simulator, full workflow E2E, resilience | None |
| 10 | [010-postgis-spatial-hardening.md](010-postgis-spatial-hardening.md) | Scalable indexed proximity matching after MVP | PostgreSQL extension only |

## Install timing

Install packages only when their plan starts:

```bash
# Plan 001
npm install -D vitest @vitest/coverage-v8 @playwright/test
npx playwright install chromium

# Plan 004
npm install tsx

# Plan 007
npm install ably
```

No Socket.IO, Pusher, Redis, OTP package, geolocation package, or alternate map
library is required for this workflow. Ably handles realtime delivery; REST and the
database remain authoritative. Leaflet can continue rendering the map—the earlier
accuracy issue comes from geocoding/location data, not the renderer itself.

## Target workflow

```text
NGO accepts donation
  -> NGO requests volunteer
  -> volunteer offer/accept
  -> EN_ROUTE_TO_PICKUP
  -> geofence confirms ARRIVED_AT_PICKUP
  -> donor OTP confirms handoff
  -> PICKED_UP / EN_ROUTE_TO_NGO
  -> geofence confirms ARRIVED_AT_NGO
  -> NGO confirms receipt
  -> DELIVERED
```

GPS may automate arrival states only. It must never mark food as picked up or
delivered without OTP or NGO confirmation.

## Global quality gates

Every plan must finish with:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Run `npm run test:e2e` when the plan changes a user-visible workflow. Never run
automated tests against the production Neon database or the deployed application.

## Stop conditions

Pause a plan before implementation if:

- the working tree contains overlapping edits not accounted for here;
- a migration would target the production database instead of an isolated
  development/test database;
- the deployment environment cannot run the Plan 004 worker as a separate process;
- Ably credentials or allowed channel capabilities cannot be configured safely.
