# Build context: monorepo root  (docker build -f apps/api/Dockerfile .)
FROM node:20-alpine AS base
WORKDIR /repo

# ── 1. Install all workspace deps ───────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
COPY packages/shared/package*.json packages/shared/
COPY apps/api/package*.json           apps/api/
COPY apps/web/package*.json           apps/web/
RUN npm install

# ── 2. Build shared → web → api ─────────────────────────────────────────────
FROM base AS build
COPY --from=deps /repo/node_modules           ./node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /repo/apps/api/node_modules  ./apps/api/node_modules
COPY --from=deps /repo/apps/web/node_modules  ./apps/web/node_modules

COPY tsconfig.base.json ./
COPY packages/shared    ./packages/shared
COPY apps/api           ./apps/api
COPY apps/web           ./apps/web

# NEXT_PUBLIC vars must be present at build time
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build --workspace=packages/shared \
 && npm run build --workspace=apps/web \
 && npm run build --workspace=apps/api

# ── 3. Lean production image ─────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

# Shared package
COPY --from=build /repo/packages/shared/dist     ./packages/shared/dist
COPY --from=build /repo/packages/shared/package.json ./packages/shared/package.json

# API compiled output
COPY --from=build /repo/apps/api/dist            ./apps/api/dist
COPY --from=build /repo/apps/api/package.json    ./apps/api/package.json

# Next.js web build (needed by the custom server)
COPY --from=build /repo/apps/web/.next           ./apps/web/.next
COPY --from=build /repo/apps/web/public          ./apps/web/public
COPY --from=build /repo/apps/web/package.json    ./apps/web/package.json
COPY --from=build /repo/apps/web/next.config.ts  ./apps/web/next.config.ts

# Hoisted node_modules (workspaces share a single install)
COPY --from=build /repo/node_modules             ./node_modules
COPY --from=build /repo/apps/api/node_modules    ./apps/api/node_modules
COPY --from=build /repo/apps/web/node_modules    ./apps/web/node_modules

EXPOSE 5000
CMD ["node", "apps/api/dist/server.js"]
