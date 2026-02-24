---
title: "Caching"
description: "Speed up your HyperZ application with the built-in cache layer — Memory and Redis drivers, TTL support, and cache invalidation."
---

**Caching** in HyperZ provides a unified API for storing and retrieving data across multiple cache backends. Switch between **Memory** and **Redis** drivers via configuration.

## Configuration

Set the cache driver in `.env`:

```bash
CACHE_DRIVER=memory   # memory | redis
REDIS_URL=redis://localhost:6379
```

Configure cache settings in `config/cache.ts`:

```typescript
export default {
  driver: env('CACHE_DRIVER', 'memory'),
  prefix: 'hyperz_cache:',
  ttl: 3600, // Default TTL in seconds
};
```

## Basic Usage

Use the `CacheManager` to store and retrieve values:

```typescript
import { CacheManager } from '../../src/cache/CacheManager.js';

const cache = new CacheManager();

// Store a value with TTL (seconds)
await cache.set('user:1', { name: 'Jane' }, 600);

// Retrieve a value
const user = await cache.get('user:1');

// Check existence
const exists = await cache.has('user:1');

// Remove a value
await cache.forget('user:1');
```

## Cache-Aside Pattern

Retrieve from cache or compute and store:

```typescript
const products = await cache.remember('products:featured', 300, async () => {
  return await Product.all();
});
```

## Flushing the Cache

Clear all cached entries:

```typescript
await cache.flush();
```
