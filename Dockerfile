# ──────────────────────────────────────────────────────────────
# HyperZ Framework — Production Dockerfile (Multi-Stage)
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Install & Build ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first (better layer caching)
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript → JavaScript
RUN npm run build

# Prune devDependencies after build
RUN npm prune --production

# ── Stage 2: Production Runtime ──────────────────────────────
FROM node:20-alpine AS runtime

# Security: run as non-root user
RUN addgroup -S hyperz && adduser -S hyperz -G hyperz

WORKDIR /app

# Copy built artifacts and production deps from builder
COPY --from=builder --chown=hyperz:hyperz /app/dist ./dist
COPY --from=builder --chown=hyperz:hyperz /app/node_modules ./node_modules
COPY --from=builder --chown=hyperz:hyperz /app/package.json ./package.json

# Copy runtime config/data directories
COPY --chown=hyperz:hyperz config/ ./config/
COPY --chown=hyperz:hyperz lang/ ./lang/
COPY --chown=hyperz:hyperz .env.example ./.env.example

# Create storage directories
RUN mkdir -p storage/cache storage/logs storage/uploads \
    && chown -R hyperz:hyperz storage

# Create database directory (for SQLite)
RUN mkdir -p database/migrations database/seeders \
    && chown -R hyperz:hyperz database
COPY --chown=hyperz:hyperz database/ ./database/

# Switch to non-root user
USER hyperz

# Expose the app port
EXPOSE 7700

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:7700/api/health || exit 1

# Start HyperZ
CMD ["node", "dist/server.js"]
