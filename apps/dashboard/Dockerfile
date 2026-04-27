# Build context expected: monorepo root.
# Plain Dockerfile syntax — no BuildKit-only features, so this works with both
# the legacy builder and BuildKit/buildx.

# ── Base ─────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# ── Deps ─────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile=false

# ── Build ────────────────────────────────────────────────
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/dashboard apps/dashboard
RUN pnpm --filter @gigantic/dashboard build

# ── Runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runtime
# tsx is needed at runtime to execute migrate.ts (a TS file). pnpm hoists tsx
# under apps/dashboard/node_modules/.pnpm/, which Node's loader can't resolve
# when invoked via `--import tsx` from /app. Install it globally instead.
RUN corepack enable && npm install -g tsx@4
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

COPY --from=build /repo/apps/dashboard/build ./build
COPY --from=build /repo/apps/dashboard/package.json ./package.json
COPY --from=build /repo/apps/dashboard/drizzle ./drizzle
COPY --from=build /repo/apps/dashboard/src/lib/server/db/migrate.mjs ./migrate.mjs
COPY --from=build /repo/packages/shared ./node_modules/@gigantic/shared
COPY --from=build /repo/apps/dashboard/node_modules ./node_modules

EXPOSE 3000

# Run migrations (idempotent) before booting the server.
CMD ["sh", "-c", "node ./migrate.mjs && node build"]
