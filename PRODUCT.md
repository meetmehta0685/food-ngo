# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred from the existing routes and README (the structured interview tool was unavailable in this session):

- Donors such as households, caterers, hotels, and event organizers reporting safe surplus food.
- Verified NGO partners accepting nearby rescue requests and coordinating delivery.
- Volunteer drivers receiving time-sensitive dispatch offers and completing pickups.

## Product Purpose

Food Rescue Network routes surplus food from donors to nearby NGOs and shelters before it spoils. Success means a donor can report food quickly, a nearby partner can claim it, and every handover is visible and verifiable.

## Positioning

The product combines proximity-based matching, volunteer dispatch, realtime status updates, map visibility, and pickup OTP verification in one rescue workflow.

## Operating Context

The primary workflow is time-sensitive and mobile-friendly: a donor reports portions, pickup timing, and location; up to three nearby NGO partners are notified; the first acceptance assigns the rescue; a volunteer is dispatched; and the pickup and delivery are tracked through status milestones and OTP confirmation.

## Capabilities and Constraints

- Role-based authentication for `DONOR`, `NGO`, and `VOLUNTEER` users.
- Donor reporting, NGO inbox and logistics console, volunteer dispatch console, tracking, notifications, and operational status APIs.
- MapLibre GL with OpenStreetMap, Prisma/Neon, Next.js App Router, React, and realtime events through Ably.
- Existing functional behavior, API routes, database schema, content, and local imagery must remain intact while the UI is redesigned.
- The UI must use shadcn/ui source components, global semantic design tokens, responsive layouts, accessible states, and the existing Phosphor icon library.

## Brand Commitments

- Existing product names used in the codebase: Food Rescue Network and Food Rescue HQ.
- Existing visual assets in `public/intro/` remain available for the experience.
- User-requested visual constraints: strictly shadcn/ui, global design tokens only, and best-practice implementation.

## Evidence on Hand

- `README.md` documents the implemented rescue flows and technical stack.
- `lib/landing/metrics.ts` provides live counts for active NGOs, donations, delivered donations, and meals delivered.
- `public/intro/` contains food donation, NGO matching, and delivery-tracking imagery.
- App routes cover public landing, authentication, donor, NGO, volunteer, tracking, and notification surfaces.

## Product Principles

- Make the next rescue action obvious.
- Reduce time between surplus and a confirmed match.
- Make every handoff legible and verifiable.
- Give each role a focused operational surface.
- Show impact without obscuring the work.

## Accessibility & Inclusion

This redesign will preserve semantic HTML, keyboard access, visible focus, readable contrast, responsive behavior, explicit form errors, and reduced-motion-friendly interactions across public and authenticated surfaces.
