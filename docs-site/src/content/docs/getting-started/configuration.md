---
title: Configuration
description: Configure HyperZ via config files and environment variables
---

## Overview

HyperZ follows a convention-over-configuration approach. All configuration files live in the `config/` directory and are automatically loaded at boot time.

## Config Files

| File | Purpose |
|------|---------|
| `config/app.ts` | App name, port, environment, timezone |
| `config/auth.ts` | JWT settings, guard drivers |
| `config/cache.ts` | Cache driver (memory, redis) |
| `config/database.ts` | Database connections (SQLite, MySQL, PostgreSQL) |
| `config/docs.ts` | Swagger UI + Scalar API reference settings |
| `config/mail.ts` | SMTP / mail driver configuration |
| `config/queue.ts` | Queue driver (sync, redis/BullMQ) |
| `config/storage.ts` | File storage (local, S3) |
| `config/ai.ts` | AI provider settings (OpenAI, Anthropic, Google) |
| `config/ratelimit.ts` | Rate limiting rules |

## Reading Config

Use the `env()` helper to read environment variables with defaults:

```typescript
import { env, envNumber, envBool } from '../src/support/helpers.js';

export default {
    port: envNumber('APP_PORT', 7700),
    debug: envBool('APP_DEBUG', false),
    name: env('APP_NAME', 'HyperZ'),
};
```

Access config at runtime:

```typescript
const port = app.config.get('app.port', 7700);
const dbDriver = app.config.get('database.driver', 'sqlite');
```

## Environment Variables

All sensitive values should go in `.env` (never commit this file):

```bash
APP_NAME=MyAPI
APP_ENV=production
APP_PORT=7700
APP_KEY=base64:...
JWT_SECRET=...

DB_DRIVER=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=myapi
DB_USERNAME=postgres
DB_PASSWORD=secret

CACHE_DRIVER=redis
REDIS_HOST=localhost
REDIS_PORT=6379

AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```
