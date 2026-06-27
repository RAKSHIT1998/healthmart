# Medicare Medical Store

> Your trusted pharmacy delivered within minutes.

A production-grade pharmacy e-commerce platform: customer storefront, internal operations
dashboard, REST API, and a MARG ERP integration layer. Built as a TypeScript monorepo.

## Project status: Phase 1 + Phase 2a

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

**Explicitly out of scope still** (see [the plan](#roadmap--phase-2b) below): doctor video/audio
consultation, the health blog CMS, live driver GPS tracking, multi-branch admin UI, and a
load-testing/index-tuning pass for true 100k-customer scale. The data model already has room for
some of these (e.g. `Blog`/`BlogComment` collections exist), but the UI and business logic for
them have not been built.

**Integration honesty note:** all third-party integrations (Cashfree, MSG91, Resend, Cloudinary,
Firebase, Google Maps) are real SDK/API client code, fully wired end-to-end and driven entirely by
environment variables — not mocked. They start working the moment real credentials are added to
`.env`. MARG ERP has no public documented API, so this repo ships two fully working adapters (CSV
import, authenticated webhook receiver) plus a typed API-client skeleton ready for field-mapping
once a real Marg Compusoft API contract is available — switching modes is a one-line env var
change, not a rewrite (see [MARG Integration](#marg-erp-integration)).

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

Coverage includes: concurrent-reservation never-oversell guarantees, FIFO batch allocation/commit/
restore, the order status state machine (including GST invoice generation on delivery), cart
pricing and coupon discount math, OTP auth + refresh token rotation/reuse-detection, and the
referral/gift-card/flash-sale promotions logic.

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
`ReferralReward`, `GiftCard`, `FlashSale`.

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

## Roadmap / Phase 2b

Tracked as explicitly deferred, not forgotten:

- Doctor video/audio consultation (appointment booking + a WebRTC provider integration)
- Full Health Blog CMS authoring UI + public blog pages + comments
- Live driver GPS tracking (sockets) + route optimization + signature proof-of-delivery
- Advanced analytics: heatmaps, repeat-customer/retention cohorts, sales forecasting
- Multi-pharmacy/branch admin UI, employee permission matrix, backup/restore tooling
- CDN tuning
- Load testing and index-tuning pass for true 100k-customer scale

Shipped in Phase 2a (no longer on this list): automated test suite, Redis caching layer, WhatsApp
notifications, referral program, gift cards, flash-sale scheduler.

## License

Proprietary — all rights reserved.
