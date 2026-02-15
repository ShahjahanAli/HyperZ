# ⚡ HyperZ Framework — Architecture Guide

## System Overview

```
                    ┌─────────────────────────────────────────────┐
                    │                  server.ts                  │
                    │  (Entry point — createApp, boot, listen)    │
                    └────────────────────┬────────────────────────┘
                                         │
                    ┌────────────────────▼────────────────────────┐
                    │                   app.ts                    │
                    │  (createApp → Application instance)         │
                    └────────────────────┬────────────────────────┘
                                         │
              ┌──────────────────────────▼──────────────────────────┐
              │              Service Provider Boot Order             │
              │                                                      │
              │  1. AppServiceProvider     → core bindings           │
              │  2. DatabaseProvider       → Knex + Mongoose         │
              │  3. EventServiceProvider   → event dispatcher        │
              │  4. CacheServiceProvider   → memory/redis driver     │
              │  5. RouteServiceProvider   → auto-load app/routes/*  │
              │  6. SchedulingProvider     → cron scheduler          │
              │  7. QueueProvider          → sync/BullMQ driver      │
              │  8. StorageProvider        → local/S3 driver         │
              │  9. MailProvider           → SMTP mailer             │
              │ 10. WebSocketProvider      → Socket.io               │
              │ 11. AIServiceProvider      → AI Gateway              │
              └──────────────────────────┬──────────────────────────┘
                                         │
         ┌───────────────────────────────▼───────────────────────────────┐
         │                    Express.js 5 Application                   │
         │                                                               │
         │  Middleware Stack:                                            │
         │    CORS → Helmet → Body Parser → Request Logger → Routes     │
         │                                                               │
         │  Route Groups:                                                │
         │    /api/*           ← app/routes/*.ts (auto-loaded)          │
         │    /api/playground  ← Built-in API Playground UI             │
         │    /api/_admin/*    ← Admin API (src/admin/AdminAPI.ts)      │
         └───────────────────────────────────────────────────────────────┘
```

---

## Request Lifecycle

```
Client Request
     │
     ▼
Express Middleware Stack
     │  ├── CORS
     │  ├── Helmet (Security Headers)
     │  ├── Body Parser (JSON)
     │  ├── Request Logger (Pino)
     │  └── Rate Limiter
     │
     ▼
Router (HyperZRouter)
     │  ├── Route-level Middleware (auth, validation, roles, etc.)
     │  └── Route Handler → Controller Method
     │
     ▼
Controller
     │  ├── Request Validation (Zod schema)
     │  ├── Business Logic (Model queries, services)
     │  ├── Events (EventDispatcher.dispatch)
     │  └── Response Helper (this.success / this.error)
     │
     ▼
Response → Client
```

---

## Core Subsystem Map

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   HTTP Layer │    │   Data Layer │    │  Service Layer│
│              │    │              │    │              │
│ • Router     │    │ • Database   │    │ • Cache      │
│ • Controller │◄──►│ • Model      │    │ • Queue      │
│ • Middleware │    │ • Migration  │    │ • Storage    │
│ • Validator  │    │ • Seeder     │    │ • Mail       │
│ • Exceptions │    │ • Factory    │    │ • Events     │
└──────────────┘    └──────────────┘    │ • Scheduler  │
                                        │ • WebSocket  │
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Auth Layer  │    │  AI Engine   │    │  SaaS Core   │
│              │    │              │    │              │
│ • JWT        │    │ • Fallback   │    │ • Tenancy    │
│ • RBAC       │    │ • Cost Track │    │ • Billing    │
│ • API Keys   │    │ • Actions    │    │ • DB Pooling │
└──────────────┘    └──────────────┘    └──────────────┘
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  RAG System  │    │   Tooling    │    │   DevTools   │
│              │    │              │    │              │
│ • Ingestion  │    │ • CLI (16+)  │    │ • Admin Panel│
│ • Vector DB  │    │ • MCP Server │    │ • Playground │
│ • Semantic   │    │ • Agents     │    │ • Monitoring │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## IoC Container

The Application class extends a dependency injection container:

```typescript
// Register a singleton
app.singleton('db', () => new Database(config));

// Register a transient binding
app.bind('logger', () => new Logger());

// Decorator-based DI (Automated)
@Injectable()
@Singleton()
class AuthService {
    constructor(private db: Database) {}
}

// Resolve
const db = app.make<Database>('db');
const auth = app.make(AuthService); // Nested dependencies auto-resolved
```

**Key bindings registered during boot:**
- `db` — Knex database instance
- `cache` — Cache driver (Memory or Redis)
- `queue` — Queue driver (Sync or BullMQ)
- `storage` — Storage driver (Local or S3)
- `mailer` — Mailer instance
- `events` — EventDispatcher
- `scheduler` — Task Scheduler
- `ai` — AI Gateway
- `prompts` — PromptManager
- `vector` — VectorDB
- `monitor` — MetricsCollector

---

## File Ownership

| Directory | Ownership | Notes |
|---|---|---|
| `app/` | **Developer** | Your application code — controllers, models, routes, etc. |
| `config/` | **Developer** | Configuration files, can customize freely |
| `database/` | **Developer** | Migrations, seeders, factories, SQLite file |
| `lang/` | **Developer** | Translation files |
| `plugins/` | **Developer** | Custom plugins |
| `storage/` | **Runtime** | Auto-generated logs, cache, uploads |
| `src/` | **Framework** | Core framework — do not edit unless extending |
| `admin/` | **Framework** | Next.js admin panel |
| `bin/` | **Framework** | CLI entry point |

---

## Database Architecture

```
┌─────────────────────────────────────────────────┐
│              Database Manager                    │
│                                                  │
│  ┌──────────────┐    ┌──────────────────────┐   │
│  │    SQL        │    │     MongoDB          │   │
│  │  (Knex.js)   │    │   (Mongoose)         │   │
│  │              │    │                      │   │
│  │ • SQLite     │    │ • Optional           │   │
│  │ • MySQL      │    │ • MONGO_ENABLED=true │   │
│  │ • PostgreSQL │    │ • Parallel to SQL    │   │
│  └──────┬───────┘    └──────────────────────┘   │
│         │                                        │
│  ┌──────▼───────┐                               │
│  │   Model      │  ← Active Record pattern      │
│  │  (Base class) │     find, create, update,     │
│  │              │     delete, softDelete         │
│  └──────────────┘                               │
└─────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
Register/Login Request
     │
     ▼
AuthController
     │  ├── Validate credentials (Zod)
     │  ├── Hash password (bcrypt)
     │  └── Generate JWT token
     │
     ▼
Protected Route Request
     │
     ▼
authMiddleware()
     │  ├── Extract Bearer token
     │  ├── Verify JWT signature
     │  └── Inject req.user
     │
     ▼
roleMiddleware('admin')  /  permissionMiddleware('delete-users')
     │  ├── Check user roles/permissions from DB
     │  └── Allow or 403
     │
     ▼
Gate.allows('ability', user, resource)
     │  └── Custom authorization logic
```
