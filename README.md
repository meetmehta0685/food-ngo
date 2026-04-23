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

## Deploy on Vercel

1. Import this repository in Vercel.
2. Add environment variables from `.env.example` in the Vercel project settings:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `DATABASE_URL` (optional fallback)
   - `NEXTAUTH_URL` (set this to your production domain)
   - `NEXTAUTH_SECRET`
3. Keep the Vercel build command as default (`npm run build`).
4. Run migrations before first production traffic:

```bash
npm run db:deploy
```

If you want a single command that includes migrations + build in non-Vercel environments, run:

```bash
npm run build:prod
```

## Build checks

```bash
npm run lint
npm run build
```
