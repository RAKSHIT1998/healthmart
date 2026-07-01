# Build context is the monorepo root (see docker-compose.yml / Railway build settings).
FROM node:20-alpine AS base
WORKDIR /repo

FROM base AS deps
COPY package*.json ./
COPY packages/shared/package*.json packages/shared/
COPY apps/api/package*.json apps/api/
RUN npm install

FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/package.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm run build --workspace=packages/shared && npm run build --workspace=apps/api

FROM base AS production
ENV NODE_ENV=production
WORKDIR /repo/apps/api
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package*.json ./
COPY --from=build /repo/packages/shared/dist ../../packages/shared/dist
COPY --from=build /repo/packages/shared/package.json ../../packages/shared/package.json
COPY --from=build /repo/node_modules ../../node_modules

EXPOSE 5000
CMD ["node", "dist/server.js"]
