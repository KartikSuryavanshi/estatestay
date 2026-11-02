# EstateStay deployment

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (Supabase is recommended)
- npm

## Local setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

### Reproducible local PostgreSQL

```bash
docker compose up -d postgres
# Populate DATABASE_URL, DIRECT_URL and NEXTAUTH_SECRET in .env first.
npx prisma migrate deploy
npm run db:seed
```

Reset only the project database with `docker compose down -v` followed by `docker compose up -d postgres`.

## Environment variable names

Only names belong in `.env.example`; values must be supplied locally or through Vercel/Supabase secrets.

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `OPENAI_API_KEY`

## Demo staff login

`stay@estatestay.example` / `estate2026`

The staff screen calls the server-side staff login endpoint. The seed account is stored with a scrypt password hash; change the demo password before production use.

## Tests

```bash
npm test
npm run build
npx vitest run
```

## Deployment

1. Create a Supabase PostgreSQL project and copy its pooled URL to `DATABASE_URL` and direct URL to `DIRECT_URL`.
2. Run `npx prisma migrate deploy` and `npm run db:seed` once against the production database.
3. Import the repository into Vercel, set the environment variable names above, and deploy.
4. Configure a production `NEXTAUTH_URL` and secret before launch.

## Safety and limitations

No passport details are collected. Payment is simulated and no card details are stored. The fallback AI never invents rates or availability and flags low-confidence messages as `UNSORTED`. Before real launch, add a queue worker for expired holds, a managed rate limiter, Auth.js/SSO, encrypted backups, retention policies and a real payment provider's signed webhook verification.
