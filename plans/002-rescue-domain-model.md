# Plan 002: Add the Rescue Assignment Domain Model

**Status:** TODO  
**Priority:** P0  
**Scope:** M  
**Planned:** 2026-07-30  
**Base:** `d8f91a1` plus current working tree

## Summary

Model volunteer delivery separately from the existing donation lifecycle. A
`RescueAssignment` represents one volunteer attempt; immutable `RescueEvent`
records form its audit timeline. Donation status stays the high-level donor/NGO
truth, while assignment status handles movement.

## Dependencies

- Depends on: Plan 001
- Blocks: Plans 003–010

## Scope

In scope:

- assignment and event enums/models;
- delivery mode on a donation;
- estimated weight for capacity matching;
- centralized assignment transition policy;
- migration and repository/service helpers.

Out of scope:

- dispatch endpoints, OTP, location ingestion, realtime, UI.

## Schema design

Add:

- `DeliveryMode`: `NGO_SELF_PICKUP`, `VOLUNTEER_DELIVERY`
- `RescueAssignmentStatus`: `OFFERED`, `ACCEPTED`,
  `EN_ROUTE_TO_PICKUP`, `ARRIVED_AT_PICKUP`, `PICKED_UP`,
  `EN_ROUTE_TO_NGO`, `ARRIVED_AT_NGO`, `DELIVERED`, `REJECTED`,
  `EXPIRED`, `CANCELLED`, `FAILED`
- `RescueEventType`: `OFFER_CREATED`, `OFFER_ACCEPTED`,
  `OFFER_REJECTED`, `OFFER_EXPIRED`, `STATUS_CHANGED`,
  `LOCATION_RECEIVED`, `GEOFENCE_ENTERED`, `OTP_VERIFIED`,
  `DELIVERY_CONFIRMED`, `SYSTEM_NOTE`

`Donation` gains `deliveryMode` and nullable `estimatedWeightKg` so old data
remains valid. New volunteer-delivery reports must provide weight.

`RescueAssignment` must include donation/volunteer relations, attempt number,
status, offer expiry, acceptance and terminal timestamps, pickup and NGO
coordinates snapshotted at creation, and created/updated timestamps.

`RescueEvent` must include assignment, monotonic sequence, nullable actor (system
events have no human actor), from/to status, optional coordinates/accuracy and
JSON metadata. Enforce uniqueness on `(assignmentId, sequence)`.

## Files to change

- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_add_rescue_assignments/migration.sql`
- `lib/rescue/status.ts`
- `lib/rescue/service.ts`
- `lib/rescue/types.ts`
- `tests/unit/rescue-status.test.ts`
- donor donation form/API files that persist `estimatedWeightKg`
- `.env.example` only if migration/test variables need documentation

## Implementation steps

1. Add enums/models and relations without deleting existing lifecycle fields.
2. Add a PostgreSQL partial unique index in migration SQL preventing more than one
   non-terminal assignment for a donation.
3. Define an explicit transition map. No route may set assignment status directly.
4. Implement a transaction helper that:
   - validates expected current state;
   - updates assignment;
   - appends the next sequenced event;
   - applies any required donation-level status change.
5. Treat repeated identical commands as idempotent success where safe; reject
   backward or skipped transitions.
6. Update report validation so volunteer delivery requires a positive estimated
   weight, while legacy/self-pickup donations remain compatible.
7. Generate and inspect the SQL before applying it to an isolated development DB.

## Acceptance criteria

- Existing donations remain readable.
- At most one active assignment exists per donation.
- Every assignment transition creates an event in the same transaction.
- Illegal jumps such as `OFFERED -> PICKED_UP` fail.
- System-generated events do not require a fake user.

## Verification

```bash
npx prisma validate
npx prisma generate
npm run lint
npm run typecheck
npm run test
npm run build
```

Manually inspect the generated migration and test create/transition/rollback on an
isolated database.

## Rollback

Reverse application code first, then use a reviewed down migration to drop new
tables/columns only if no rescue data must be retained. Never use `prisma migrate
reset` on shared data.

## Risks

- Prisma does not express partial unique indexes; preserve the hand-written SQL.
- Dual donation/assignment state can drift. Only the transaction service may update
  both.

