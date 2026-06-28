# Medicare Medical Store

> Your trusted pharmacy delivered within minutes.

A production-grade pharmacy e-commerce platform: customer storefront, internal operations
dashboard, REST API, and a MARG ERP integration layer. Built as a TypeScript monorepo.

## Project status: Phase 1 + Phase 2a + Phase 2b + Phase 2c + Phase 2d

This is a genuinely large platform (storefront + 5 internal role panels + ERP sync + telehealth +
live GPS tracking + multi-pharmacy support, etc.) — too large to build to full production maturity
in a single pass.

**Phase 1** covers the complete revenue-critical path end to end: auth, catalog/search, cart,
checkout, payments, order fulfillment, inventory (with FIFO batching and a never-oversell
guarantee), GST invoicing, prescriptions with OCR, the full MongoDB schema, and the MARG ERP
adapter architecture (CSV import + webhook receiver, both real and working).

**Phase 2a** hardens and extends that foundation: an automated Jest/Supertest test suite covering
the inventory engine, order state machine, cart/coupon pricing, and auth/token rotation; a Redis
cache-aside layer on catalog/search/dashboard reads; WhatsApp order notifications via MSG91; and a
promotions module (referral program, gift cards, flash sales) wired into both frontends.

**Phase 2b** adds the remaining major modules: live driver GPS tracking over Socket.IO with ETA and
photo/signature proof-of-delivery; multi-branch admin (branch CRUD, an employee permission matrix
derived directly from the route guards, and CLI backup/restore tooling); a full health blog CMS
(authoring UI + public pages + comments, SEO'd); and doctor telehealth (appointment booking with
Cashfree payment, Agora video/audio consultation rooms, and post-consult prescription PDFs).

**Phase 2c** rounds out day-to-day operability: an interactive Leaflet/OpenStreetMap location
picker (click-to-pin + search, no Google Maps key required) on both the customer address form and
the admin branch form, replacing blind "use my current GPS position" capture; a unified "Add
Product" flow that creates a medicine and its opening stock in one step, plus a paginated "All
Stock" view and a stock movement audit trail across all branches; and a working MARG ERP "plugin"
— admins can upload a Marg CSV/XLSX export directly from the dashboard and have it parsed and
applied immediately, independent of the configured sync mode — alongside a new Reports page
(sales, GST, stock, expiry — viewable or CSV-exportable).

**Phase 2d** closes out the two gaps Phase 2c's audit explicitly flagged as missing: a full
post-delivery returns/refunds workflow (7-day window, prescription items excluded, partial-item
returns, stock restoration, refund to wallet or back to the original Cashfree payment, customer +
admin UI) and per-channel notification preferences (SMS/email/push/WhatsApp opt-out on the profile
page, actually enforced in the notification dispatch path, not just cosmetic).

**Explicitly out of scope still** (see [the plan](#roadmap--phase-3) below): a load-testing and
index-tuning pass validated against real traffic, and the deeper analytics (heatmaps, retention
cohorts, sales forecasting) that need real usage data to be meaningful.

**Integration honesty note:** all third-party integrations (Cashfree, MSG91, Resend, Cloudinary,
Firebase, Google Maps, Agora) are real SDK/API client code, fully wired end-to-end and driven
entirely by environment variables — not mocked. They start working the moment real credentials are
added to `.env`. MARG ERP has no public documented API, so this repo ships two fully working
adapters (CSV import, authenticated webhook receiver) plus a typed API-client skeleton ready for
field-mapping once a real Marg Compusoft API contract is available — switching modes is a one-line
env var change, not a rewrite (see [MARG Integration](#marg-erp-integration)).

## Tech Stack

| Layer | Technology |
|---|---|
| Customer storefront | Next.js 15, React 19, TypeScript, TailwindCSS, Radix UI primitives, Framer Motion, TanStack Query, Zustand |
| Internal dashboard | Next.js 15, React 19, TypeScript, TailwindCSS, Recharts, TanStack Query, Zustand |
| Backend API | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB (Atlas in production) |
| Auth | JWT access + rotating refresh tokens, OTP login (customers), email/password (staff) |
| Storage | Cloudinary |
| Payments | Cashfree |
| SMS / OTP | MSG91 |
| Email | Resend |
| Push notifications | Firebase Cloud Messaging |
| Maps | Google Maps (Geocoding + Distance Matrix) |
| Video/audio consultation | Agora RTC (Web SDK + server-side token generation) |
| Real-time | Socket.IO (live driver location, order status, driver-assigned push events) |
| ERP integration | MARG (CSV / webhook / API adapter pattern) |
| Deployment | Vercel (web, dashboard) · Railway (api) · MongoDB Atlas (database) |

## Monorepo Layout

```
healthmart/
  apps/
    api/         Express + TypeScript backend (REST API, Swagger docs, cron jobs)
    web/         Customer storefront (Next.js)
    dashboard/   Internal panel for Admin/Manager/Pharmacist/Inventory Manager/Delivery Boy
  packages/
    shared/      Shared TypeScript types, enums, zod DTOs, and constants used by all 3 apps
  docker-compose.yml   Local Mongo + Redis + API for development
  postman_collection.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- A MongoDB instance (local via Docker, or a MongoDB Atlas connection string)
- npm 10+ (this repo uses npm workspaces — no need for pnpm/yarn)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy each `.env.example` to `.env` and fill in real values as you get them:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/dashboard/.env.example apps/dashboard/.env.local
```

At minimum, `apps/api/.env` needs `MONGO_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` to
boot. Everything else (Cashfree, MSG91, Resend, Cloudinary, Firebase, Google Maps, MARG) degrades
gracefully in development — missing keys log a warning and no-op instead of crashing the server.

### 3. Start MongoDB (and Redis, for later phases)

```bash
docker compose up -d mongo redis
```

Or point `MONGO_URI` at a MongoDB Atlas cluster instead.

### 4. Seed initial data

Creates a main branch, an admin user (`ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` from `.env`), a
handful of categories, and manufacturers:

```bash
npm run seed
```

### 5. Run everything in development

```bash
npm run build:shared   # build the shared package once (or `npm run dev` inside packages/shared to watch)
npm run dev:api         # http://localhost:5000  (Swagger at /api/docs)
npm run dev:web          # http://localhost:3000  (customer storefront)
npm run dev:dashboard    # http://localhost:3001  (internal panel — log in with the seeded admin)
```

## Testing

```bash
cd apps/api
npm test
```

By default this spins up an ephemeral in-memory MongoDB (`mongodb-memory-server`) — no external
database needed. In sandboxes/CI runners where outbound binary downloads are blocked, point
`TEST_MONGO_URI` at any reachable MongoDB server instead (the suite creates a uniquely-named,
disposable database per run and drops it on teardown — it never touches your dev database):

```bash
TEST_MONGO_URI="mongodb://localhost:27017" npm test
```

## Load Testing

`apps/api/loadtest/browse.k6.js` is a [k6](https://k6.io/docs/get-started/installation/) script
covering read-heavy public storefront traffic (search, product detail, category browsing) —
ramping to 200 concurrent virtual users with p95 latency and error-rate thresholds. It's
deliberately scoped to unauthenticated endpoints, since load-testing the checkout flow needs a way
to mint test sessions without real SMS OTP delivery; the inventory engine's correctness under
concurrency (the never-oversell guarantee) is proven separately — and more precisely — by the Jest
test in `tests/inventory.test.ts` (25 parallel reservation attempts against 10 units of stock,
asserting exactly 10 succeed). This script measures throughput/latency, not correctness, and its
thresholds have not yet been validated against a real staging deployment — see
[Roadmap](#roadmap--phase-3).

```bash
k6 run apps/api/loadtest/browse.k6.js
k6 run -e BASE_URL=https://api.medicaremedicalstore.com/api/v1 apps/api/loadtest/browse.k6.js
```

Coverage includes: concurrent-reservation never-oversell guarantees, FIFO batch allocation/commit/
restore, the order status state machine (including GST invoice generation on delivery), cart
pricing and coupon discount math, OTP auth + refresh token rotation/reuse-detection, the
referral/gift-card/flash-sale promotions logic, and telehealth (doctor slot availability, the
double-booking guard, video-token access control, and appointment cancellation).

## API Documentation

- Swagger UI: `http://localhost:5000/api/docs`
- Raw OpenAPI JSON: `http://localhost:5000/api/docs.json`
- Postman collection: [`postman_collection.json`](./postman_collection.json) at the repo root

## Architecture Notes

### Backend (`apps/api`)

Clean/layered architecture: `routes` → `controllers` → `services` (all business rules live here)
→ `repositories` (repository pattern over Mongoose) → `models`. Cross-cutting concerns
(`middlewares`, `integrations`, `jobs`, `utils`) sit alongside. Request bodies are validated with
zod schemas shared from `packages/shared` — the same schemas double as the contract frontend forms
validate against.

### Inventory engine (never oversell)

- Stock reservation uses an atomically-guarded MongoDB update (`$expr` comparing
  `totalQuantity - reservedQuantity` against the requested quantity) — no read-then-write race.
- Reservations are held for `CHECKOUT_CONFIG.RESERVATION_HOLD_MINUTES` (default 15) while payment
  completes; a cron job (`reservationRelease.job.ts`) sweeps expired holds every minute and releases
  the stock.
- Batches are consumed FIFO (oldest expiry first) at pack time, not at checkout time — checkout only
  holds a reservation; the actual batch deduction happens when an order moves to `packed`.

### MARG ERP Integration

Every integration mode implements `IMargAdapter` (`apps/api/src/integrations/marg/IMargAdapter.ts`):

- **`MargCsvAdapter`** — real, working. Watches `MARG_CSV_WATCH_DIR` for CSV/XLSX exports
  (`medicine*.csv`, `stock*.csv`, `supplier*.csv`, `customer*.csv`), maps Marg's common export
  column names onto canonical payloads, and writes outbound sale-invoice/return data as JSON files
  for Marg's own import routine to pick up.
- **`MargWebhookAdapter`** — real, working. `POST /api/v1/marg/webhook`, HMAC-SHA256 signed via
  `X-Marg-Signature`, processes push payloads through the same upsert pipeline as the CSV adapter.
- **`MargApiAdapter`** — typed client skeleton against `MARG_API_BASE_URL`. Marg Compusoft has no
  single public REST spec; this is best-effort scaffolding to fill in once real API
  docs/credentials are obtained.

Switching modes is one environment variable: `MARG_INTEGRATION_MODE=csv|webhook|api|disabled`. No
application code changes — `MargSyncService` and the webhook controller only ever depend on the
`IMargAdapter` interface.

### Database schema

All collections from the spec are modeled with full Mongoose schemas in `apps/api/src/models/`:
`User`, `RefreshToken`, `Otp`, `Address`, `Branch`, `Category`, `Manufacturer`, `Supplier`,
`Medicine`, `Batch`, `Inventory`, `InventoryMovement`, `Cart`, `Coupon`, `CouponRedemption`,
`Order`, `Invoice`, `Wallet`, `WalletTransaction`, `Review`, `Wishlist`, `Prescription`,
`Notification`, `Blog`, `BlogComment`, `Driver`, `AuditLog`, `MargSyncLog`, `AnalyticsSnapshot`,
`ReferralReward`, `GiftCard`, `FlashSale`, `Doctor`, `Appointment`.

### Live driver tracking & proof of delivery

Socket.IO is mounted on the same HTTP server as the REST API (`apps/api/src/realtime/socket.ts`).
Customers authenticate the socket handshake with their existing JWT and join an `order:<id>` room
(ownership-checked server-side before the join is allowed); the server pushes `driver:location`,
`order:status`, and `order:driver-assigned` events into that room. Drivers don't need a socket
client at all — they keep reporting location via the existing `PATCH /drivers/me/location` REST
endpoint (now with `watchPosition`-driven continuous updates in the dashboard), and the backend
fans each update out over the socket. ETA is computed via Google's Distance Matrix API when a
driver is assigned. On delivery, the driver can attach a photo (camera capture) and a canvas-drawn
customer signature, uploaded to Cloudinary and stored on the order.

### Multi-branch admin, permissions, and backup/restore

Branches are full CRUD (`/catalog/branches`, Admin-only for writes), with exactly one branch
flagged `isMainBranch` at a time (enforced in `catalog.service.ts`, not just the UI). The Employee
Permission Matrix (`/permissions` in the dashboard) is rendered directly from the same `NAV_ITEMS`
array that drives the sidebar — there's no separately-maintained permissions document to drift out
of sync. Backup/restore (`npm run backup` / `npm run restore -- <dir> --confirm`) are deliberately
CLI-only, not HTTP endpoints: an API route that can export or overwrite arbitrary collections is a
significant attack surface for very little benefit over an operator running the script directly.
Restore upserts by `_id` (merge, not wipe-then-insert) so a stale or partial backup can never
silently delete data created after the backup was taken.

### Health Blog CMS

Full CRUD (`/blog`) with drafts (`isPublished`), categories, tags, view counts, and moderated
comments. Public list/detail pages are server components for SEO (metadata, Open Graph, JSON-LD
`Article` schema) with a client-side comment thread layered on top.

### Doctor telehealth

- **Booking**: a doctor's `weeklySchedule` (recurring day-of-week windows) is expanded into concrete
  slot times for a given date, minus whatever's already booked. A partial unique index on
  `{doctorId, scheduledAt}` (live statuses only) makes double-booking impossible at the database
  level, while a cron job (`appointmentPaymentRelease.job.ts`) cancels abandoned pending-payment
  bookings after 15 minutes — same pattern as the inventory reservation release job.
- **Payment**: appointments reuse the same `createCashfreeOrder`/webhook flow as pharmacy orders.
  Cashfree order IDs are prefixed (`APT-` vs `MMS-`) so `payment.service.ts` can route one webhook
  to the right domain without an extra lookup table.
- **Video/audio**: `apps/api/src/integrations/agora.ts` generates a per-user Agora RTC token scoped
  to the appointment's channel; both frontends share an (independently-built, since there's no
  shared UI package) `VideoCallRoom` component using `agora-rtc-sdk-ng`. A patient can only fetch a
  token if they're a participant on that appointment and within a 10-minutes-before to 60-minutes-
  after join window.
- **Prescription**: completing a consultation generates a PDF (`integrations/pdf/consultationPdf.ts`,
  pdf-lib) with the diagnosis and prescribed medicines, uploaded to Cloudinary for the patient to
  download — independent of the pharmacy's OCR-based `Prescription` model, since a doctor-issued
  prescription has a different lifecycle and owner.

### Caching (Redis)

`apps/api/src/utils/cache.ts` exposes a `getOrSetCache(key, ttlSeconds, fetcher)` cache-aside
helper used on category/manufacturer/branch listings, medicine search and detail, and dashboard
metrics. It degrades transparently when `REDIS_URL` is unset — every call falls straight through
to `fetcher()`, so caching is strictly a performance optimization, never a correctness dependency.
Live stock availability is always read fresh (never cached) so "in stock" filtering can't go stale.

### Promotions module

- **Referrals**: every user can generate a unique `referralCode` (`GET /promotions/referrals/my-code`).
  A new user applies a friend's code once (`POST /promotions/referrals/apply`); both sides are
  credited to their wallets — but only on the referee's *first delivered* order, not on placement,
  so a cancelled or fraudulent order can't be farmed for credit (see `rewardReferralOnFirstDelivery`
  in `order.service.ts`).
- **Gift cards**: admins issue codes (`POST /promotions/gift-cards/issue`); customers redeem them
  straight into their wallet balance (`POST /promotions/gift-cards/redeem`), reusing the existing
  wallet-as-payment-method flow at checkout rather than adding a separate payment path.
- **Flash sales**: admin-managed time-boxed price overrides per medicine. `cart.service.ts`'s
  `computeCartTotals` — the single function that decides what a customer is actually charged —
  looks up active flash-sale pricing on every call, so the price shown on a product card and the
  price charged at checkout can never disagree.

## Deployment

### Backend → Railway

`apps/api/railway.json` configures a Dockerfile build. In the Railway service settings, point the
build context at the repo root (the Dockerfile expects to `COPY` `packages/shared` alongside
`apps/api`). Set all environment variables from `apps/api/.env.example` in the Railway dashboard.

### Frontends → Vercel

Both `apps/web` and `apps/dashboard` have a `vercel.json` that builds `packages/shared` first, then
the app itself, from the monorepo root. Set the Vercel project's **Root Directory** to `apps/web`
or `apps/dashboard` respectively, and configure `NEXT_PUBLIC_API_URL` to point at the deployed API.

### Database → MongoDB Atlas

Point `MONGO_URI` at an Atlas connection string. Atlas clusters run as replica sets by default,
which is compatible with everything in this codebase (no multi-document transactions are used —
reservations rely on atomically-guarded single-document updates instead).

## Roadmap / Phase 3

Tracked as explicitly deferred, not forgotten:

- Load testing and index-tuning pass validated against real, sustained traffic (a synthetic k6
  script is included — see below — but real capacity numbers need a real run against staging)
- Advanced analytics that need real usage data to be meaningful: heatmaps, repeat-customer/
  retention cohorts, sales forecasting
- CDN tuning
- Multi-stop delivery route optimization (today's ETA is single-destination distance/duration, not
  a multi-order routing solver)

Shipped in Phase 2a (automated test suite, Redis caching layer, WhatsApp notifications, referral
program, gift cards, flash-sale scheduler), Phase 2b (live driver GPS tracking + proof of
delivery, multi-branch admin + permission matrix + backup/restore, full blog CMS, doctor
telehealth with video/audio + payments + prescriptions), Phase 2c (location picker UI,
unified product+stock creation, inventory movement audit trail, MARG CSV upload UI, GST/sales/
stock/expiry reports), and Phase 2d (returns/refunds workflow, notification preferences) — no
longer on this list.

## License

Proprietary — all rights reserved.
