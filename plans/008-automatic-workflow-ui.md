# Plan 008: Build the Automatic Role Workflows

**Status:** TODO  
**Priority:** P0  
**Scope:** L  
**Planned:** 2026-07-30  
**Base:** current tree after Plan 007

## Summary

Connect the rescue services to clear donor, NGO, and volunteer experiences. Remove
the manual NGO “Next action” state progression for volunteer deliveries; show the
system-driven next requirement instead.

## Dependencies

- Depends on: Plans 003–007
- Blocks: full E2E in Plan 009

## Scope

In scope:

- NGO dispatch/receipt flow;
- volunteer offer/tracking/OTP flow;
- donor tracking/OTP flow;
- live map and timeline;
- loading, denial, stale-location, and failure states;
- accessible mobile behavior.

Out of scope:

- redesigning unrelated pages;
- native mobile/background tracking;
- changing map renderer.

## Role experiences

NGO:

- choose self-pickup or request volunteer;
- see matching/offer status and live volunteer progress;
- confirm receipt only at `ARRIVED_AT_NGO`;
- see a recovery action when no volunteer is available.

Volunteer:

- go online with current location;
- accept/reject a countdown offer;
- grant location permission and see tracking health;
- enter donor OTP at pickup;
- see destination and completion confirmation.

Donor:

- see assigned NGO/volunteer progress;
- see volunteer live location only after assignment acceptance;
- reveal/regenerate pickup OTP at arrival;
- see immutable timeline and final delivery state.

## Files to change

- `app/volunteer/**`
- `app/ngo/deliveries/[id]/**`
- donor tracking page/components
- shared rescue status/timeline/map components
- role-specific navigation and notification links
- component/E2E tests

## Implementation steps

1. Build a shared assignment snapshot view model; do not duplicate transition
   logic in React.
2. Render state-specific actions strictly from server-provided allowed actions.
3. Replace volunteer-delivery “Next action” buttons with status explanations:
   waiting for volunteer, en route, waiting for OTP, en route to NGO, waiting for
   NGO confirmation.
4. Keep manual controls only for explicit human proofs: volunteer offer decision,
   OTP submission, NGO receipt confirmation, cancellation/recovery.
5. Keep map containers at a fixed responsive height so adjacent cards never stretch
   them.
6. Apply Ably events incrementally, then refetch on sequence gaps.
7. Add clear geolocation permission, accuracy, offline, and stale tracking states.
8. Confirm that self-pickup donations continue using the current workflow.

## Acceptance criteria

- No manual status-forward button can bypass automatic volunteer delivery states.
- The three roles see a consistent status within realtime latency.
- Only authorized human proofs are actionable.
- The map size remains stable as neighboring content changes.
- Mobile viewport supports one-handed volunteer use and visible tracking health.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Manually verify the workflow in three separate signed-in browser contexts at
desktop and mobile widths.

## Rollback

Feature-flag volunteer delivery UI off and retain NGO self-pickup. Do not remove the
new data because active assignments may need audit visibility.

## Risks

- Client-derived state can drift. Allowed actions must come from server state.
- Hiding recovery paths can strand a rescue; cancellation/self-pickup fallback must
  remain explicit.

