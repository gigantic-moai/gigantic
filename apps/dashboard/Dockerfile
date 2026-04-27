# Build context expected: monorepo root.
# Plain Dockerfile syntax — no BuildKit-only features, so this works with both
# the legacy builder and BuildKit/buildx.

# ── Build ────────────────────────────────────────────────
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /repo

# Install full workspace deps (need devDeps for the build).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile=false

# Copy source and build.
COPY packages/shared packages/shared
COPY apps/dashboard apps/dashboard
RUN pnpm --filter @gigantic/dashboard build

# Produce a self-contained, portable production tree at /deploy.
# `pnpm deploy --prod` resolves workspace deps (@gigantic/shared) and emits a
# flat node_modules tree without cross-package symlinks — exactly what we
# need for a runtime container that only sees /app.
RUN pnpm --filter @gigantic/dashboard deploy --prod /deploy

# ── Runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

COPY --from=build /deploy/build ./build
COPY --from=build /deploy/package.json ./package.json
COPY --from=build /deploy/drizzle ./drizzle
COPY --from=build /deploy/src/lib/server/db/migrate.mjs ./migrate.mjs
COPY --from=build /deploy/node_modules ./node_modules

EXPOSE 3000

# Run migrations (idempotent) before booting the server.
CMD ["sh", "-c", "node ./migrate.mjs && node build"]
