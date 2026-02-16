# ⚡ HyperZ Framework — Product Features Specification

**Version:** 2.0.0  
**Last Updated:** February 2026  
**Author:** Shahjahan Ali  
**License:** MIT  

---

## 1. Executive Summary

HyperZ v2 is built as an **AI-Native Enterprise Backend Platform**. Unlike traditional frameworks where AI is an afterthought or an external plugin, HyperZ integrates AI into the core request lifecycle, routing, and SaaS logic.
HyperZ is a modern, Laravel-inspired, enterprise-grade API framework built on Express.js and TypeScript. It provides a batteries-included development experience with a powerful CLI, service-provider architecture, and 20+ built-in subsystems — from authentication and database to AI integration and a live API testing playground.

---

## 2. Core Architecture

### 2.1 Service Container (IoC)
- Dependency injection container with singleton and transient bindings
- `app.make<T>('binding')` resolution API
- **Advanced Decorators (`@Injectable`, `@Singleton`)** for class-based DI
- Auto-wiring and instance registration
- **Constructor injection** with automatic resolution

### 2.2 Service Provider Pattern
- Modular boot/register lifecycle
- Provider ordering (App → Database → Events → Cache → Routes)
- Custom provider support

### 2.3 Configuration Manager
- Environment-based config via `.env` files
- Hierarchical config files (`config/*.ts`)
- `env()` helper with defaults
- Multi-environment support (development, staging, production)

### 2.4 Application Kernel
- Express.js 5.x integration
- Automatic middleware registration
- Graceful shutdown handling

---

## 3. HTTP Layer

### 3.1 Router
- **Laravel-style routing** with groups, prefixes, and named routes
- Resource routes (`router.resource()` → auto-generates CRUD)
- Route middleware chaining
- Auto-discovery of route files from `app/routes/`

### 3.2 Controllers
- Base `Controller` class with response helpers:
  - `this.success(res, data, message)`
  - `this.created(res, data, message)`
  - `this.error(res, message, status)`
  - `this.noContent(res)`
  - `this.paginate(res, data, total, page, perPage)`

### 3.3 Built-in Middleware
| Middleware | Description |
|---|---|
| JWT Auth | Token verification and user injection |
| CORS | Cross-origin resource sharing |
| Helmet | Security headers |
| Rate Limiting | Request throttling (configurable) |
| Request Logging | Structured HTTP request logging |

### 3.4 Request Validation
- **Zod**-powered schema validation
- Validates body, query, and params
- Type-safe — validated data is typed
- Auto `422 Unprocessable Entity` on failure with field-level errors

### 3.5 Exception Handling
- Centralized HTTP exception handler
- Custom exception classes (NotFound, Unauthorized, Forbidden, etc.)
- JSON error responses with debug stack traces in development

---

## 4. Database Layer

### 4.1 SQL Database (TypeORM)
- **SQLite** (default — zero config)
- **MySQL** and **PostgreSQL** drivers
- Advanced ORM with Data Mapper & Active Record support
- Connection pooling

### 4.2 MongoDB (Mongoose)
- Optional dual-database support alongside SQL
- Configurable via `MONGO_ENABLED=true`

### 4.3 Migrations
- Timestamped migration files
- `migrate` and `migrate:rollback` CLI commands
- Schema builder for table creation and modification

### 4.4 Seeders
- Database seeding for test/dev data
- Individual seeder execution support
- `db:seed` and `db:seed -c <Name>` commands

### 4.5 Active Record Model
- Full CRUD operations (`find`, `create`, `update`, `delete`)
- Soft deletes with `restore` and `forceDelete`
- Automatic timestamps (`created_at`, `updated_at`)
- Fillable and hidden field definitions
- Table name auto-pluralization

### 4.6 Database Factories *(NEW)*
- `Factory.define()` and `Factory.create()` API
- Batch creation with `Factory.createMany()`
- Faker-ready integration
- `make:factory` CLI scaffolding

---

## 5. Authentication & Authorization

### 5.1 JWT Authentication
- Login, register, token refresh
- Configurable expiration (`JWT_EXPIRATION`)
- Secure bcrypt password hashing

### 5.2 Role-Based Access Control (RBAC)
- Role middleware: `roleMiddleware('admin')`
- Permission middleware: `permissionMiddleware('delete-users')`
- Database-backed roles and permissions tables

### 5.3 Gates & Policies
- `Gate.define('ability', callback)` for custom authorization
- `Gate.allows()` / `Gate.denies()` checks
- Policy classes for resource-based authorization

### 5.4 Auth Scaffolding
- `make:auth` generates:
  - AuthController (login, register, me)
  - Auth routes
  - Users, Roles, Permissions migration files

---

## 6. Caching

### 6.1 Memory Driver (Default)
- In-process Map-based cache
- TTL support with automatic expiration
- Zero-config, ideal for development

### 6.2 Redis Driver *(NEW)*
- **ioredis**-powered connection
- Full `get`, `put`, `forget`, `flush`, `has` API
- Configurable host, port, password

### 6.3 Cache API
- `cache.get(key)` — retrieve
- `cache.put(key, value, ttlSeconds)` — store
- `cache.remember(key, ttl, callback)` — get-or-compute
- `cache.forget(key)` — remove
- `cache.flush()` — clear all

---

## 7. Queue System

### 7.1 Sync Driver (Default)
- Immediate job execution
- Ideal for development and simple workloads

### 7.2 BullMQ Driver *(NEW)*
- **Redis-backed** reliable queue
- Delayed job dispatching with `dispatchLater(job, delayMs)`
- Worker process for background execution

### 7.3 Job Classes
- Extend `BaseJob` with `name` and `handle()` method
- `make:job` CLI scaffolding

---

## 8. File Storage

### 8.1 Local Driver (Default)
- Filesystem-based storage in `storage/uploads/`
- Automatic directory creation

### 8.2 S3 Driver *(NEW)*
- **AWS S3** / S3-compatible storage
- `put`, `get`, `delete`, `exists`, `url` API
- Configurable bucket, region, credentials

### 8.3 Multi-Disk Support
- Named disks (e.g., `local`, `s3`)
- `storage.disk('s3').put(path, content)`

---

## 20. Enterprise SaaS Core

HyperZ v2 explicitly solves the "SaaS Plumbing" problem by providing native, production-grade infrastructure.

| Feature | Status | Description |
|---|---|---|
| **Subdomain Tenancy** | ✅ Implemented | Automated tenant resolution from request headers. |
| **Tenant Isolation** | ✅ Implemented | **Database Connection Pooling** with tenant-specific isolation. |
| **Usage Metering** | ✅ Implemented | Real-time tracking of API calls, AI tokens, and storage for billing. |
| **Stripe Billing** | ✅ Implemented | Built-in checkout session and subscription lifecycle hooks. |
| **Audit Logging** | ✅ Implemented | Compliance-ready recording of all critical mutations with tenant context. |
| **API Key Mgmt** | ✅ Implemented | Secure generation and validation of tenant-scoped API keys. |
| **Rate Limiting** | ✅ Implemented | Multi-tier throttling (Free, Standard, Pro) per user/tenant. |
| **SaaS Metrics** | ✅ Implemented | Real-time business and system health dashboard. |

## 9. WebSocket *(NEW)*

### 9.1 Socket.io Integration
- Real-time bidirectional communication
- Channel / namespace support
- Room management (join, leave, broadcast)

### 9.2 Features
- `ws.onConnection(callback)` — connection handler
- `ws.channel(namespace, handler)` — namespace routing
- `ws.broadcast(channel, event, data)` — broadcast to all
- `ws.to(room).emit(event, data)` — room-specific messaging

---

## 10. AI Engine Layer (Core)

HyperZ v2 introduces a dedicated AI orchestration layer that is deeply integrated into the request lifecycle.

### 10.1 AI-Aware Architecture
- **Model Abstraction:** Unified interface for OpenAI, Anthropic, Google, and Local models.
- **Request Lifecycle Integration:** Use `router.ai()` to define routes that automatically handle cost tracking and context injection.
- **AI-Managed Memory:** Built-in semantic memory via the Vector System.
- **Workflow Orchestration:** Autonomous agent workforce with skill and tool-calling capabilities.

### 10.2 Model Fallback & Reliability
- **Automatic Fallback:** Intelligently retry failed requests on alternative providers (e.g., GPT-4 -> Claude 3.5).
- **Cost & Token Tracking:** Precise per-request and per-tenant usage metering for billing and observability.
- **AI Latency Analytics:** Track model performance directly in the Admin Dashboard.

### 10.4 Prompt Management
- **Directory-based templates** in `app/prompts/`
- **Versioning support** using `@v1` or `@latest` tags in naming
- Variable interpolation using `{{var}}` syntax
- `PromptManager.load(name, variables)` API

### 10.5 Vector DB Adapters
- **RAG-ready interface** for similarity search
- Adapters for **pgvector (Postgres)**, **Weaviate**, Pinecone, and Qdrant
- Simple `upsert`, `search`, and `delete` operations
- `VectorDB.use(adapter)` registry

### 10.6 AI Agent Module (NEW)
- **Autonomous Agent Factory** (`Agent.create()`)
- Skill-based behavior configuration
- Memory management (Short-term, Vector, Persistent)
- Tool-calling infrastructure integration

### 10.3 AI Action Scaffolding
- `make:ai-action <Name>` CLI command
- Generates ready-to-use action class in `app/ai/`

---

## 11. API Playground *(NEW)*

### 11.1 Built-in API Testing UI
- Custom, Postman-like interface at `/api/playground`
- No external tools or dependencies

### 11.2 Features
| Feature | Description |
|---|---|
| Route Discovery | Auto-detects all registered API routes |
| Request Builder | Method, URL, headers, body, query params |
| Auth Support | Bearer Token, Basic Auth, API Key |
| Response Viewer | Status, headers, JSON-highlighted body |
| Performance | Response time and payload size metrics |
| Error Log | Captures 4xx/5xx errors |
| Request History | Browse and replay requests |
| Theme Toggle | Dark / Light mode |
| Keyboard Shortcuts | Ctrl+Enter to send |

---

## 12. i18n / Localization *(NEW)*

### 12.1 Features
- JSON-based translation files (`lang/<locale>/messages.json`)
- Placeholder interpolation: `I18n.t('greeting', { name: 'John' })`
- Nested key resolution: `I18n.t('errors.not_found')`
- Locale switching: `I18n.setLocale('bn')`
- Fallback locale support

### 12.2 Included Languages
- English (`en`)
- Bengali (`bn`)

---

## 13. Plugin System *(NEW)*

### 13.1 Plugin Manager
- Auto-discovery from `plugins/` directory
- `PluginManager.loadAll()` — discover and register plugins
- Lifecycle hooks: `register()` and `boot()`
- Plugin dependency resolution

---

## 14. Testing *(NEW)*

### 14.1 HTTP Test Client
- `TestClient.get/post/put/delete(path)` API
- Header and body assertions
- Bearer token injection
- Integration with Vitest

---

## 15. CLI System

### 15.1 Available Commands (16+)

| Command | Description |
|---|---|
| `make:controller <Name>` | Scaffold a controller |
| `make:model <Name> [-m]` | Scaffold a model (with migration) |
| `make:migration <name>` | Create a migration file |
| `make:seeder <Name>` | Create a seeder file |
| `make:middleware <Name>` | Create a middleware |
| `make:route <name>` | Create a route file |
| `make:auth` | Scaffold complete auth system |
| `make:job <Name>` | Create a queue job |
| `make:factory <Name>` | Create a database factory |
| `make:ai-action <Name>` | Create an AI action class |
| `migrate` | Run pending migrations |
| `migrate:rollback` | Rollback last migration batch |
| `db:seed` | Run all seeders |
| `key:generate` | Generate application key |
| `serve` | Start development server |
| `route:list` | List registered routes |
| `tinker` | Interactive REPL |

---

## 16. Events & Scheduling

### 16.1 Event Dispatcher
- Pub/Sub pattern with async listeners
- `EventDispatcher.on(event, callback)` — register
- `EventDispatcher.dispatch(event, payload)` — fire

### 16.2 Task Scheduler
- Fluent scheduling API
- `.everyMinute()`, `.hourly()`, `.daily()`, `.weekly()`, `.cron()`
- Named tasks with collision prevention

---

## 17. Mail

### 17.1 Nodemailer Integration
- SMTP transport (configurable)
- HTML and plain text emails
- From name/address configuration

---

## 18. Logging

### 18.1 Pino Logger
- Structured JSON logging
- Log levels: `debug`, `info`, `warn`, `error`
- Pretty-print in development
- File and console output channels

---

## 19. Utilities

### 19.1 Helper Functions
- `env(key, default)` — environment variable access
- `sleep(ms)` — async delay
- `randomString(length)` — random string generation
- `now()` — current ISO timestamp

### 19.2 String Helpers (Str)
- `Str.slug()`, `Str.camel()`, `Str.pascal()`, `Str.snake()`
- `Str.plural()`, `Str.singular()`
- `Str.random()`, `Str.uuid()`

### 19.3 Collection Class
- Fluent array manipulation
- `map()`, `filter()`, `reduce()`, `sort()`, `groupBy()`
- `first()`, `last()`, `pluck()`, `unique()`

---

## 20. Deployment & Configuration

### 20.1 Environment Support
- `.env` files for per-environment config
- `.env.example` template for new developers
- Environment-aware debug mode

### 20.2 TypeScript Configuration
- Strict mode enabled
- ES module output
- Path aliases configured

---

## 21. Admin Panel *(NEW)*

### 21.1 Next.js Dashboard
- Separate Next.js application in `admin/` directory
- Dark glassmorphism UI matching API Playground aesthetic
- Proxied API communication via `next.config.js` rewrites
- Runs on port **3100**, connects to HyperZ API on port **7700**

### 21.2 Admin API (`/api/_admin/*`)
- System overview (uptime, memory, CPU, Node version)
- `.env` read/write endpoints
- Config file browser
- Route introspection (lists all registered Express routes)
- Scaffolding engine (create controllers, models, migrations, seeders, middleware, routes, jobs, factories)
- Database management (list tables, browse data, run migrations, rollback, seed)
- Log file viewer
- Cache flush
- Project file browser (safe directories only)

### 21.3 Admin Pages
| Page | Features |
|---|---|
| Dashboard | System health stats, quick actions, uptime, memory |
| Scaffolding | 8-type resource creator with visual selector |
| Database | Table browser, schema viewer, migration runner |
| Routes | Route list with method badges, search, filter |
| Config & Env | Inline `.env` editor, config file viewer |
| Cache & Queue | Service status cards, cache flush |
| Logs | Auto-refresh log viewer with color-coded levels |
| AI Gateway | Provider status, config overview |

---

## 22. AI Agent Compatibility *(NEW)*

### 22.1 First-Class AI Agent Support
- Designed for AI agentic development tools (Cursor, Copilot, Antigravity, Claude Code, Windsurf)
- Convention-over-configuration patterns optimized for AI reasoning
- CLI scaffolding commands that agents can execute directly

### 22.2 Agent Configuration Files
| File | Tool | Purpose |
|---|---|---|
| `AGENTS.md` | All AI tools | Project conventions, rules, and quick reference |
| `ARCHITECTURE.md` | All AI tools | System diagrams, boot order, subsystem map |
| `.cursorrules` | Cursor | Project-specific coding rules |
| `.github/copilot-instructions.md` | GitHub Copilot | Workspace-aware suggestions |
| `.agent/workflows/*.md` | Antigravity | Step-by-step task guides |

### 22.3 Workflow System
Pre-built workflows in `.agent/workflows/`:
- `add-crud-resource.md` — Complete CRUD feature creation
- `add-middleware.md` — Custom middleware creation
- `database-operations.md` — Migrations, seeders, factories
- `add-ai-action.md` — AI Gateway action creation
- `run-dev.md` — Development environment setup

---

## 23. MCP Server (Model Context Protocol) *(NEW)*

### 23.1 Built-in MCP Server
- Full Model Context Protocol implementation using `@modelcontextprotocol/sdk`
- Supports **stdio** (local AI tools) and **Streamable HTTP** (web agents) transports
- Exposes HyperZ's CLI, database, routes, and config to any MCP-compatible AI client

### 23.2 MCP Tools (13)
| Category | Tools |
|---|---|
| Scaffolding (8) | `scaffold_controller`, `scaffold_model`, `scaffold_migration`, `scaffold_seeder`, `scaffold_middleware`, `scaffold_route`, `scaffold_job`, `scaffold_ai_action` |
| Database (3) | `run_migration`, `run_migration_rollback`, `run_seed` |
| Inspection (2) | `list_routes`, `read_env` |

### 23.3 MCP Resources (6)
| URI | Description |
|---|---|
| `hyperz://project/structure` | Project directory tree |
| `hyperz://project/routes` | Registered API routes |
| `hyperz://project/env` | Environment variables (secrets masked) |
| `hyperz://project/config` | Config file contents |
| `hyperz://database/tables` | Database table list |
| `hyperz://database/migrations` | Migration file status |

### 23.4 MCP Prompts (4)
- `create_crud_resource` — Full CRUD resource creation guide
- `debug_api_endpoint` — API debugging assistant
- `add_auth_to_route` — JWT + RBAC setup guide
- `optimize_database` — Database optimization suggestions

### 23.5 Admin Panel Integration
- Visual component map showing tools, resources, and prompts
- Tool tester for direct execution from the UI
- AI automation panel with one-click database operations
- Connection configuration for Claude Desktop, Cursor, and other MCP clients

---

## 24. Swagger/OpenAPI Auto-Documentation *(NEW)*

### 24.1 Auto-Generated Spec
- Runtime OpenAPI 3.1 spec generated by scanning Express routes
- Derives tags from URL segments, converts `:param` to `{param}`
- Auto-generates parameters, request bodies, and responses by HTTP method
- JWT + API key security schemes configured in `config/docs.ts`

### 24.2 Dark-Themed Swagger UI
- Self-contained Swagger UI served at `/api/docs`
- Dark theme matching HyperZ admin panel aesthetic
- Color-coded HTTP method blocks (GET=green, POST=blue, PUT=orange, DELETE=red)
- Raw JSON spec at `/api/docs/json`

---

## 25. Per-User / Per-API-Key Rate Limiting *(NEW)*

### 25.1 Rate Limit Tiers
| Tier | Requests/min |
|---|---|
| Free | 60 |
| Standard | 300 |
| Pro | 1,000 |
| Enterprise | 10,000 |

### 25.2 Key Resolution Priority
1. API key header (`X-API-Key`) → per-key limit
2. JWT user ID → per-user limit
3. IP address → fallback

### 25.3 Response Headers
- `X-RateLimit-Limit` — max requests in window
- `X-RateLimit-Remaining` — remaining requests
- `X-RateLimit-Reset` — window reset timestamp
- `Retry-After` — seconds until retry (on 429)

---

## 26. Real-time Dashboard & Monitoring *(NEW)*

### 26.1 Metrics Collected
- Response time (avg, P95, P99)
- Requests per second
- Status code distribution (2xx/3xx/4xx/5xx)
- HTTP method breakdown
- Top 10 endpoints by traffic
- Error rate percentage

### 26.2 System Metrics
- CPU usage (delta-based calculation)
- Memory (heap used, RSS, OS total/free)
- Event loop lag measurement
- V8 heap statistics
- Active handles & requests count

### 26.3 Admin Dashboard
- SVG gauge rings for CPU, memory, V8 heap, event loop lag
- Sparkline charts for throughput, latency, and errors (60s window)
- **Top Endpoints Dashboard** showing most frequent and slowest routes
- **Event Loop Lag Monitoring** to detect blocking operations
- Auto-refresh every 2 seconds with pause/resume control

---

## 27. GraphQL Integration Layer *(NEW)*

### 27.1 Auto-Generated Schema
- Discovers models from `app/models/` directory
- Reads `fillable` fields and `table` names from model classes
- Infers GraphQL types from field naming conventions
- Generates full SDL: types, Query, Mutation, Input types

### 27.2 Runtime Behavior
- **With graphql-yoga**: Full CRUD resolvers connected to TypeORM database
- **Without graphql-yoga**: Built-in lightweight handler with GraphiQL IDE + health query

### 27.3 Endpoints
- `GET /graphql` — GraphiQL IDE
- `POST /graphql` — Query execution
- `GET /graphql/schema` — Schema info for admin panel

