# EstateStay local deployment

This document covers local execution only. EstateStay was not deployed or hosted for this submission.

## Prerequisites

- Node.js 20.x
- npm
- Docker Desktop with Docker Compose

The verified local runtime used Node.js 20.20.2 and npm 10.8.2.

## Installation

```bash
npm install
cp .env.example .env
npm run db:generate
```

Populate `.env` locally. Do not commit it.

## Environment variable names

`.env.example` contains names only. Use local values; never place secrets in Git.

```env
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
OPENAI_API_KEY=
TEST_DATABASE_URL=
```

`DATABASE_URL` is used by the runtime Prisma client. `DIRECT_URL` is used by Prisma CLI operations through `directUrl` in `prisma/schema.prisma`. For local Docker PostgreSQL, both can point to the local database. `OPENAI_API_KEY` is optional; without it, deterministic enquiry fallback remains available.

## Local PostgreSQL

Start the project database:

```bash
docker compose up -d postgres
```

Apply the committed migration and seed data:

```bash
npx prisma migrate deploy
npm run db:seed
```

The seed is idempotent for room categories, daily rates, allotments, the demo staff user, promo code and sample enquiries. To reset only the local project database:

```bash
docker compose down -v
docker compose up -d postgres
npx prisma migrate deploy
npm run db:seed
```

## Start the application

Development mode:

```bash
npm run dev
```

Open `http://localhost:3000`.

Production build and local start:

```bash
npm run build
npm run start
```

The build command runs `prisma generate && next build`.

## Demo staff login

```text
Email: stay@estatestay.example
Password: estate2026
```

These credentials are created by `prisma/seed.ts` with a scrypt password hash. Change the password before any real operational use.

## Tests

Unit and database-backed tests:

```bash
npm test
npx vitest run
```

Static checks and production build:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Browser tests require the local seeded PostgreSQL database and configured environment variables:

```bash
npm run test:e2e
```

The checked-in Playwright configuration runs desktop and 390×844 mobile projects. The final audit verified 3 desktop and 3 mobile tests.

## Security and limitations

- `.env` and other local environment files are ignored by Git.
- No real payment is processed.
- OpenAI prompts and credentials remain server-side.
- No passport details are collected.
- Live Supabase/Vercel deployment was not performed for this submission.
- Real email/WhatsApp forwarding, production SSO, managed rate limiting and signed payment webhooks are future production work.
