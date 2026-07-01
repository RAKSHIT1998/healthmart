# Build context: monorepo root  (docker build -f apps/api/Dockerfile .)

# ── 1. Builder ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /repo

# Install deps first (cached unless package*.json changes)
COPY package*.json ./
COPY packages/shared/package*.json packages/shared/
COPY apps/api/package*.json         apps/api/
COPY apps/web/package*.json         apps/web/
RUN npm ci

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api        ./apps/api
COPY apps/web        ./apps/web

# NEXT_PUBLIC_* vars are inlined into the browser bundle at build time.
# Override these in Railway → Service → Build Variables.
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_SITE_URL=https://buymedicine.store
ARG NEXT_PUBLIC_CASHFREE_ENV=SANDBOX
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_CASHFREE_ENV=${NEXT_PUBLIC_CASHFREE_ENV}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}

# Reduce Next.js build memory usage
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048

# Build order matters: shared must be compiled before web/api import it
RUN npm run build --workspace=packages/shared \
 && npm run build --workspace=apps/web \
 && npm run build --workspace=apps/api

# ── 2. Production image ───────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /repo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Limit heap to 460 MB — leaves headroom for Railway's 512 MB container limit.
ENV NODE_OPTIONS=--max-old-space-size=460

# Production deps only (workspace symlinks are set up correctly here)
COPY package*.json ./
COPY packages/shared/package*.json packages/shared/
COPY apps/api/package*.json         apps/api/
COPY apps/web/package*.json         apps/web/
RUN npm ci --omit=dev

# Compiled shared package (resolves workspace symlink node_modules/@buymedicines/shared)
COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist

# API compiled output
COPY --from=builder /repo/apps/api/dist ./apps/api/dist

# Next.js production build
COPY --from=builder /repo/apps/web/.next      ./apps/web/.next
COPY --from=builder /repo/apps/web/next.config.js ./apps/web/next.config.js
RUN mkdir -p apps/web/public

EXPOSE 5000
CMD ["node", "apps/api/dist/server.js"]
