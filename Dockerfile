# ---- Stage 1: Build ----
FROM node:22-slim AS build

WORKDIR /app

# Copy workspace package manifests first for layer caching
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

# Install all dependencies (including devDeps for build tooling)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY shared/ shared/
COPY server/ server/
COPY client/ client/

# Build: tsc --build (shared + server) then vite build (client)
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built artifacts from build stage
COPY --from=build /app/shared/dist/ shared/dist/
COPY --from=build /app/server/dist/ server/dist/
COPY --from=build /app/client/dist/ client/dist/

ENV NODE_ENV=production
EXPOSE 2567

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:2567/health || exit 1

CMD ["node", "server/dist/index.js"]
