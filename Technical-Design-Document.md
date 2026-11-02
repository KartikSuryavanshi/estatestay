# EstateStay — Technical Design Document

Repository URL: `https://github.com/example/estatestay`

Live application URL: Not deployed in this workspace.

## Product architecture

Next.js App Router provides the public experience, staff UI and API routes. TypeScript keeps domain types shared between services and UI. Tailwind tokens express the forest/ivory/olive hospitality palette. Prisma maps PostgreSQL data. A server-side AI service accepts only validated enquiry text and returns Zod-validated structured data; the deterministic classifier is used when OpenAI is unavailable.

## Database and inventory

The schema includes users, room categories, daily rates, website allotments, bookings, holds, nights, payments, promo codes, enquiries, messages and audit logs. Availability for a category/date is `website allotment - confirmed nights - active holds`. A stay consumes dates from check-in through the day before checkout. `BookingNight(roomCategoryId, date)` is unique. Hold/payment state transitions happen in a transaction; a conflicting night insert rolls back the entire reservation. Payment callbacks are idempotent through `callbackKey`.

## API design

Public routes expose availability, booking creation, simulated payment and enquiry submission. Admin routes expose dashboard data and are checked server-side for the staff cookie/role. Every write validates with Zod and returns safe error messages.

## AI classification

The server prompt should request category, confidence, extracted dates/guest counts/budget, owner and reply draft only. The response is validated before persistence. Confidence below the product threshold routes to `UNSORTED`. Complaints assign the General Manager. Drafts are never sent automatically and no model response may fabricate pricing or availability.

## UI decisions

Large editorial imagery, serif display typography, restrained color, thin rules and compact operational tables make the guest site feel like a resort brand and the staff site feel like an operating tool rather than a generic SaaS template. Mobile layouts collapse navigation and booking fields without hiding core actions.

## Security

Prisma parameterizes database queries, server routes validate all inputs, secrets are environment-only, the app does not collect passport details, and staff APIs are server-protected. A launch version must replace the demo cookie login with Auth.js, hash credentials, add CSRF/session hardening and managed rate limiting.

## Assumptions, limitations and cuts

The workspace does not include a live database, OpenAI key, payment gateway or deployment account, so preview fallback data and simulated payment are included. Real email/WhatsApp forwarding, calendar synchronization, refunds, tax invoice generation and a PDF build pipeline were deliberately cut from the take-home core. The next iteration should add those behind service interfaces and integration tests.
