# Food Rescue Network

Next.js App Router platform for routing leftover food from donors to nearby NGOs with realtime tracking and milestone confirmations.

## Implemented flows

- Role-based auth (`DONOR`, `NGO`) with `next-auth` credentials provider
- Donor donation reporting with map pin selection
- Top-3 nearest NGO matching using distance-based ranking
- NGO inbox accept/decline workflow (first acceptance wins)
- End-to-end delivery lifecycle tracking
- Shared donor/NGO tracking page with map + immutable timeline
- In-app notifications + toast confirmations at `ACCEPTED` and `DELIVERED`
- Server-Sent Events (SSE) for live updates

## Tech stack

- Next.js 16 (App Router)
- React 19
- Prisma + Vercel Postgres (Neon)
- Auth.js (`next-auth`)
- shadcn/ui components (installed via `npx`)
- React-Leaflet + OpenStreetMap
- Toast-based confirmation UX (no external email provider)

## Environment

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Required:

- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

Optional fallback:

- `DATABASE_URL` (for local/non-Vercel databases)

## Development

Install dependencies and run:

```bash
npm install
npm run db:generate
npm run dev
```

## Database migrations

```bash
npm run db:migrate
```

For production:

```bash
npm run db:deploy
```

## Build checks

```bash
npm run lint
npm run build
```
