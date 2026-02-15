# 🤖 AGENTS.md — HyperZ Framework AI Agent Guide

> This file provides context, conventions, and rules for AI coding agents working on this project.
> Supported by: **Antigravity**, **Cursor**, **GitHub Copilot**, **Claude Code**, **Gemini Code Assist**, **Windsurf**, and other AI-assisted development tools.

---

## Project Overview

**HyperZ** is a Laravel-inspired, batteries-included API framework built on **Express.js 5** and **TypeScript**. It follows convention-over-configuration principles with a service-provider architecture.

- **Runtime:** Node.js ≥ 20, TypeScript (strict mode), ES Modules
- **Entry point:** `server.ts` → `app.ts` → boot lifecycle
- **API base:** `http://localhost:7700/api`
- **Admin panel:** `admin/` (Next.js on port 3000, JWT-secured)
- **CLI entry:** `npx tsx bin/hyperz.ts <command>`

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
├── config/                 # Configuration files (ai, app, auth, cache, database, mail, queue, storage)
├── database/
│   ├── migrations/         # Knex migration files (timestamped)
│   ├── seeders/            # Database seeders
│   └── factories/          # Data factories (Faker-ready)
│
├── src/                    # FRAMEWORK core — avoid direct edits unless extending framework
│   ├── admin/              # Admin API endpoints
│   ├── ai/                 # AI Gateway (OpenAI, Anthropic, Google AI)
│   ├── auth/               # JWT + RBAC (Gate, Policy, RoleMiddleware)
│   ├── cache/              # Cache drivers (Memory, Redis)
│   ├── cli/                # CLI command registry
│   ├── core/               # Application, Container, PluginManager
│   ├── database/           # Database, Model, Migration, Factory
│   ├── events/             # Event dispatcher
│   ├── http/               # Router, Controller, Request, Response, middleware
│   ├── i18n/               # Internationalization
│   ├── logging/            # Pino logger
│   ├── mail/               # Mailer (Nodemailer)
│   ├── playground/         # API Playground UI
│   ├── providers/          # Service providers (boot order)
│   ├── queue/              # Queue drivers (Sync, BullMQ)
│   ├── scheduling/         # Cron scheduler
│   ├── storage/            # Storage drivers (Local, S3)
│   ├── support/            # Helpers (Str, Collection, env, sleep)
│   ├── testing/            # HTTP test client
│   ├── validation/         # Zod validator
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
- Migrations use Knex.js — export `up(knex)` and `down(knex)` functions
- Use `knex.schema.createTable()` in `up()`, `knex.schema.dropTableIfExists()` in `down()`

---

## CLI Commands (Use for Scaffolding)

```bash
npx tsx bin/hyperz.ts make:controller <Name>        # Create controller
npx tsx bin/hyperz.ts make:model <Name> [-m]         # Create model (with migration)
npx tsx bin/hyperz.ts make:migration <name>          # Create migration
npx tsx bin/hyperz.ts make:seeder <Name>             # Create seeder
npx tsx bin/hyperz.ts make:middleware <Name>          # Create middleware
npx tsx bin/hyperz.ts make:route <name>              # Create route file
npx tsx bin/hyperz.ts make:job <Name>                # Create queue job
npx tsx bin/hyperz.ts make:factory <Name>            # Create database factory
npx tsx bin/hyperz.ts make:ai-action <Name>          # Create AI action
npx tsx bin/hyperz.ts make:auth                      # Scaffold full auth system
npx tsx bin/hyperz.ts migrate                        # Run migrations
npx tsx bin/hyperz.ts migrate:rollback               # Rollback migrations
npx tsx bin/hyperz.ts db:seed                        # Run seeders
npx tsx bin/hyperz.ts key:generate                   # Generate APP_KEY + JWT_SECRET
npx tsx bin/hyperz.ts route:list                     # List routes
npx tsx bin/hyperz.ts tinker                         # Interactive REPL
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
7. **Run `npx tsx bin/hyperz.ts migrate`** after creating migrations
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

---

## Quick Reference

**Start dev:** `npm run dev`
**Run migration:** `npx tsx bin/hyperz.ts migrate`
**Create resource:** `npx tsx bin/hyperz.ts make:controller ProductController && npx tsx bin/hyperz.ts make:model Product -m`
**API base URL:** `http://localhost:7700/api`
**Playground:** `http://localhost:7700/api/playground`
**Admin panel:** `http://localhost:3000` (requires `cd admin && npm run dev`)
