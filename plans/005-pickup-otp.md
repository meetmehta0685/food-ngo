# Plan 005: Gate Pickup With a Donor OTP

**Status:** TODO  
**Priority:** P0  
**Scope:** M  
**Planned:** 2026-07-30  
**Base:** current tree after Plan 004

## Summary

Generate a one-time donor code when the volunteer reaches pickup. The volunteer
must submit the code before food can move to `PICKED_UP`. OTP verification—not
GPS—is the proof of handoff.

## Dependencies

- Depends on: Plans 002–003
- Can run after Plan 004
- Blocks: complete pickup workflow

## Required libraries

None. Use Node's built-in `crypto` for secure generation, HMAC hashing, and
constant-time comparison.

## Scope

In scope:

- OTP generation, storage, expiry, resend, verification, and attempt limits;
- donor display and volunteer entry UI;
- state/event updates in one transaction;
- audit-safe notifications.

Out of scope:

- SMS/WhatsApp delivery;
- email OTP;
- arrival detection itself (Plan 006).

## Files to change

- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_add_pickup_otp/migration.sql`
- `lib/rescue/otp.ts`
- `lib/rescue/service.ts`
- `app/api/rescue-assignments/[id]/pickup-otp/route.ts`
- `app/api/rescue-assignments/[id]/verify-pickup-otp/route.ts`
- donor tracking UI
- volunteer assignment UI
- OTP unit/service tests
- `.env.example` for `PICKUP_OTP_SECRET`

## Security design

- six numeric digits generated with `crypto.randomInt`;
- store only an HMAC hash, never plaintext;
- 10-minute expiry;
- maximum five failed attempts, with rate limiting;
- resend rotates the old code and has a cooldown;
- logs/events never include the code or its hash;
- code is visible only to the authenticated donor who owns the donation.

## Implementation steps

1. Add nullable OTP hash/expiry/attempt/resend fields to `RescueAssignment`.
2. Generate the code only when the assignment is `ARRIVED_AT_PICKUP`.
3. Return plaintext once to the donor UI; persist only its HMAC.
4. Verify in a transaction with expected state and expiry checks.
5. On success:
   - append `OTP_VERIFIED`;
   - transition to `PICKED_UP`, then `EN_ROUTE_TO_NGO`;
   - update the high-level donation status to `PICKED_UP`;
   - keep the volunteer unavailable.
6. Treat a repeated successful request as idempotent.
7. Clear/rotate sensitive OTP fields after verification.

## Acceptance criteria

- A volunteer cannot mark food picked up without a valid donor OTP.
- Wrong, expired, or rotated OTPs fail without revealing which check failed.
- Five failed attempts lock verification until donor resend.
- Successful verification updates assignment, donation, events, and notifications
  atomically.

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

Test correct, wrong, expired, resent, brute-force lockout, and duplicate-submit
paths.

## Rollback

Disable OTP routes/UI and keep the existing NGO self-pickup path available. Do not
restore manual volunteer pickup without an equivalent handoff proof.

## Risks

- In-app OTP requires the donor to remain signed in. SMS can be added later, but is
  not required for the first workflow.
- Server clock skew affects expiry; use database/server timestamps consistently.

