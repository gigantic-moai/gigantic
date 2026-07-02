FROM node:22-alpine AS build
RUN npm i -g pnpm@10
WORKDIR /repo
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/bridge/package.json apps/bridge/
RUN pnpm install --frozen-lockfile=false
COPY packages/shared packages/shared
COPY apps/bridge apps/bridge
RUN pnpm --filter @gigantic/bridge --prod deploy /prod

FROM node:22-alpine
WORKDIR /app
COPY --from=build /prod ./
ENV ORCHESTRATOR_PORT=4000
EXPOSE 4000
CMD ["./node_modules/.bin/tsx", "src/index.ts"]
