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
npx hyperz make:controller <Name>Controller [--model <M>]
npx hyperz make:model <Name> -m
npx hyperz make:migration <name>
npx hyperz make:seeder <Name>Seeder
npx hyperz make:middleware <Name>Middleware
npx hyperz make:route <name>
npx hyperz make:job <Name>
npx hyperz make:factory <Name>Factory
npx hyperz make:ai-action <Name>Action
npx hyperz make:test <Name> [-f]
npx hyperz make:module <Name>
npx hyperz make:plugin <Name>
npx hyperz make:auth
npx hyperz migrate
npx hyperz migrate:rollback
npx hyperz db:seed
npx hyperz key:generate
npx hyperz serve
npx hyperz route:list
npx hyperz tinker
npx hyperz plugin:list
npx hyperz plugin:install <package>
npx hyperz plugin:remove <package>
npx hyperz plugin:enable <name>
npx hyperz plugin:disable <name>
npx hyperz plugin:health
npx hyperz plugin:update [package] [--latest]
npx hyperz plugin:graph [--json]
npx hyperz plugin:metrics
npx hyperz vendor:publish [--plugin=<name>] [--tag=<tag>] [--force]
```

## Key Patterns
- Security: `Encrypter.encrypt()/.decrypt()`, `HashService.make()/.check()`, `SignedUrl.create()/.verify()`
- Feature Flags: `FeatureFlags.enabled('flag')`, `featureMiddleware('flag')` for route gating
- Query Builder: `DB.table('x').where('col', 'val').get()` for raw SQL queries
- Lifecycle Hooks: `LifecycleHooks.onRequest()/.onResponse()/.onError()/.onFinish()`
- Audit Log: `AuditLog.record()`, `AuditLog.recordChange()` for tracking
- Webhooks: `WebhookManager.register()`, `WebhookManager.dispatch()`
- AI Streaming: `new StreamResponse(res).start().write('token').end()`
- Plugins: `app.plugins.discover()`, `app.plugins.bootAll()`, `app.plugins.healthCheck()`
- Plugin Definition: `definePlugin({ meta, hooks, config, resources, publishable })`
- PublishManager: `new PublishManager(app).publish(pluginName, { tag, force })`
- Route Registry: `routeRegistry.register(method, path, source)` for collision detection
- Plugin Testing: `testPlugin(plugin, options)`, `createTestApp()`, `assertPluginBooted()`
- Plugin Metrics: `app.plugins.getMetrics(name)`, `app.plugins.getAllMetrics()`
- Plugin Dev Watcher: `new PluginDevWatcher(app).start()` — watches plugins/ for changes

## Key Files
- `server.ts` — Server entry point
- `app.ts` — Application bootstrap
- `config/security.ts` — Security configuration
- `config/features.ts` — Feature flag definitions
- `config/plugins.ts` — Plugin ecosystem configuration
- `config/webhooks.ts` — Webhook configuration
- `src/core/PluginContract.ts` — Plugin interface & `definePlugin()` helper
- `src/core/PluginManagerV2.ts` — Plugin lifecycle manager
- `src/core/PublishManager.ts` — Plugin resource publisher
- `src/core/PluginDevWatcher.ts` — Plugin hot-reload watcher (dev mode)
- `src/http/RouteRegistry.ts` — Route collision detection registry
- `src/testing/PluginTestUtils.ts` — Plugin test harness & assertion helpers
- `src/providers/PluginServiceProvider.ts` — Plugin service provider
- `plugins/` — Local plugin directory (auto-discovered)
- `AGENTS.md` — Full AI agent guide
- `ARCHITECTURE.md` — System architecture diagrams
