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

## Environment variables

`.env.example` contains names only. Values must be supplied locally or through Vercel environment variables. Never commit `.env`.

Required in production:

- `DATABASE_URL` — Supabase shared pooler connection string for runtime traffic. For Supabase transaction pooling, append `pgbouncer=true` to the connection string as documented by Supabase.
- `DIRECT_URL` — Supabase direct connection string for Prisma CLI migrations.
- `NEXTAUTH_SECRET` — long random signing secret; never use the development value.
- `NEXTAUTH_URL` — the full HTTPS Vercel URL, for example `https://your-project.vercel.app`.

Optional:

- `OPENAI_API_KEY` — server-side key for live AI classification. If omitted, deterministic fallback classification remains available.

Test-only:

- `TEST_DATABASE_URL` — optional separate PostgreSQL database for integration tests.

`lib/prisma.ts` reads `DATABASE_URL` for runtime access. Prisma's `directUrl` in `prisma/schema.prisma` points CLI operations at `DIRECT_URL`. Therefore, use the pooled Supabase URL for `DATABASE_URL` and the direct Supabase URL for `DIRECT_URL`.

## Demo staff login

`stay@estatestay.example` / `estate2026`

The staff screen calls the server-side staff login endpoint. The seed account is stored with a scrypt password hash; change the demo password before production use.

## Tests

```bash
npm test
npm run build
npx vitest run
```

## Supabase setup

1. Create a Supabase project and open **Connect**.
2. Copy the shared pooler connection string into `DATABASE_URL`. Use transaction pooler mode for Vercel serverless traffic and add `pgbouncer=true` to the URL if it is not already present.
3. Copy the direct connection string into `DIRECT_URL`.
4. Set the variables locally, then run migrations and seed once:

```bash
export DATABASE_URL='your_supabase_pooled_url?pgbouncer=true'
export DIRECT_URL='your_supabase_direct_url'
export NEXTAUTH_SECRET='your_long_random_secret'
export NEXTAUTH_URL='https://your-project.vercel.app'

npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

The booking transaction uses PostgreSQL `SERIALIZABLE` isolation and `SELECT ... FOR UPDATE` inside one transaction. Supabase transaction pooling preserves the connection for the duration of a transaction, so these locks are valid. Do not run migrations through the transaction pooler; Prisma migrations use `DIRECT_URL`.

## Vercel setup

1. Import `KartikSuryavanshi/estatestay` into Vercel.
2. Use the Next.js framework preset and project root `.`.
3. Use these commands:

```text
Install command: npm install
Build command: npm run build
```

`npm run build` explicitly runs `prisma generate` before `next build`.

4. Add the production and preview environment variables listed above in **Project Settings → Environment Variables**.
5. Set `NEXTAUTH_URL` to the final HTTPS Vercel URL and redeploy after changing it.
6. Open the deployed URL and test the guest booking and `/staff` flows.

The application has no local filesystem writes, uses a Prisma singleton, and uses server-side API routes compatible with Vercel's Node.js runtime. OpenAI is called only from server code.

## Common deployment errors

- `P1001` or database timeout: confirm the Supabase host and password, use the pooler for `DATABASE_URL`, and ensure reserved password characters are URL-encoded.
- Prisma prepared-statement error: use Supabase transaction pooling with `pgbouncer=true`, or use session pooling instead of transaction pooling.
- Migration lock/session error: run `npx prisma migrate deploy` with the direct `DIRECT_URL`, never the transaction pooler URL.
- Staff login always returns 503: set a strong `NEXTAUTH_SECRET` and an HTTPS `NEXTAUTH_URL`, then redeploy.
- Empty dashboard: run `npm run db:seed` once against the Supabase database after migrations.
- AI uses fallback mode: verify `OPENAI_API_KEY` is set in the Vercel environment and redeploy. Never expose it as a `NEXT_PUBLIC_` variable.

## Safety and limitations

No passport details are collected. Payment is simulated and no card details are stored. The fallback AI never invents rates or availability and flags low-confidence messages as `UNSORTED`. Before real launch, add a queue worker for expired holds, a managed rate limiter, Auth.js/SSO, encrypted backups, retention policies and a real payment provider's signed webhook verification.
