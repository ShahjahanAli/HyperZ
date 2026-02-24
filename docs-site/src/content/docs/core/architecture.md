---
title: Architecture
description: Understanding HyperZ's service-provider architecture
---

## Overview

HyperZ is built on a **service-provider architecture** with an **IoC (Inversion of Control) container** at its core. This design is inspired by Laravel and enables clean separation of concerns, testability, and extensibility.

## Boot Lifecycle

```
server.ts → createApp() → Register Providers → Boot Providers → Listen
                │                   │                 │
                ▼                   ▼                 ▼
         Application          Container         Routes loaded
         Config loaded        Services bound    Middleware applied
         Plugins discovered   DB connected      Server listening
```

### Service Providers

Service providers are the central place for bootstrapping framework components:

1. **AppServiceProvider** — Core application services
2. **SecurityServiceProvider** — CSRF, XSS, sanitization, CORS
3. **FeaturesServiceProvider** — Feature flags
4. **DatabaseServiceProvider** — TypeORM/Drizzle connections
5. **EventServiceProvider** — Event dispatcher
6. **CacheServiceProvider** — Cache drivers
7. **RouteServiceProvider** — Auto-loads route files

### Registration vs Boot

- **`register()`** — Bind services into the container. No other services should be used here.
- **`boot()`** — All providers are registered. Safe to use any service.

## Service Container

The IoC container manages class instantiation and dependency injection:

```typescript
// Bind a service
app.container.bind('mailer', () => new Mailer(config));

// Bind a singleton
app.container.singleton('cache', () => new CacheManager());

// Resolve a service
const cache = app.container.make<CacheManager>('cache');

// Auto-resolve with decorators
@Singleton()
class AnalyticsService {
    constructor(private logger: Logger) {} // auto-injected
}
```

## Plugin Architecture

Plugins extend the framework through a formal contract:

```typescript
import { definePlugin } from './src/core/PluginContract.js';

export default definePlugin({
    meta: { name: 'my-plugin', version: '1.0.0' },
    hooks: {
        register(app) { /* bind services */ },
        boot(app) { /* use services */ },
        routes(app) { /* add routes */ },
        shutdown(app) { /* cleanup */ },
    },
    config: {
        key: 'myPlugin',
        defaults: { enabled: true },
    },
});
```

## HTTP Adapter Layer

HyperZ abstracts the HTTP framework behind an adapter interface, allowing you to swap between Express.js, Fastify, and Hono:

```
Your Code → HyperZ API → HttpAdapter Interface → Express / Fastify / Hono
```

See [HTTP Adapters](/http/adapters/) for configuration details.
