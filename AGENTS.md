# 🤖 AGENTS.md — HyperZ Framework AI Agent Guide

> This file provides context, conventions, and rules for AI coding agents working on this project.
> Supported by: **Antigravity**, **Cursor**, **GitHub Copilot**, **Claude Code**, **Gemini Code Assist**, **Windsurf**, and other AI-assisted development tools.

---

## Project Overview

**HyperZ** is a Laravel-inspired, batteries-included, **AI-native**, and **Enterprise-grade** API framework built on **Express.js 5** and **TypeScript**. It follows convention-over-configuration principles with a modular service-provider architecture.

- **Runtime:** Node.js ≥ 20, TypeScript (strict mode), ES Modules
- **Entry point:** `server.ts` → `app.ts` → boot lifecycle
- **API base:** `http://localhost:7700/api`
- **Admin panel:** `admin/` (Next.js on port 3000, JWT-secured)
- **CLI entry:** `npx hyperz <command>`

---

## Directory Structure

```
HyperZ/
├── app/                    # YOUR code (controllers, models, middleware, routes, jobs, AI actions)
│   ├── controllers/        # HTTP controllers (extend Controller base class)
│   ├── models/             # Active Record models (extend Model base class)
│   ├── middleware/          # Custom middleware
│   ├── routes/             # Route files (auto-loaded, e.g. api.ts, auth.ts)
│   ├── jobs/               # Queue job classes (extend BaseJob)
│   └── ai/                 # AI action classes
│
├── config/                 # Configuration files (ai, app, auth, cache, database, features, mail, queue, security, storage, webhooks)
├── database/
│   ├── migrations/         # TypeORM migration classes (timestamped)
│   ├── seeders/            # Database seeders
│   └── factories/          # Data factories (Faker-ready)
│
├── src/                    # FRAMEWORK core — avoid direct edits unless extending framework
│   ├── admin/              # Admin API endpoints
│   ├── ai/                 # AI Gateway (OpenAI, Anthropic, Google AI) + StreamResponse (SSE)
│   ├── auth/               # JWT + RBAC (Gate, Policy, RoleMiddleware) + HashService, ApiKeyMiddleware, TokenBlacklist
│   ├── cache/              # Cache drivers (Memory, Redis)
│   ├── cli/                # CLI command registry
│   ├── core/               # Application, Container, PluginManager
│   ├── database/           # Database, Model, Migration, Factory, QueryBuilder (DB facade)
│   ├── events/             # Event dispatcher
│   ├── http/               # Router, Controller, Request, Response, middleware, LifecycleHooks
│   ├── i18n/               # Internationalization
│   ├── logging/            # Pino logger, AuditLog
│   ├── mail/               # Mailer (Nodemailer)
│   ├── playground/         # API Playground UI
│   ├── providers/          # Service providers (boot order)
│   ├── queue/              # Queue drivers (Sync, BullMQ)
│   ├── scheduling/         # Cron scheduler
│   ├── security/           # Security barrel exports
│   ├── storage/            # Storage drivers (Local, S3)
│   ├── support/            # Helpers (Str, Collection, env, sleep, Encrypter, SignedUrl, FeatureFlags)
│   ├── testing/            # HTTP test client
│   ├── validation/         # Zod validator
│   ├── webhooks/           # WebhookManager (HMAC signing, retry, delivery logs)
│   └── websocket/          # Socket.io WebSocket
│
├── admin/                  # Next.js Admin Panel (port 3100)
├── lang/                   # Translation JSON files (en/, bn/)
├── plugins/                # Auto-discovered plugins
├── storage/                # Runtime storage (logs/, cache/, uploads/)
├── .env                    # Environment variables
├── app.ts                  # App bootstrap (createApp)
└── server.ts               # Server entry (boot, listen)
```

---

## Coding Conventions

### TypeScript
- **Strict mode** is enabled — never use `any` unless absolutely necessary
- Use `type` imports for type-only references: `import type { Request } from 'express'`
- Use ES module imports with `.js` extensions: `import { Router } from '../../src/http/Router.js'`
- All exports should be named exports (avoid default exports except in route files)

### Naming
| Entity | Convention | Example |
|---|---|---|
| Controllers | PascalCase + `Controller` suffix | `ProductController` |
| Models | PascalCase, singular | `Product`, `User` |
| Migrations | snake_case, timestamped | `20260101120000_create_products_table.ts` |
| Seeders | PascalCase + `Seeder` suffix | `ProductSeeder` |
| Middleware | PascalCase + `Middleware` suffix | `ThrottleMiddleware` |
| Jobs | PascalCase | `SendWelcomeEmail` |
| Route files | lowercase | `api.ts`, `auth.ts` |
| Config files | lowercase | `database.ts`, `cache.ts` |

### Dependency Injection (DI)
- Use `@Injectable()` on classes that should be manageable by the container.
- Use `@Singleton()` for services that should have a single instance.
- Constructor injection is the preferred way to handle dependencies.
- Example:
  ```typescript
  @Injectable()
  export class AnalyticsService {
    constructor(private logger: Logger) {}
  }
  ```

### Controllers
- Extend `Controller` from `../../src/http/Controller.js`
- Use response helpers: `this.success()`, `this.created()`, `this.error()`, `this.noContent()`, `this.paginate()`
- Bind methods in routes: `controller.index.bind(controller)`

### Models
- Extend `Model` from `../../src/database/Model.js`
- Set `table`, `fillable`, `hidden`, `softDeletes` properties
- Use static methods: `Model.all()`, `Model.find(id)`, `Model.create(data)`, `Model.update(id, data)`, `Model.delete(id)`

### Routes
- Use `HyperZRouter` from `../../src/http/Router.js`
- Route files in `app/routes/` are auto-loaded
- Use `router.resource('/path', controller)` for full CRUD
- Available methods: `router.get()`, `router.post()`, `router.put()`, `router.delete()`
- Group routes: `router.group({ prefix: '/v2', middleware: [...] }, (r) => { ... })`

### Validation
- Use Zod schemas with the `validate()` middleware
- Apply as route middleware: `router.post('/path', validate(schema), handler)`

### Database
- Migrations use TypeORM — export a class implementing `MigrationInterface`
- Use `queryRunner.createTable()` in `up()`, `queryRunner.dropTable()` in `down()`

### AI-native Features
- **PromptManager:** Load templates from `app/prompts/` (e.g., `await prompts.load('email/welcome@v2', { user: 'name' })`).
- **VectorDB:** Use for RAG capabilities. Register adapters (`PGVectorAdapter`, `WeaviateAdapter`) in `AppServiceProvider`.
- **AIGateway:** Unified interface for OpenAI, Anthropic, and Gemini. Use `ai.action(name)` for structured tasks.
- **Agents:** Use `Agent.create(name, ai)` to build autonomous workflows.

### Security
- **Encrypter:** Use `Encrypter.encrypt(plaintext)` / `Encrypter.decrypt(payload)` for AES-256-GCM encryption via `APP_KEY`.
- **SignedUrl:** Use `SignedUrl.create(url, params, expiresInSeconds)` / `SignedUrl.verify(fullUrl)` for tamper-proof links.
- **HashService:** Use `HashService.make(password)` / `HashService.check(password, hash)` for bcrypt hashing.
- **CSRF:** Enabled via `SecurityServiceProvider` — double-submit cookie pattern.
- **Sanitization:** Auto-strips XSS and prototype pollution from request body/query/params.
- **Token Blacklisting:** Use `TokenBlacklist.revoke(jti)` / `TokenBlacklist.isRevoked(jti)` for JWT revocation.
- **API Key Auth:** Use `apiKeyMiddleware(resolver, scopes)` for API key-based route protection.

### Feature Flags
- Define flags in `config/features.ts` or via `FeatureFlags.define(name, resolver)`.
- Check flags: `await FeatureFlags.enabled('flag-name', context)`.
- Gate routes: `router.get('/v2', featureMiddleware('new-ui'), handler)`.
- Supports config, env, and custom drivers.

### Lifecycle Hooks
- Register hooks with `LifecycleHooks.onRequest()`, `onResponse()`, `onError()`, `onFinish()`.
- Hooks fire beyond normal middleware — useful for telemetry, audit logging, and request transformation.

### Audit Log
- Record entries: `AuditLog.record({ action, userId, ip, metadata })`.
- Track model changes: `AuditLog.recordChange({ model, modelId, action, before, after })`.
- Auto-middleware logs all state-changing requests (POST/PUT/PATCH/DELETE).

### Webhooks
- Register endpoints: `WebhookManager.register({ url, events, secret })`.
- Dispatch: `await WebhookManager.dispatch('user.created', payload)`.
- Verify incoming: `WebhookManager.verifySignature(payload, signature, secret)`.
- Automatic retry with exponential backoff + delivery logging.

### Query Builder
- Raw SQL facade: `DB.table('users').where('role', 'admin').get()`.
- Supports `select`, `where`, `orWhere`, `whereIn`, `whereNull`, `orderBy`, `limit`, `offset`, `groupBy`.
- CRUD: `insert()`, `update()`, `delete()`, `count()`, `exists()`, `paginate()`.
- Transactions: `DB.transaction(async () => { ... })`.

### AI Streaming (SSE)
- Use `StreamResponse` for Server-Sent Events: `new StreamResponse(res).start().write('token')`.
- Stream async iterables: `stream.streamIterator(ai.streamChat(messages))`.
- Middleware: `sseMiddleware()` auto-sets SSE headers.

### Enterprise SaaS Patterns
- **Multi-tenancy:** Access `req.tenant` to get context-isolated configuration.
- **Database:** Use `Database.getDataSource()` for the primary connection.
- **Billing:** Record usage via `billing.recordUsage(tenantId, 'tokens', count)`.
- **Monitoring:** Track AI cost and latency via the built-in system gauges.

---

## CLI Commands (Use for Scaffolding)

```bash
npx hyperz make:controller <Name> [--model <M>]  # Create controller (with CRUD if --model provided)
npx hyperz make:model <Name> [-m]         # Create model (with migration)
npx hyperz make:migration <name>          # Create migration
npx hyperz make:seeder <Name>             # Create seeder
npx hyperz make:middleware <Name>          # Create middleware
npx hyperz make:route <name>              # Create route file
npx hyperz make:job <Name>                # Create queue job
npx hyperz make:factory <Name>            # Create database factory
npx hyperz make:ai-action <Name>          # Create AI action
npx hyperz make:test <Name> [-f]            # Create unit/feature test
npx hyperz make:module <Name>               # Scaffold full domain module (model+controller+route+migration+test)
npx hyperz make:auth                      # Scaffold full auth system
npx hyperz migrate                        # Run migrations
npx hyperz migrate:rollback               # Rollback migrations
npx hyperz db:seed                        # Run seeders
npx hyperz key:generate                   # Generate APP_KEY + JWT_SECRET
npx hyperz serve                          # Start dev server
npx hyperz route:list                     # List routes
npx hyperz tinker                         # Interactive REPL
```

> **Prefer using CLI commands** over writing boilerplate manually. They generate correctly structured files.

---

## Important Rules for AI Agents

1. **Never modify `src/` files** unless explicitly asked — `src/` is framework internals
2. **Always use `.js` extensions** in import paths (TypeScript compiles to JS modules)
3. **Use the CLI** to scaffold controllers, models, migrations, etc. — don't write boilerplate
4. **Route files auto-load** from `app/routes/` — just create the file, no manual registration needed
5. **Config values** should be read via `env('KEY', 'default')` helper, not `process.env` directly
6. **Bind controller methods** in routes: `controller.method.bind(controller)` (required for `this` context)
7. **Run `npx hyperz migrate`** after creating migrations
8. **The dev server** runs on port 7700 — start with `npm run dev`
9. **Admin panel** runs separately: `cd admin && npm run dev` (port 3000, requires DB + `key:generate`)
10. **`.env` file** holds all environment config — see `.env.example` for available variables

---

## Workflows

See `.agent/workflows/` for step-by-step guides:
- `add-crud-resource.md` — Build a complete CRUD feature
- `add-middleware.md` — Create and register custom middleware
- `database-operations.md` — Migrations, seeders, factories
- `add-ai-action.md` — Create an AI-powered action
- `run-dev.md` — Start the development environment

---

## Environment Variables

Key variables in `.env`:

| Variable | Description | Default |
|---|---|---|
| `APP_PORT` | Server port | `7700` |
| `APP_ENV` | Environment | `development` |
| `DB_DRIVER` | Database driver (sqlite, mysql, postgresql) | `sqlite` |
| `CACHE_DRIVER` | Cache backend (memory, redis) | `memory` |
| `QUEUE_DRIVER` | Queue backend (sync, redis) | `sync` |
| `AI_PROVIDER` | AI provider (openai, anthropic, google) | `openai` |
| `JWT_SECRET` | JWT signing secret | — |
| `APP_KEY` | Application encryption key | — |
| `WEBHOOK_SECRET` | Default webhook signing secret | — |
| `WEBHOOK_MAX_RETRIES` | Max webhook delivery retries | `3` |

---

## Quick Reference

**Start dev:** `npm run dev`
**Run migration:** `npx hyperz migrate`
**Create resource:** `npx hyperz make:controller ProductController && npx hyperz make:model Product -m`
**Scaffold module:** `npx hyperz make:module Product` (creates model+controller+route+migration+test)
**API base URL:** `http://localhost:7700/api`
**Playground:** `http://localhost:7700/api/playground`
**Admin panel:** `http://localhost:3000` (requires `cd admin && npm run dev`)
