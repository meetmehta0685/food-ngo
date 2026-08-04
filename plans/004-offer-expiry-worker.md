# Plan 004: Add Offer Expiry and Automatic Reassignment

**Status:** IMPLEMENTED  
**Priority:** P0  
**Scope:** M  
**Planned:** 2026-07-30  
**Base:** current tree after Plan 003

## Summary

Run a small database-backed worker that expires unanswered offers and advances to
the next eligible volunteer. This avoids adding Redis during MVP while still
providing prompt, durable timeout processing.

## Dependencies

- Depends on: Plan 003
- Blocks: complete dispatch automation

## Required installation

```bash
npm install tsx
```

The production runtime must run the worker as a separate long-lived Node process.
If the chosen host cannot do that, stop and choose a managed job system before
implementation.

## Scope

In scope:

- claim expired offers safely;
- mark them `EXPIRED`;
- offer the next eligible volunteer;
- stop after a configured attempt limit;
- worker health and graceful shutdown.

Out of scope:

- Redis/BullMQ;
- Ably publication;
- retrying unrelated failed business operations.

## Files to change

- `workers/rescue-offers.ts`
- `lib/rescue/dispatch.ts`
- `lib/rescue/service.ts`
- `package.json` and `package-lock.json`
- `.env.example`
- service/concurrency tests under `tests/`

## Implementation steps

1. Add configuration for offer duration, maximum attempts, and worker polling
   interval with bounded defaults (45 seconds, 5 attempts, 2 seconds).
2. Add `worker:rescue` and `worker:rescue:dev` scripts.
3. Claim expired rows using a short PostgreSQL transaction and `FOR UPDATE SKIP
   LOCKED`, so multiple workers cannot process the same offer.
4. For each claimed offer:
   - recheck status and expiry;
   - transition to `EXPIRED` and append an event;
   - rank candidates excluding previously attempted volunteers;
   - create the next offer or append a terminal `FAILED` event.
5. Do not keep a transaction open while ranking or waiting.
6. Make process shutdown stop polling and finish the active batch.
7. Add a health log/heartbeat without including donor personal data.

## Acceptance criteria

- An unanswered offer is expired within the configured polling tolerance.
- Restarting the worker does not lose pending timeouts.
- Two worker instances cannot create duplicate next offers.
- Rejected and expired volunteers are not immediately re-offered the same rescue.
- Exhaustion is visible to the NGO as “no volunteer available,” with self-pickup
  still possible.

## Verification

```bash
npm run worker:rescue:dev
npm run lint
npm run typecheck
npm run test
npm run build
```

Use shortened test durations in an isolated database; restart the worker between
offer creation and expiry to prove durability.

## Rollback

Stop the worker process and hide new dispatch requests. Existing offers remain
logically expired by timestamp and can be closed by an admin repair command.

## Risks

- A web-only host may not support workers.
- Worker loops must not exhaust database connections; use small batches and the
  existing Prisma singleton.
- BullMQ + Redis is a later scaling option, not an MVP requirement.
