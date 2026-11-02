# EstateStay — Technical Design Document

GitHub Repository: https://github.com/KartikSuryavanshi/estatestay

Live application URL: Not deployed by design for this submission.

## Executive summary

EstateStay is a full-stack direct-booking and enquiry-operations platform for a fictional luxury coffee-estate resort in Chikkamagaluru. The core slice is end-to-end: a guest searches database-backed availability, reserves a room, completes a simulated payment and receives a confirmation; staff authenticate, manage inventory and rates, operate enquiries and acknowledge persistent complaint alerts.

## Problem statement and assumptions

The resort currently depends heavily on OTAs and receives event enquiries across email, phone, social media and WhatsApp. EstateStay centralizes direct reservations and enquiry response work while protecting limited website allotment from overbooking.

Assumptions from the brief:

- The resort has 76 total keys, but website allotment is configured independently by room category and date.
- The supplied room categories and tariff data are representative fictional data.
- Payment is test-only and never processes real money.
- Email, WhatsApp and social integrations are simulated through enquiry records and staff actions.
- Guests do not submit passport details online.
- A custom signed staff cookie is sufficient for the take-home; a production launch would consider Auth.js/SSO and stronger operational controls.

## Architecture and technology choices

```text
Guest browser ───────┐
                     ├─ Next.js App Router pages and API routes
Staff browser ───────┘          │
                                ├─ Zod validation and server-side authorization
                                ├─ Booking/payment/enquiry services
                                ├─ OpenAI adapter with deterministic fallback
                                └─ Prisma ORM → PostgreSQL
```

- Next.js 15 App Router: one deployable web application with server-rendered pages and API routes.
- TypeScript: shared types and compile-time checks.
- Tailwind CSS and Lucide: restrained forest/ivory hospitality visual system.
- Prisma 5 and PostgreSQL: relational constraints, transactions, indexes and migration workflow.
- Vitest and Playwright: domain, database and browser verification.
- OpenAI JSON mode plus Zod validation: structured enquiry triage with safe fallback.

## Database model

The schema contains `User`, `RoomCategory`, `DailyRate`, `WebsiteAllotment`, `Booking`, `BookingHold`, `BookingNight`, `Payment`, `PromoCode`, `Enquiry`, `EnquiryMessage`, `ComplaintAlert` and `AuditLog`.

Important constraints and indexes:

- Unique staff/guest email.
- Unique room category/date for daily rates and allotments.
- Unique booking reference and optional idempotency key.
- Unique booking/category night combination.
- Unique payment callback key.
- Unique complaint alert per enquiry.
- Indexes on booking dates, booking nights, enquiry category/status and allotment dates.

## Main user journeys

### Guest booking

1. Guest enters check-in, checkout and adults on the homepage.
2. The rooms page queries live availability for each night when PostgreSQL is configured.
3. Guest selects a room, enters details and sees a three-step checkout.
4. Server-side booking logic creates a temporary hold and `BookingNight` records.
5. Simulated payment returns success, failure or cancellation.
6. Only successful payment changes the booking to `CONFIRMED`; confirmation is then displayed.

### Staff operations

1. Staff submits credentials to `/api/auth/staff`.
2. Passwords are verified against the seeded scrypt hash.
3. A signed HttpOnly cookie is issued for eight hours.
4. Every admin API checks the cookie signature, expiry and staff role.
5. Staff view dashboard metrics, reservations, rates/allotments, enquiries and complaint alerts.

## Booking, allotment and payment lifecycle

Inventory uses the half-open interval `[checkIn, checkOut)`, so checkout day is not consumed. For each night:

```text
available = website allotment - confirmed booking nights - active holds
```

The booking transaction:

1. Expires stale holds.
2. Loads configured rates and allotments for every requested night.
3. Locks matching `WebsiteAllotment` rows with `SELECT ... FOR UPDATE`.
4. Runs at PostgreSQL `SERIALIZABLE` isolation.
5. Counts active booking nights and rejects any full night.
6. Calculates each night from its configured base rate and GST rate.
7. Atomically creates the booking, hold and all booking-night rows.
8. Retries serialization conflicts up to three times.

The unique callback key makes payment callbacks idempotent. Failed and cancelled payments mark the booking cancelled and release the active hold. A callback key cannot be reused for a different booking.

## Authentication and authorization

Staff passwords are scrypt-hashed. The custom session token contains a staff user ID, role and expiry, and is HMAC-signed by `NEXTAUTH_SECRET`. The cookie is HttpOnly, SameSite=Lax and Secure when `NEXTAUTH_URL` is HTTPS. Admin routes reject missing, invalid, expired or non-staff sessions server-side. The application does not rely on client-side credential checks.

## AI classification architecture

The server sends only validated enquiry text to OpenAI and requests JSON containing category, confidence, extracted event date, guest count, nights, budget, assigned team and reply draft. Zod validates the response. Confidence below 0.65 is routed to `UNSORTED`.

Complaints are assigned to the General Manager and create a persistent, unique complaint alert. Staff can edit classification, assignment, status and drafts. AI drafts are never sent automatically, and the model is explicitly prohibited from inventing prices or availability. Price or availability claims must come from database-backed services.

If `OPENAI_API_KEY` is absent or the API fails, deterministic keyword classification remains operational and marks the extraction as fallback mode.

## UI and design decisions

The public experience uses warm ivory, forest green, olive and muted clay with editorial serif headings, thin rules and large resort imagery. Booking controls sit directly against the hero. Staff pages use a separate operations layout so the public navigation cannot overlay the dashboard. Tables scroll safely on narrow screens, forms stack on mobile, and loading, empty, error and success states are present in the core flows.

## Security and privacy

- Environment files are ignored; `.env.example` contains names only.
- Prisma parameterizes database queries.
- Zod validates API writes.
- Staff APIs are server-authorized.
- OpenAI credentials remain server-side.
- No passport details or unnecessary sensitive personal information are collected.
- Payment is simulated and no card data is persisted.
- Production follow-ups include managed rate limiting, CSRF hardening, retention controls, encrypted backups and a real provider's signed webhook verification.

## Verification results

Verified locally on Node.js 20.20.2 with Docker PostgreSQL on port 5433:

- Prisma client generation: pass.
- Prisma schema validation: pass.
- PostgreSQL migration status: up to date.
- Seed: executed successfully and repeated without duplicate-key failure.
- Vitest: 6 files, 16 tests passed.
- TypeScript: pass.
- ESLint: pass; Next reports the expected `next lint` deprecation notice.
- Production build: pass.
- Playwright desktop: 3 of 3 passed.
- Playwright mobile viewport at 390×844: 3 of 3 passed, including guest booking and staff operations.
- Real PostgreSQL concurrency test: exactly one booking succeeded for a last-villa scenario.
- Failed payment hold release and duplicate payment callback behavior: passed.
- Live OpenAI call: not run because no API key was configured during verification; deterministic fallback was tested.
- Live Supabase/Vercel deployment: not performed by design.

## Dependency audit

The final `npm audit` reported 0 critical, 4 high and 17 moderate advisories across production and development dependencies. Production-only audit reported 0 critical, 1 high and 1 moderate advisory in the Next/PostCSS chain. No `npm audit fix --force` was run. The remaining automatic remediation would require major dependency changes and was deliberately not applied without a separate compatibility sprint.

## Deliberately excluded features

Real payment processing, email/WhatsApp forwarding, calendar synchronization, refunds, tax invoices, guest self-service account management, production SSO, automated hold workers and a live deployment were cut to keep the direct booking, inventory and enquiry slice reliable.

## Future improvements

Add a queue worker for hold expiry, real webhook signature verification, managed rate limiting, SSO/MFA, observability, retention automation, event proposal templates, calendar integrations and a production Supabase/Vercel environment with live smoke tests.
