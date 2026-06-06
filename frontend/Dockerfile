FROM node:22-alpine AS builder
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/schemas/package.json ./packages/schemas/
COPY frontend/package.json ./frontend/

RUN pnpm config set minimum-release-age 0 && pnpm install --frozen-lockfile

COPY packages/schemas ./packages/schemas
COPY frontend ./frontend

WORKDIR /app/frontend
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
