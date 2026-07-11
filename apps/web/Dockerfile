# Build context: monorepo root  (docker build -f apps/web/Dockerfile .)

FROM node:20-alpine AS builder
WORKDIR /repo

COPY package*.json ./
COPY packages/shared/package*.json packages/shared/
COPY apps/web/package*.json apps/web/
RUN npm ci

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL=https://buymedicine.store
ARG NEXT_PUBLIC_CASHFREE_ENV=SANDBOX
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_CASHFREE_ENV=${NEXT_PUBLIC_CASHFREE_ENV}
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=2048

RUN npm run build --workspace=packages/shared \
 && npm run build --workspace=apps/web

FROM node:20-alpine AS production
WORKDIR /repo

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY package*.json ./
COPY packages/shared/package*.json packages/shared/
COPY apps/web/package*.json apps/web/
RUN npm ci --omit=dev

COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/apps/web/.next ./apps/web/.next
COPY --from=builder /repo/apps/web/public ./apps/web/public
COPY --from=builder /repo/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=builder /repo/apps/web/package.json ./apps/web/package.json

WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]
