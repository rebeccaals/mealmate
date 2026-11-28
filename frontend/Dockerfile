FROM node:22-alpine AS builder
# Same pnpm version as locally, so a new pnpm release can't change how the build behaves
RUN npm install -g pnpm@10.29.3

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
# Files in /etc/nginx/templates are filled in with env vars and written to /etc/nginx/conf.d at start
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=80
# Makes the nginx image put the container's DNS server(s) in NGINX_LOCAL_RESOLVERS (used by the template)
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
ENV BACKEND_URL=http://backend:5001
EXPOSE 80
