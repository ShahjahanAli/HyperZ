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
              │  2. SecurityProvider       → HTTPS, sanitize, CSRF   │
              │  3. FeaturesProvider       → lifecycle hooks, flags  │
              │  4. DatabaseProvider       → TypeORM + Mongoose      │
              │  5. EventServiceProvider   → event dispatcher        │
              │  6. CacheServiceProvider   → memory/redis driver     │
              │  7. RouteServiceProvider   → auto-load app/routes/*  │
              │  8. SchedulingProvider     → cron scheduler          │
              │  9. QueueProvider          → sync/BullMQ driver      │
              │ 10. StorageProvider        → local/S3 driver         │
              │ 11. MailProvider           → SMTP mailer             │
              │ 12. WebSocketProvider      → Socket.io               │
              │ 13. AIServiceProvider      → AI Gateway              │
              └──────────────────────────┬──────────────────────────┘
                                         │
         ┌───────────────────────────────▼───────────────────────────────┐
         │                    Express.js 5 Application                   │
         │                                                               │
         │  Middleware Stack:                                            │
         │    CORS → Helmet → Body Parser → HTTPS Redirect →          │
         │    Sanitize → CSRF → Lifecycle Hooks → Audit Log →        │
         │    Request Logger → Rate Limiter → Routes                  │
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
     │  ├── HTTPS Redirect (production)
     │  ├── Request Sanitization (XSS + prototype pollution)
     │  ├── CSRF Protection (double-submit cookie)
     │  ├── Lifecycle Hooks (onRequest)
     │  ├── Audit Log (POST/PUT/PATCH/DELETE)
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
│ • Encrypter  │    │ • Streaming  │    │ • Metering   │
│ • SignedUrl  │    │ • Agents     │    │ • Webhooks   │
│ • Hash       │    │              │    │              │
│ • Blacklist  │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  RAG System  │    │   Tooling    │    │   DevTools   │
│              │    │              │    │              │
│ • Ingestion  │    │ • CLI (18+)  │    │ • Admin Panel│
│ • Vector DB  │    │ • MCP Server │    │ • Playground │
│ • Semantic   │    │ • Agents     │    │ • Monitoring │
└──────────────┘    └──────────────┘    └──────────────┘
┌──────────────┐    ┌──────────────┐
│ Feature Flags│    │ Audit & Hook│
│              │    │              │
│ • Config     │    │ • AuditLog   │
│ • Env        │    │ • Lifecycle  │
│ • Custom     │    │ • onRequest  │
│ • Middleware │    │ • onResponse │
└──────────────┘    └──────────────┘
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
- `db` — TypeORM DataSource instance
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
- `hash` — HashService
- `tokenBlacklist` — TokenBlacklist
- `lifecycle` — LifecycleHooks
- `features` — FeatureFlags
- `audit` — AuditLog

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
│  │  (TypeORM)   │    │   (Mongoose)         │   │
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
     │  ├── Hash password (HashService / bcrypt)
     │  └── Generate JWT token
     │
     ▼
Protected Route Request
     │
     ▼
authMiddleware()
     │  ├── Extract Bearer token
     │  ├── Check TokenBlacklist (revoked?)
     │  ├── Verify JWT signature
     │  └── Inject req.user
     │
     ▼
apiKeyMiddleware(resolver, scopes)  OR  roleMiddleware('admin')
     │  ├── Resolve API key → SHA-256 lookup
     │  ├── Check scopes / roles / permissions
     │  └── Allow or 403
     │
     ▼
Gate.allows('ability', user, resource)
     │  └── Custom authorization logic
```
