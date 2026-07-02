FROM node:22-alpine AS build
RUN npm i -g pnpm@10
WORKDIR /repo
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/dashboard/package.json apps/dashboard/
RUN pnpm install --frozen-lockfile=false
COPY packages/shared packages/shared
COPY apps/dashboard apps/dashboard
RUN pnpm --filter @gigantic/dashboard build
# 런타임 전용 node_modules (ws, pg, pglite, drizzle-orm)
RUN pnpm --filter @gigantic/dashboard --prod deploy /prod

FROM node:22-alpine
WORKDIR /app
COPY --from=build /prod/node_modules ./node_modules
COPY --from=build /repo/apps/dashboard/build ./build
COPY --from=build /repo/apps/dashboard/drizzle ./drizzle
COPY --from=build /repo/apps/dashboard/server.js /repo/apps/dashboard/package.json ./
ENV PORT=3000
EXPOSE 3000
# DATABASE_URL 미설정 시 인메모리 mock — compose에서는 Postgres 16을 주입한다
CMD ["node", "server.js"]
