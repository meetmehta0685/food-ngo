# Food Rescue Network Resources

## Knowledge

- [Local README](./README.md)  
  The project's own feature list, environment variables, worker commands, migrations, and quality checks. Use first for the system's intended behavior.
- [Local product brief](./PRODUCT.md)  
  The product purpose, actors, operating context, and design constraints. Use when connecting code decisions to user value.
- [Local data model](./prisma/schema.prisma)  
  The authoritative vocabulary for users, donations, NGO candidates, rescue assignments, events, notifications, and live events.
- [Local donation service](./lib/donations/service.ts)  
  The main application-level workflow for creating donations, accepting NGO matches, and updating donation status.
- [Local rescue service](./lib/rescue/service.ts)  
  The main workflow for volunteer offers, expiry/reassignment, geofence arrival, OTP pickup, location updates, and delivery confirmation.
- [Next.js App Router guide](https://nextjs.org/docs/app/getting-started)  
  Official explanation of the App Router, server/client components, route handlers, layouts, and data fetching. Use for framework vocabulary.
- [Next.js Route Handlers](https://nextjs.org/docs/app/guides/backend-for-frontend)  
  Official guidance for request handlers under `app/**/route.ts`, the boundary used by this project's JSON APIs.
- [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)  
  Official explanation of atomic and interactive transactions. Use when explaining why related state, audit events, notifications, and outbox rows are written together.
- [NextAuth.js callbacks](https://next-auth.js.org/configuration/callbacks)  
  Official v4 documentation for copying user identity and role from a JWT into the session. Use with `lib/auth/options.ts`.
- [Ably JavaScript Pub/Sub](https://ably.com/docs/getting-started/javascript)  
  Official guide to channels, publishing, subscribing, and presence. Use with the database-backed live-event outbox in this repository.
- [MDN Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)  
  A trusted web-platform reference for one-way server-to-browser event streams. Use when comparing the fallback `/api/stream` path with Ably.
- [MDN Geolocation `watchPosition()`](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition)  
  A trusted web-platform reference for browser location tracking and permission requirements. Use with the volunteer location tracker.

## Wisdom (Communities)

- No community has been selected yet. Later, a placement mentor, project teammate, or moderated developer community can be used to practice explaining the architecture and reviewing trade-offs.

## Gaps

- We have not yet established the user's prior level in JavaScript, React, TypeScript, SQL, or system design. The next lesson should adapt after the user completes the first retrieval exercise.
