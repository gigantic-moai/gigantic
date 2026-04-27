# syntax=docker/dockerfile:1.7
# Build context expected: monorepo root.

# ── Base ─────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# ── Deps ─────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile=false

# ── Build ────────────────────────────────────────────────
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/dashboard apps/dashboard
RUN pnpm --filter @gigantic/dashboard build

# ── Runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runtime
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

COPY --from=build /repo/apps/dashboard/build ./build
COPY --from=build /repo/apps/dashboard/package.json ./package.json
COPY --from=build /repo/apps/dashboard/drizzle ./drizzle
COPY --from=build /repo/apps/dashboard/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /repo/apps/dashboard/src/lib/server/db/migrate.ts ./migrate.ts
COPY --from=build /repo/packages/shared ./node_modules/@gigantic/shared
COPY --from=build /repo/apps/dashboard/node_modules ./node_modules

EXPOSE 3000

# Run migrations (idempotent) before booting the server.
CMD ["sh", "-c", "node --import tsx ./migrate.ts && node build"]
