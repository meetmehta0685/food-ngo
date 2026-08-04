# Plan 010: Add PostGIS Spatial Matching After MVP

**Status:** TODO  
**Priority:** P2  
**Scope:** M  
**Planned:** 2026-07-30  
**Base:** current tree after Plan 009

## Summary

Replace full-table volunteer distance calculations with indexed PostgreSQL spatial
queries once the vertical MVP is stable. This is an optimization, not a prerequisite
for accurate geofence evaluation of one active assignment.

## Dependencies

- Depends on: Plan 009 and confirmed PostgreSQL/PostGIS availability
- Blocks: none

## Required installation

No npm package. The database needs the PostGIS extension:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Stop before implementation if the database provider/plan does not support this.

## Scope

In scope:

- geography points and GiST indexes for volunteer/pickup/NGO positions;
- `ST_DWithin` eligibility and `ST_Distance` ranking;
- backfill and dual-read comparison;
- query plan/performance verification.

Out of scope:

- changing Ably, OTP, or state machines;
- routing/turn-by-turn navigation;
- replacing Leaflet.

## Files to change

- reviewed hand-written Prisma migration SQL
- `prisma/schema.prisma` spatial fields represented with supported/raw types
- `lib/matching/match-volunteers.ts`
- coordinate write services
- spatial integration tests
- operational migration notes

## Implementation steps

1. Confirm extension support on an isolated database.
2. Add nullable geography point columns and GiST indexes without dropping float
   coordinates.
3. Backfill valid coordinate rows and report invalid/null rows.
4. Dual-write float and geography values during migration.
5. Implement parameterized raw SQL using `ST_DWithin` for radius filtering and
   `ST_Distance` for ordering.
6. Run old Haversine and new PostGIS matching in shadow mode and compare results
   within a documented tolerance.
7. Switch reads only after correctness and `EXPLAIN ANALYZE` confirm index use.
8. Keep float fields through a rollback window; remove only in a later migration.

## Acceptance criteria

- Eligibility/ranking matches the current implementation within tolerance.
- Spatial index is used for realistic candidate counts.
- Invalid coordinates cannot enter spatial columns.
- Rollback to Haversine does not require data restoration.

## Verification

```bash
npx prisma validate
npx prisma generate
npm run lint
npm run typecheck
npm run test
npm run build
```

Also capture `EXPLAIN (ANALYZE, BUFFERS)` for the candidate query on representative
data.

## Rollback

Switch reads back to Haversine and stop dual-writing. Preserve new columns until
the rollback window closes.

## Risks

- Prisma spatial support may require raw SQL and hand-maintained migration details.
- Extension availability differs by PostgreSQL provider/plan.

