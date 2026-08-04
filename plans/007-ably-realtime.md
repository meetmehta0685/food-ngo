# Plan 007: Add Ably Realtime Delivery

**Status:** IMPLEMENTED (full browser recovery E2E remains in Plan 009)  
**Priority:** P0  
**Scope:** M  
**Planned:** 2026-07-30  
**Base:** current tree after Plan 006

## Summary

Publish committed assignment status and sanitized volunteer location updates through
Ably so donor, NGO, and volunteer screens update immediately. REST remains the only
way to perform critical commands, and PostgreSQL remains the source of truth.

## Dependencies

- Depends on: Plans 003–006
- Blocks: final live UI in Plan 008

## Required installation

```bash
npm install ably
```

Required environment variable: server-only `ABLY_API_KEY`. Never expose the API
key through `NEXT_PUBLIC_*`.

## Scope

In scope:

- server Ably client;
- scoped token authentication;
- participant channels;
- post-commit event publication;
- reconnect/resync behavior;
- replacing relevant polling.

Out of scope:

- direct client publication of authoritative status;
- Socket.IO, Pusher, Redis;
- durable truth stored only in Ably.

## Channel and authorization design

- `user:<userId>` for private offers/notifications;
- `rescue:<assignmentId>` for assignment status and sanitized live location.

The token route authenticates the session and grants subscribe capability only for
the user's own channel and assignments in which the user is donor, assigned NGO,
or assigned volunteer. Volunteers do not receive donor private data before offer
acceptance.

## Files to change

- `lib/realtime/ably-server.ts`
- `lib/realtime/events.ts`
- `app/api/realtime/token/route.ts`
- `components/realtime/ably-provider.tsx`
- assignment subscription hooks
- `components/realtime/live-event-listener.tsx`
- rescue mutation/location services
- `.env.example`
- realtime authorization and reconnect tests

## Implementation steps

1. Define versioned event payloads for offer, status, location, OTP-ready,
   notification, and assignment terminal events.
2. Add a singleton server publisher and scoped token route.
3. Update database state and event log first. Publish only after commit; a publish
   failure must not roll back valid business state.
4. Include assignment ID, event ID/sequence, and server timestamp in every event so
   clients can deduplicate and order.
5. Publish rounded/sanitized location only to assignment participants.
6. On subscription start or reconnect, fetch the authoritative REST snapshot before
   applying newer realtime events.
7. Replace the current 10-second notification and 30-second router refresh polling
   where Ably now supplies events. Retain a slow recovery refresh if desired.
8. Add structured error handling that reconnects without duplicating UI state.

## Acceptance criteria

- Donor and NGO see status/location changes without manual refresh.
- Unauthorized users cannot obtain subscribe capability for another rescue.
- Refresh/reconnect converges to database state.
- Duplicate/out-of-order events do not regress the UI.
- The workflow still works if Ably is briefly unavailable; it becomes delayed, not
  corrupted.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Test three authenticated browser contexts plus an unauthorized fourth context.
Temporarily block the Ably connection, perform a REST mutation, reconnect, and
verify resynchronization.

## Rollback

Restore slow polling while leaving REST/database workflow intact. Remove Ably token
issuance before removing the client provider.

## Risks

- Channel names are not authorization. Token capabilities must be scoped server-side.
- Publishing before commit can show states that never persisted.
- High-frequency samples can exceed quotas; publish at the same bounded cadence as
  accepted location ingestion.
