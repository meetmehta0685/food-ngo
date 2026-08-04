# Plan 006: Ingest Volunteer Location and Automate Arrival States

**Status:** TODO  
**Priority:** P0  
**Scope:** L  
**Planned:** 2026-07-30  
**Base:** current tree after Plan 005

## Summary

Accept authenticated volunteer GPS samples, store a bounded location trail, and
use accuracy-aware geofence dwell rules to automate only `ARRIVED_AT_PICKUP` and
`ARRIVED_AT_NGO`.

## Dependencies

- Depends on: Plans 002, 003, and 005
- Blocks: Plans 007–009

## Required libraries

None. Use browser `navigator.geolocation`, the existing Haversine helper, Prisma,
and server-side validation.

## Scope

In scope:

- location sample model/API;
- browser watch lifecycle;
- geofence evaluator;
- stale/out-of-order/idempotent handling;
- automatic arrival transitions and events;
- privacy retention.

Out of scope:

- using GPS to confirm pickup or delivery;
- background tracking after the assignment ends;
- Ably fan-out (Plan 007);
- PostGIS optimization (Plan 010).

## Data model

Add `VolunteerLocationSample` with assignment, volunteer, latitude, longitude,
accuracy, client timestamp, server timestamp, and optional speed/heading. Index by
assignment/server time. Add assignment fields for last processed client timestamp
and pickup/NGO geofence dwell start.

Retain detailed samples for a short documented window (recommended seven days);
retain audit events without precise trails longer.

## Files to change

- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_add_location_samples/migration.sql`
- `lib/rescue/geofence.ts`
- `lib/rescue/location-service.ts`
- `app/api/volunteer/location/route.ts`
- volunteer active-assignment client hook/component
- cleanup worker/task configuration
- geofence and route tests

## Geofence policy

- radius: configurable 125 m default;
- accept samples only when accuracy is at most 50 m;
- require continuous qualifying dwell for 20 seconds;
- reset dwell when a trustworthy sample moves outside the radius;
- ignore samples older than the last processed client timestamp or implausibly far
  in the future;
- use server receipt time to enforce freshness.

## Implementation steps

1. Add the sample table and assignment processing fields.
2. Create a pure geofence evaluator with boundary and accuracy tests.
3. Implement `POST /api/volunteer/location`:
   - authenticate volunteer;
   - authorize the active accepted assignment;
   - validate coordinate ranges, accuracy, and timestamp;
   - rate limit;
   - store and process in one short transaction.
4. On pickup dwell completion, transition only
   `EN_ROUTE_TO_PICKUP -> ARRIVED_AT_PICKUP`, append geofence event, and trigger
   OTP generation.
5. On NGO dwell completion, transition only
   `EN_ROUTE_TO_NGO -> ARRIVED_AT_NGO` and notify the NGO to confirm receipt.
6. Start `watchPosition` only on an active assignment; stop on terminal state,
   sign-out, permission denial, or component unmount.
7. Send samples at a bounded cadence (for example 5–10 seconds while moving), not
   every raw browser callback.
8. Add cleanup for old precise samples.

## Acceptance criteria

- One low-accuracy or transient sample cannot trigger arrival.
- Out-of-order/repeated samples do not duplicate events.
- GPS never sets `PICKED_UP` or `DELIVERED`.
- Tracking stops promptly at terminal states.
- Donor/NGO private coordinates are exposed only to assignment participants.

## Verification

```bash
npx prisma validate
npx prisma generate
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Use deterministic unit sample sequences for outside, boundary, dwell, bad
accuracy, stale, teleport, and duplicate cases.

## Rollback

Disable location ingestion and present an explicit arrival confirmation fallback
to authorized participants. Keep OTP and NGO delivery confirmation mandatory.

## Risks

- Mobile browsers throttle background tabs. UI must tell the volunteer to keep the
  tracking screen active.
- GPS spoofing remains possible; OTP and NGO confirmation limit its impact.
- Precise trails are sensitive personal data; retention and access control are
  mandatory.

