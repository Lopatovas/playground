# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json tsconfig.json ./
COPY packages ./packages
COPY apps/cli ./apps/cli
COPY apps/api ./apps/api
COPY apps/dashboard ./apps/dashboard
COPY apps/demo-target ./apps/demo-target

RUN pnpm install --frozen-lockfile
RUN pnpm -r --filter "./packages/*" run build \
  && pnpm --filter @bulwark/cli run build \
  && pnpm --filter @bulwark/api run build \
  && pnpm --filter @bulwark/dashboard run build

# Playwright browsers match the adapters peer dependency locked at 1.62.1.
FROM mcr.microsoft.com/playwright:v1.62.1-jammy AS api

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4190
ENV BULWARK_CONFIG=/config/bulwark.config.json
ENV BULWARK_ARTIFACTS_DIR=/data/artifacts
ENV BULWARK_DASHBOARD_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

COPY --from=build /app /app

WORKDIR /app/apps/api
EXPOSE 4190
CMD ["node", "./dist/bin.js"]

FROM nginx:1.27-alpine AS dashboard

COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/dashboard/dist /usr/share/nginx/html
EXPOSE 80
