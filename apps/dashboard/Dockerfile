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

FROM node:22-alpine
WORKDIR /app
COPY --from=build /repo/apps/dashboard/build ./build
COPY --from=build /repo/apps/dashboard/package.json ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
