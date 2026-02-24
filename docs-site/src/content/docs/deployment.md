---
title: "Deployment"
description: "Deploy your HyperZ application to production — Docker, environment configuration, migrations, and production best practices."
---

Deploy your HyperZ application using **Docker** or any Node.js hosting platform. This guide covers production setup, environment configuration, and best practices.

## Docker Deployment

HyperZ includes `Dockerfile` and `docker-compose.yml` out of the box:

```bash
# Build and start with Docker Compose
docker-compose up -d

# Or build manually
docker build -t my-hyperz-app .
docker run -p 7700:7700 --env-file .env my-hyperz-app
```

## Production Environment

Set essential environment variables for production:

```bash
APP_ENV=production
APP_PORT=7700
APP_KEY=<generated-with-key:generate>
JWT_SECRET=<generated-with-key:generate>

DB_DRIVER=postgresql
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=hyperz_prod
DB_USER=hyperz
DB_PASS=secure-password

CACHE_DRIVER=redis
QUEUE_DRIVER=redis
REDIS_URL=redis://your-redis-host:6379
```

## Pre-Deployment Checklist

Run these commands before deploying:

```bash
# Generate encryption keys (if not already done)
npx hyperz key:generate

# Run database migrations
npx hyperz migrate

# Seed initial data (if needed)
npx hyperz db:seed
```

## Docker Compose (Production)

Use `docker-compose.yml` for a full production stack:

```yaml
# Includes: HyperZ app, PostgreSQL, Redis
docker-compose up -d
```

## Health Checks

HyperZ exposes a health endpoint for load balancers and orchestrators:

```
GET /api/health
```

## Security Recommendations

- Always set `APP_ENV=production` to disable debug output
- Use strong, unique values for `APP_KEY` and `JWT_SECRET`
- Disable Swagger UI in production: `DOCS_ENABLED=false`
- Enable HTTPS via a reverse proxy (nginx, Caddy, or cloud load balancer)
- Use Redis for cache and queue drivers in production
