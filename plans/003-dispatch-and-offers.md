# Plan 003: Implement Volunteer Dispatch and Atomic Offers

**Status:** TODO  
**Priority:** P0  
**Scope:** M  
**Planned:** 2026-07-30  
**Base:** current tree after Plan 002

## Summary

Let an assigned NGO request volunteer delivery, rank available volunteers, create
one expiring offer, and allow exactly one volunteer to accept it. Critical commands
remain authenticated REST mutations backed by database transactions.

## Dependencies

- Depends on: Plan 002
- Blocks: Plans 004–009

## Scope

In scope:

- NGO delivery-mode choice;
- eligibility/ranking;
- offer creation, listing, accept, and reject;
- transaction-safe winner selection and audit events;
- authorization and idempotency.

Out of scope:

- automatic expiry worker (Plan 004);
- OTP, live GPS, Ably, final polished dashboards.

## Files to change

- `lib/matching/match-volunteers.ts`
- `lib/rescue/service.ts`
- `lib/rescue/authorization.ts`
- `app/api/donations/[id]/rescue-assignments/route.ts`
- `app/api/volunteer/offers/route.ts`
- `app/api/volunteer/offers/[id]/accept/route.ts`
- `app/api/volunteer/offers/[id]/reject/route.ts`
- NGO accepted-donation action component
- volunteer dashboard offer component
- focused unit/service tests under `tests/`

## Eligibility and ranking rules

A volunteer is eligible only when:

- `isAvailable` is true;
- current coordinates exist;
- `lastLocationAt` is no older than two minutes;
- capacity covers `estimatedWeightKg`;
- pickup is inside `serviceRadiusKm`;
- no active assignment exists for that volunteer.

Initially rank using the existing Haversine helper by pickup distance. Deterministic
ties use volunteer ID. PostGIS optimization is Plan 010.

## Implementation steps

1. On an NGO-owned accepted donation, expose self-pickup vs volunteer delivery.
2. Validate the donation has pickup coordinates, NGO coordinates, and estimated
   weight before dispatch.
3. Snapshot pickup/NGO coordinates into the assignment so later profile edits do
   not move the route.
4. Rank eligible volunteers and create an `OFFERED` assignment for the first
   candidate with a 45-second `offerExpiresAt`.
5. Return sanitized offer details; do not expose donor private information until
   acceptance.
6. In accept/reject handlers, authorize the offered volunteer and lock/claim the
   assignment transactionally. Acceptance must fail if expired, already accepted,
   or superseded.
7. On acceptance, mark the volunteer unavailable, append events, and move to
   `EN_ROUTE_TO_PICKUP` through the state service.
8. Repeated accept requests with the same assignment should return the accepted
   representation rather than create duplicate events.
9. Add service tests for two simultaneous accept calls; exactly one succeeds.

## Acceptance criteria

- Only the assigned NGO can request dispatch.
- Stale, overloaded, busy, or out-of-radius volunteers are excluded.
- The offer expires logically at its timestamp even before Plan 004 runs.
- Only one active assignment/volunteer can win.
- All successful commands append events in the same transaction.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Also run a concurrency test issuing two accept requests simultaneously and confirm
one database winner.

## Rollback

Disable the dispatch UI and routes; existing accepted donations continue through
the current NGO self-pickup path. Preserve assignment/event data.

## Risks

- Application-only concurrency checks are insufficient. The database constraint
  and transaction are mandatory.
- Quantity strings cannot support capacity matching; use the numeric weight field.

