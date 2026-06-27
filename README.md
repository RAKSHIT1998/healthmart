# Medicare Medical Store

> Your trusted pharmacy delivered within minutes.

A production-grade pharmacy e-commerce platform: customer storefront, internal operations
dashboard, REST API, and a MARG ERP integration layer. Built as a TypeScript monorepo.

## Project status: Phase 1

This is a genuinely large platform (storefront + 5 internal role panels + ERP sync + telehealth +
live GPS tracking + multi-pharmacy support, etc.) — too large to build to full production maturity
in a single pass. **Phase 1**, shipped here, covers the complete revenue-critical path end to end:
auth, catalog/search, cart, checkout, payments, order fulfillment, inventory (with FIFO batching
and a never-oversell guarantee), GST invoicing, prescriptions with OCR, the full MongoDB schema,
and the MARG ERP adapter architecture (CSV import + webhook receiver, both real and working).

**Explicitly out of scope for Phase 1** (see [the plan](#roadmap--phase-2) below): doctor
video/audio consultation, the health blog CMS, live driver GPS tracking, multi-branch admin UI,
referral/gift-card/flash-sale promotions, WhatsApp notifications, and a Redis caching layer. The
data model already has room for these (e.g. `Blog`/`BlogComment` collections exist), but the UI
and business logic for them have not been built.

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
`Notification`, `Blog`, `BlogComment`, `Driver`, `AuditLog`, `MargSyncLog`, `AnalyticsSnapshot`.

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

## Roadmap / Phase 2

Tracked as explicitly deferred in the original plan, not forgotten:

- Doctor video/audio consultation (appointment booking + a WebRTC provider integration)
- Full Health Blog CMS authoring UI + public blog pages + comments
- Live driver GPS tracking (sockets) + route optimization + signature proof-of-delivery
- Advanced analytics: heatmaps, repeat-customer/retention cohorts, sales forecasting
- Multi-pharmacy/branch admin UI, employee permission matrix, backup/restore tooling
- Referral program, gift cards, flash-sale scheduler
- WhatsApp notifications
- Redis caching layer + CDN tuning
- Full Jest/Supertest automated test suite
- Load testing and index-tuning pass for true 100k-customer scale

## License

Proprietary — all rights reserved.
