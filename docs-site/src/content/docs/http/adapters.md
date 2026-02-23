---
title: HTTP Adapters
description: Switch between Express.js, Fastify, and Hono
---

## Overview

HyperZ provides an **HTTP adapter layer** that abstracts the underlying HTTP framework. This means you can write your application once and switch between Express.js, Fastify, or Hono by changing a single environment variable.

## Configuration

Set the `HTTP_ADAPTER` environment variable:

```bash
# .env
HTTP_ADAPTER=express   # Default — Express.js 5
HTTP_ADAPTER=fastify   # Fastify (requires: npm i fastify)
HTTP_ADAPTER=hono      # Hono (requires: npm i hono @hono/node-server)
```

## Available Adapters

### Express.js (Default)

The default adapter. No additional packages required.

```bash
HTTP_ADAPTER=express
```

- Mature ecosystem with extensive middleware
- Express 5 with native async error handling
- Built-in JSON and URL-encoded parsing

### Fastify

High-performance alternative with schema-based validation.

```bash
npm install fastify @fastify/formbody
HTTP_ADAPTER=fastify
```

- 2-3x faster than Express in benchmarks
- Built-in JSON parsing (no middleware needed)
- Schema-based request validation

### Hono

Ultra-lightweight framework with Web Standard API support.

```bash
npm install hono @hono/node-server
HTTP_ADAPTER=hono
```

- Smallest bundle size
- Web Standard Request/Response API
- Runs on Bun, Deno, Cloudflare Workers, and Node.js

## Adapter Interface

All adapters implement the `HttpAdapter` interface:

```typescript
interface HttpAdapter {
    use(handler: MiddlewareFn): void;
    route(method: string, path: string, ...handlers: HandlerFn[]): void;
    listen(port: number, callback?: () => void): Promise<void>;
    close(): Promise<void>;
    getNativeApp<T>(): T;
    enableJsonParsing(): void;
    enableUrlEncodedParsing(): void;
}
```

## Programmatic Usage

```typescript
import { createAdapter } from './src/http/adapters/index.js';
import type { AdapterType } from './src/http/adapters/HttpAdapter.js';

const adapter = createAdapter('fastify'); // or 'express', 'hono'

// For Fastify and Hono, initialize first
if ('init' in adapter) await adapter.init();

adapter.enableJsonParsing();

adapter.route('GET', '/api/hello', async (req, res) => {
    res.json({ message: 'Hello from HyperZ!' });
});

await adapter.listen(7700, () => console.log('Listening on :7700'));
```

## Important Notes

:::note
The HTTP adapter layer provides a unified API, but some framework-specific features may not be available across all adapters. If you need deep framework integration, use `adapter.getNativeApp()` to access the underlying instance.
:::

:::caution
When switching adapters, ensure your middleware is compatible. Express-specific middleware (e.g., `helmet`, `cors`) won't work with Fastify or Hono. HyperZ provides adapter-agnostic alternatives for common middleware.
:::
