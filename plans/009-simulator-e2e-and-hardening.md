# Plan 009: Add a Location Simulator, Full E2E, and Recovery Tests

**Status:** TODO  
**Priority:** P0  
**Scope:** L  
**Planned:** 2026-07-30  
**Base:** current tree after Plan 008

## Summary

Make the complete automatic workflow reproducible without physically travelling.
Add development-only route simulation, isolated seeded users, Playwright
geolocation tests, and failure/recovery coverage.

## Dependencies

- Depends on: Plans 001–008
- Blocks: MVP release

## Required libraries

None beyond Playwright installed in Plan 001.

## Scope

In scope:

- development-only simulator UI/API;
- deterministic test seed/cleanup;
- multi-role Playwright workflow;
- location/OTP/realtime/worker failure scenarios;
- observability and privacy checks.

Out of scope:

- exposing simulation in production;
- load testing at large scale;
- native-device background GPS guarantees.

## Files to change

- `app/dev/location-simulator/**`
- `app/api/dev/location-simulator/route.ts`
- `lib/env.ts` or equivalent environment guard
- `prisma/seed-test.ts`
- `tests/e2e/volunteer-rescue.spec.ts`
- Playwright fixtures for donor/NGO/volunteer sessions
- operational documentation

## Simulator design

The simulator accepts pickup/NGO points and interpolates a route. It sends the
exact same authenticated location REST requests as the volunteer client. Controls:

- start/pause/stop;
- speed;
- accuracy;
- jump to pickup/NGO;
- inject stale, duplicate, out-of-order, offline, and low-accuracy samples.

Every simulator route and API must return 404 unless `NODE_ENV !== "production"`
and an explicit development flag is enabled.

## Implementation steps

1. Add isolated seed users and data using `TEST_DATABASE_URL`.
2. Add reusable authenticated Playwright fixtures for all three roles.
3. Build the simulator behind compile-time and server-side environment guards.
4. Cover the happy path:
   NGO accepts -> dispatch -> volunteer accepts -> pickup dwell -> donor OTP ->
   NGO dwell -> NGO confirms -> delivered.
5. Cover rejection/expiry/reassignment and no-volunteer fallback.
6. Cover invalid/expired OTP, location permission denial, stale/low-accuracy GPS,
   Ably disconnect/reconnect, duplicate REST commands, and worker restart.
7. Assert every state change has one audit event and no unauthorized account sees
   coordinates/OTP.
8. Document how to run the web process, worker, and simulator locally.

## Acceptance criteria

- A developer can complete a rescue locally without moving a physical device.
- The simulator is unreachable in production builds.
- E2E proves all three portals converge on delivered state.
- Recovery tests prove database state remains correct through disconnects and
  duplicate requests.
- Test cleanup removes only uniquely prefixed test records.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
NODE_ENV=production npm run build
```

Attempt both simulator URL and API against the production build; both must be 404.

## Rollback

Remove simulator routes and fixtures without changing production domain behavior.
Retain non-simulator E2E tests.

## Risks

- A weak environment check could expose spoofing tools. Use defense in depth and
  test the production build.
- Shared test databases make cleanup dangerous; require a dedicated database and
  uniquely prefixed IDs.

