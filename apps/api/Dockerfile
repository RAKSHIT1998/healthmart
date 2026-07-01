# Build context: monorepo root  (docker build -f apps/api/Dockerfile .)
FROM node:20-alpine AS base
WORKDIR /repo

# ── 1. Install all workspace deps ────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
COPY packages/shared/package*.json packages/shared/
COPY apps/api/package*.json         apps/api/
COPY apps/web/package*.json         apps/web/
# npm workspaces hoists everything to root node_modules — no per-workspace dirs
RUN npm ci

# ── 2. Build shared → web → api ──────────────────────────────────────────────
FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
# Root package.json is required for npm --workspace= commands to resolve
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api        ./apps/api
COPY apps/web        ./apps/web

# NEXT_PUBLIC_* vars are inlined into the JS bundle at build time.
# Set them here (Railway can override via Build Variables in the dashboard).
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_SITE_URL=https://buymedicine.store
ARG NEXT_PUBLIC_CASHFREE_ENV=SANDBOX
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_CASHFREE_ENV=${NEXT_PUBLIC_CASHFREE_ENV}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}

RUN npm run build --workspace=packages/shared \
 && npm run build --workspace=apps/web \
 && npm run build --workspace=apps/api

# ── 3. Lean production image ──────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

# Re-install production deps only (omits devDeps, keeps workspace symlinks intact)
COPY package*.json ./
COPY packages/shared/package*.json packages/shared/
COPY apps/api/package*.json         apps/api/
COPY apps/web/package*.json         apps/web/
RUN npm ci --omit=dev

# Shared compiled output (the workspace symlink resolves to this)
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist

# API compiled output
COPY --from=build /repo/apps/api/dist ./apps/api/dist

# Next.js web build
COPY --from=build /repo/apps/web/.next  ./apps/web/.next
COPY --from=build /repo/apps/web/next.config.ts ./apps/web/next.config.ts
# public/ may be empty; ensure the dir exists so Next.js can serve from it
RUN mkdir -p apps/web/public

EXPOSE 5000
CMD ["node", "apps/api/dist/server.js"]
