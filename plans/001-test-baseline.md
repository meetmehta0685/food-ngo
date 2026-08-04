# Plan 001: Establish a Test and Verification Baseline

**Status:** TODO  
**Priority:** P0  
**Scope:** S  
**Planned:** 2026-07-30  
**Base:** `d8f91a1` plus current uncommitted volunteer foundation

## Summary

Add fast unit tests and a browser-test skeleton before introducing concurrent
assignment and location state. The repository currently has lint/build checks but
no test files and no `test`, `typecheck`, or E2E scripts.

## Dependencies

- Depends on: current volunteer foundation being preserved
- Blocks: Plans 002–010

## Required installation

```bash
npm install -D vitest @vitest/coverage-v8 @playwright/test
npx playwright install chromium
```

## Scope

In scope:

- add stable npm scripts;
- configure Vitest and Playwright;
- characterize existing status transitions, Haversine distance, auth role routing,
  and volunteer availability validation;
- document isolated test database requirements.

Out of scope:

- production behavior changes;
- testing against the deployed site or production Neon database;
- broad component snapshot coverage.

## Files to change

- `package.json` and `package-lock.json`
  - add `typecheck`, `test`, `test:watch`, `test:coverage`, and `test:e2e` scripts.
- `vitest.config.ts`
  - Node environment, path aliases, coverage exclusions for generated code.
- `playwright.config.ts`
  - use local `npm run dev`, Chromium, screenshots/traces on failure.
- `tests/unit/donation-status.test.ts`
  - characterize `lib/donations/status.ts`.
- `tests/unit/haversine.test.ts`
  - characterize distance calculations and invalid coordinates.
- `tests/unit/volunteer-availability.test.ts`
  - move request parsing/validation into a pure helper if necessary and test it.
- `.env.example`
  - document `TEST_DATABASE_URL` without adding a real secret.

## Implementation steps

1. Preserve the current dirty tree in a user-approved commit or branch.
2. Add dependencies and scripts.
3. Configure Vitest so importing Prisma is not required for pure unit tests.
4. Extract only small pure validation helpers where a route currently prevents
   direct testing; do not refactor business behavior.
5. Add Playwright configuration with a harmless smoke test for the sign-in page.
6. Add a guard that refuses database integration tests unless
   `TEST_DATABASE_URL` is present and clearly non-production.
7. Run all quality gates and record any pre-existing failures separately.

## Acceptance criteria

- `npm run typecheck`, `npm run test`, and `npm run test:e2e` exist.
- Unit tests cover allowed/forbidden donation transitions and distance edge cases.
- A local Chromium smoke test starts the app and loads the sign-in flow.
- No test writes to the configured development or production database by default.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

## Rollback

Revert the configuration/test commit. No database rollback is needed.

## Risks

- Playwright can accidentally use real credentials/database data. Keep its base URL
  local and introduce seeded isolated data only in Plan 009.
- Importing server modules can instantiate Prisma. Prefer pure helpers in unit tests.

