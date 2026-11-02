# EstateStay

EstateStay is a premium resort booking and AI enquiry operations application for a fictional coffee estate in Chikkamagaluru.

## What is included

- Responsive luxury public site with date/guest search and room inventory presentation.
- Three-step checkout with GST-aware pricing, promo-ready price calculation, simulated test payment and confirmation printing.
- Prisma/PostgreSQL schema covering room categories, daily rates, website allotments, bookings, holds, payment callbacks, enquiries and audit logs.
- Staff operations dashboard with protected admin API, reservations, rates/allotment view and AI-assisted enquiry inbox.
- Deterministic enquiry classification fallback for environments without `OPENAI_API_KEY`.
- Vitest coverage for inventory arithmetic, multi-night stays, checkout semantics, GST and fallback classification.
- Dockerized PostgreSQL integration coverage for staff authentication, rate validation, payment idempotency and concurrent last-room booking.

## Run locally

See [deployment.md](./deployment.md). The visual public routes also run in fallback mode without a database; live reservation persistence requires PostgreSQL and Prisma migrations.

## Architecture notes

Inventory is represented as one `BookingNight` per room category/date. A booking uses the half-open date interval `[checkIn, checkOut)`. The database unique constraint on `(roomCategoryId, date)` and a transaction that creates all night rows atomically prevents partial or concurrent overbooking. Payment callbacks use a unique callback key and are idempotent.

With `DATABASE_URL` configured, availability, booking holds, payment transitions, dashboard metrics, rates/allotments and enquiries use PostgreSQL. Without it, public preview routes explicitly return `preview-fallback` data and do not claim persistence. The payment gateway is simulated and never processes real money. Live OpenAI behavior requires `OPENAI_API_KEY`; deterministic fallback remains available without it.
