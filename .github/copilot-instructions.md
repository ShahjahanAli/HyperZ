# HyperZ Framework — GitHub Copilot Instructions

## Project Context
This is **HyperZ**, a Laravel-inspired API framework built on Express.js 5 and TypeScript (strict mode, ES Modules). The framework uses a service-provider architecture with IoC container.

## Code Style
- TypeScript strict mode — never use `any`
- Use `.js` extensions in import paths (ES Module output)
- Use `type` for type-only imports: `import type { Request } from 'express'`
- Named exports only (no default exports, except route files)
- PascalCase for classes, camelCase for functions/variables, snake_case for migrations

## Where to Write Code
- **Your code:** `app/` directory (controllers, models, routes, middleware, jobs, AI actions)
- **Config:** `config/` directory
- **Database:** `database/` directory (migrations, seeders, factories)
- **Framework core:** `src/` — do NOT modify unless explicitly asked

## Key Patterns
- Controllers extend `Controller` from `../../src/http/Controller.js`
- Models extend `Model` from `../../src/database/Model.js`
- Jobs extend `BaseJob` from `../../src/queue/QueueManager.js`
- Routes use `HyperZRouter` from `../../src/http/Router.js`
- Validation uses Zod schemas with `validate()` middleware
- Use `router.resource('/path', controller)` for CRUD routes
- Bind methods in routes: `controller.method.bind(controller)`

## Response Helpers (Controllers)
- `this.success(res, data, message)` → 200
- `this.created(res, data, message)` → 201
- `this.error(res, message, status)` → error
- `this.noContent(res)` → 204
- `this.paginate(res, data, total, page, perPage)`

## CLI Commands
Prefer CLI scaffolding over manual file creation:
```
npx tsx bin/hyperz.ts make:controller <Name>Controller
npx tsx bin/hyperz.ts make:model <Name> -m
npx tsx bin/hyperz.ts make:migration <name>
npx tsx bin/hyperz.ts make:seeder <Name>Seeder
npx tsx bin/hyperz.ts make:middleware <Name>Middleware
npx tsx bin/hyperz.ts make:route <name>
npx tsx bin/hyperz.ts make:job <Name>
npx tsx bin/hyperz.ts make:factory <Name>Factory
npx tsx bin/hyperz.ts make:ai-action <Name>Action
npx tsx bin/hyperz.ts make:test <Name> [-f]
npx tsx bin/hyperz.ts make:module <Name>
npx tsx bin/hyperz.ts migrate
```

## Key Patterns
- Security: `Encrypter.encrypt()/.decrypt()`, `HashService.make()/.check()`, `SignedUrl.create()/.verify()`
- Feature Flags: `FeatureFlags.enabled('flag')`, `featureMiddleware('flag')` for route gating
- Query Builder: `DB.table('x').where('col', 'val').get()` for raw SQL queries
- Lifecycle Hooks: `LifecycleHooks.onRequest()/.onResponse()/.onError()/.onFinish()`
- Audit Log: `AuditLog.record()`, `AuditLog.recordChange()` for tracking
- Webhooks: `WebhookManager.register()`, `WebhookManager.dispatch()`
- AI Streaming: `new StreamResponse(res).start().write('token').end()`

## Key Files
- `server.ts` — Server entry point
- `app.ts` — Application bootstrap
- `config/security.ts` — Security configuration
- `config/features.ts` — Feature flag definitions
- `config/webhooks.ts` — Webhook configuration
- `AGENTS.md` — Full AI agent guide
- `ARCHITECTURE.md` — System architecture diagrams
