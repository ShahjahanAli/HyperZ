<p align="center">
  <img src="https://img.shields.io/badge/⚡-HyperZ-blueviolet?style=for-the-badge&labelColor=000000" alt="HyperZ" />
</p>

<h1 align="center">HyperZ v2</h1>

<p align="center">
  <strong>The World's First AI-Native Enterprise SaaS Framework built on Express.js & TypeScript</strong>
</p>

<p align="center">
  <a href="#installation"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square" alt="Node.js" /></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white" alt="Express" /></a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#cli-commands">CLI</a> •
  <a href="#api-playground">Playground</a> •
  <a href="#ai-gateway">AI Gateway</a> •
  <a href="#admin-panel">Admin Panel</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#documentation">Docs</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Why HyperZ v2?

HyperZ v2 transforms Express.js from a simple middleware library into a **World-First AI-Native Enterprise Backend Platform**. Unlike traditional frameworks where AI is treated as an external plugin, HyperZ integrates AI directly into the **Core Architectural Layer** — request lifecycle, semantic routing, and SaaS logic. 

It bridges the gap between building "AI Wrappers" and "Enterprise AI Products." With native multi-tenancy, subscription metering, RAG pipelines, and autonomous agent modules, you can ship a scalable AI product with production-grade reliability in days.

---

## Features

| Category | What You Get |
|---|---|
| 🏗️ **Core** | IoC Service Container, Service Providers, Config Manager, Application Kernel |
| 🌐 **HTTP** | Laravel-style Router (groups, named routes, resource CRUD), Controller base class |
| 🛡️ **Middleware** | JWT Auth, CORS, Helmet, Rate Limiting, Request Logging, **XSS/CSRF Protection**, **HTTPS Enforcement** — all built-in |
| 🗄️ **Database**| **TypeORM** (SQL Engine) **+ Mongoose** (MongoDB) — Unified database support |
| 📊 **ORM** | Active Record Model (CRUD, soft deletes, timestamps, **Laravel-style proxies: `where`, `first`, `create`**) |
| 🔍 **Query Builder** | Fluent `DB.table().where().get()` facade for raw SQL beyond Active Record |
| 🔐 **Auth & RBAC** | JWT authentication, bcrypt hashing, Gates, Policies, Role & Permission middleware |
| ✅ **Validation** | Zod-powered request validation (body, query, params) with type safety |
| 🔧 **CLI** | 19 Artisan-style commands for scaffolding, migrations, seeding, AI actions, and more |
| 📡 **Events** | Pub/Sub event dispatcher with async listeners |
| 📬 **Mail** | Nodemailer integration with SMTP transport |
| 💾 **Cache** | Memory + **Redis** drivers with `remember()` helper |
| 📦 **Queue** | Sync + **BullMQ** (Redis) drivers with delayed job dispatching |
| 📁 **Storage** | Local filesystem + **AWS S3** drivers |
| 🌐 **WebSocket** | Real-time communication via Socket.io with channel & room management |
| 🤖 **AI Engine** | **Model Fallback, Cost Tracking**, Prompt Versioning, Unified **AI Actions** |
| 📚 **Native RAG** | **Document Ingestion Pipeline**, Semantic Search Middleware, **pgvector/Weaviate** |
| 🏢 **SaaS Core** | **Subdomain Multi-tenancy, Tenant-aware DB Pooling**, Stripe Billing, API Keys |
| 🕵️ **AI Agents** | **Autonomous Agent Factory** with Skill & Memory management system |
| 🛡️ **Enterprise** | **Audit Logging**, RBAC Policy Engine, Secrets Mgmt, Advanced IoC Decorators |
| 🔐 **Security** | **AES-256-GCM Encryption**, CSRF Protection, Request Sanitization, **Signed URLs**, Token Blacklisting, API Key Auth |
| 🎛️ **Feature Flags** | Config/env/custom driver-based feature toggles with per-user/tenant targeting |
| 🪝 **Lifecycle Hooks** | Global `onRequest`, `onResponse`, `onError`, `onFinish` hooks beyond middleware |
| 📡 **Webhooks** | HMAC-SHA256 signed dispatch, automatic retry with backoff, delivery logging |
| 🌊 **AI Streaming** | Server-Sent Events (SSE) helpers for real-time LLM token streaming |
| 📊 **Observability** | Real-time Metrics, **Slow Query Detection**, **System Health Checks**, AI Analytics |
| 🎮 **API Playground** | Built-in Postman-like API testing UI at `/api/playground` |
| 🧰 **Utilities** | String helpers, Collection class, global env/helpers, **SanitizeHtml** |
| 🔁 **Tinker** | Interactive REPL with preloaded app context |
| 🧠 **AI Agent-Ready** | Built-in support for Cursor, Copilot, Antigravity — with **MCP Server** |
| 📖 **Swagger/OpenAPI** | Auto-generated API docs at `/api/docs` with dark-themed Swagger UI |
| 🛡️ **Rate Limiting** | Per-user / per-API-key throttling with **Multi-tier support** |

---

## Installation

### Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 9.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/ShahjahanAli/HyperZ.git
cd HyperZ

# Install dependencies
npm install

# Generate application key & JWT secret
npx hyperz key:generate

# Copy environment config
cp .env.example .env

# Start development server (with hot-reload)
npm run dev
```

Your API is now running at **http://localhost:7700/api** ⚡

Visit the built-in API Playground at **http://localhost:7700/api/playground** 🎮

---

## Quick Start

### 1. Create a Persistent Controller

```bash
npx hyperz make:controller Post --model Post
```

This generates a fully functional `app/controllers/PostController.ts` linked to the `Post` model:

```typescript
import { Controller } from '../../src/http/Controller.js';
import { Post } from '../models/Post.js';
import type { Request, Response } from 'express';

export class PostController extends Controller {
  async index(req: Request, res: Response): Promise<void> {
    const items = await Post.all();
    this.success(res, items, 'Post index');
  }

  async store(req: Request, res: Response): Promise<void> {
    const item = await Post.create(req.body);
    this.created(res, item, 'Post created');
  }

  async show(req: Request, res: Response): Promise<void> {
    const item = await Post.findOrFail(req.params.id);
    this.success(res, item, 'Post found');
  }

  async update(req: Request, res: Response): Promise<void> {
    const item = await Post.findOrFail(req.params.id);
    await Object.assign(item, req.body).save();
    this.success(res, item, 'Post updated');
  }

  async destroy(req: Request, res: Response): Promise<void> {
    const item = await Post.findOrFail(req.params.id);
    await item.remove();
    this.noContent(res);
  }
}
```

### 2. Create a Model with Migration

```bash
npx hyperz make:model Post -m
```

This generates:
- `app/models/Post.ts` — Active Record model (TypeORM-based)
- `database/migrations/YYYYMMDDHHMMSS_create_posts_table.ts` — Native TypeORM migration

### 3. Register Routes

Edit `app/routes/api.ts`:

```typescript
import { HyperZRouter } from '../../src/http/Router.js';
import { PostController } from '../controllers/PostController.js';

const router = new HyperZRouter();
const posts = new PostController();

// Resource routes (GET, POST, PUT, DELETE)
router.resource('/posts', posts);

export default router;
```

### 4. Run Migrations

```bash
npx hyperz migrate
```

### 5. Visit Your API

```
GET  http://localhost:7700/api            → Welcome message
GET  http://localhost:7700/api/health     → Health check
GET  http://localhost:7700/api/posts      → Your posts
GET  http://localhost:7700/api/playground → API Playground 🎮
```

---

## CLI Commands

HyperZ provides an Artisan-style CLI for rapid development:

```bash
# Scaffolding
npx hyperz make:controller <Name> [--model <M>] # Create a controller (with CRUD if -m provided)
npx hyperz make:model <Name> [-m]      # Create a model (-m = with migration)
npx hyperz make:migration <name>       # Create a migration
npx hyperz make:seeder <Name>          # Create a seeder
npx hyperz make:middleware <Name>       # Create a middleware
npx hyperz make:route <name>           # Create a route file
npx hyperz make:auth                   # Scaffold persistent authentication (BCrypt, TypeORM)
npx hyperz make:job <Name>             # Create a queue job
npx hyperz make:factory <Name>         # Create a database factory
npx hyperz make:ai-action <Name>       # Create an AI action class
npx hyperz make:test <Name> [-f]        # Create a unit/feature test
npx hyperz make:module <Name>           # Scaffold full domain module (model+controller+route+migration+test)

# Database
npx hyperz migrate                     # Run pending migrations
npx hyperz migrate:rollback            # Rollback last batch
npx hyperz db:seed                     # Run all seeders
npx hyperz db:seed -c UserSeeder       # Run specific seeder

# Utilities
npx hyperz key:generate                # Generate app key + JWT secret
npx hyperz serve                       # Start dev server
npx hyperz route:list                  # List route files
npx hyperz tinker                      # Interactive REPL
```

> 19 commands total. Run `npx hyperz --help` to see all available commands.

---

## API Playground

HyperZ includes a **built-in, Postman-like API testing UI** — no third-party tools needed.

Visit **http://localhost:7700/api/playground** after starting the dev server.

### Features

- 🔍 **Route Discovery** — Auto-discovers all registered API routes
- 📝 **Request Builder** — Method, URL, headers, body, query params, auth
- 🔐 **Auth Support** — Bearer Token, Basic Auth, API Key
- 📊 **Response Viewer** — Status code, headers, body with JSON syntax highlighting
- ⏱️ **Performance Metrics** — Response time and payload size
- 🐛 **Error Log Panel** — Captures and displays all 4xx/5xx errors
- 📜 **Request History** — Browse and replay previous requests
- 🌙 **Theme Toggle** — Dark / Light mode
- ⌨️ **Keyboard Shortcuts** — `Ctrl+Enter` to send requests

---

## AI Gateway

HyperZ provides a unified AI interface supporting **OpenAI**, **Anthropic (Claude)**, and **Google AI (Gemini)**:

```typescript
import { AIGateway } from './src/ai/AIGateway.js';

const ai = new AIGateway();
ai.autoConfig(); // Reads from .env

// Chat completion
const response = await ai.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Explain TypeScript generics in one sentence.' },
]);
console.log(response.content);

// Simple text completion
const text = await ai.complete('Write a haiku about Node.js');

// Text embeddings
const embeddings = await ai.embed('HyperZ is fast');

// ── Prompt Management ──
import { PromptManager } from './src/ai/PromptManager.js';
const prompts = new PromptManager(appPath);
const systemPrompt = await prompts.load('agents/optimizer', { tone: 'professional' });

// ── Vector DB / RAG ──
import { VectorDB } from './src/ai/VectorDB.js';
const vectorDb = VectorDB.use('pinecone'); // or 'chroma', 'qdrant'
await vectorDb.upsert('docs', [{ text: 'HyperZ uses IoC', metadata: { source: 'readme' } }]);
const context = await vectorDb.search('docs', 'How does HyperZ handle DI?');
```

### Configuration

Set your provider in `.env`:

```env
AI_PROVIDER=openai          # or 'anthropic' or 'google'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Vector DB (Optional)
VECTOR_DB_DRIVER=pinecone
PINECONE_API_KEY=...
```

### Generate AI Action Scaffolding

```bash
npx hyperz make:ai-action SummarizeAction
```

This creates `app/ai/SummarizeAction.ts` — a ready-to-use AI action class.

---

## WebSocket

Real-time communication powered by **Socket.io**:

```typescript
import { WebSocket } from './src/websocket/WebSocket.js';

const ws = new WebSocket(httpServer);

ws.onConnection((socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.emit('welcome', { message: 'Hello from HyperZ!' });
});

ws.channel('/chat', (socket) => {
  socket.on('message', (data) => {
    ws.broadcast('/chat', 'message', data);
  });
});
```

---

## Enterprise Readiness

HyperZ is built for scale, providing features typically found in heavy frameworks like NestJS or Spring, but with the simplicity of Express.

### 🏗️ Advanced Dependency Injection
Fully decoupled architecture using an IoC container and TypeScript decorators.

```typescript
import { Injectable, Singleton } from './src/core/Decorators.js';

@Injectable()
@Singleton()
export class UserService {
  constructor(private logger: Logger) {}
  // ...
}
```

### 📈 Observability & Monitoring
Built-in health checks and real-time metrics dashboard:
- **System Health:** CPU, Memory (RSS/Heap), Uptime, Database connection pinging.
- **Performance:** Event loop lag measurement, request latency sparklines.
- **Slow Query Detection:** Automatic logging of queries exceeding `DB_SLOW_QUERY_THRESHOLD`.
- **Resource Tracking:** Active handles and requests monitoring.
- **Log Aggregation:** Live, level-based log viewer in Admin Panel.

### 🛡️ Multi-tier Rate Limiting
Secure your API with customizable throttling tiers (Free, Standard, Pro, Enterprise) based on API keys or User IDs.

---

## Admin Panel

HyperZ ships with a **built-in Next.js admin panel** (Tailwind refactored) with a **mobile-responsive sidebar** and **collapsed desktop mode**.

### Setup

```bash
# 1. Generate security keys (APP_KEY + JWT_SECRET)
npx hyperz key:generate

# 2. Configure database in .env (mysql, postgresql, or sqlite)

# 3. Start the HyperZ API server
npm run dev

# 4. Run migrations to create admin table
npx hyperz migrate

# 5. Start the admin panel
cd admin
npm install
npm run dev       # Starts on http://localhost:3000
```

> **First-Time Setup:** The admin panel includes a guided setup wizard that walks you through database configuration, migration, and admin account creation — all from the browser.

### Authentication & Security

| Feature | Details |
|---|---|
| 🔐 **Password Hashing** | bcrypt (10 salt rounds) |
| 🎫 **Session Tokens** | JWT HS256 with 24h expiry |
| 🛡️ **Account Lockout** | 15 min lockout after 5 failed attempts |
| 🚦 **Rate Limiting** | 5 login attempts per 15 min per IP |
| 🔒 **Registration Lock** | Locked after first admin account |
| ✅ **Token Validation** | Every request verified against DB |

### Features

| Page | Description |
|---|---|
| 📊 **Dashboard** | System health, uptime, memory usage, route/table counts |
| 🏗️ **Scaffolding** | Create controllers, models, migrations, seeders, middleware, jobs, factories via UI |
| 🗄️ **Database** | Browse tables, view schema & data, run migrations, rollback, seed |
| 🛤️ **Routes** | View all registered Express routes with method badges & search |
| ⚙️ **Config & Env** | Edit `.env` variables inline, browse config files |
| 💾 **Cache & Queue** | Cache flush, queue status, storage & WebSocket overview |
| 📋 **Logs** | Live log viewer with auto-refresh, level-based colors, file selector |
| 🤖 **AI Gateway** | Provider status (OpenAI, Anthropic, Google AI), config overview |
| 📈 **Monitoring** | Real-time CPU/memory/latency gauges and sparkline charts |
| 🔌 **MCP Server** | MCP tool status, resource browser, prompt templates |

### Admin API Endpoints

The admin panel communicates via internal REST endpoints at `/api/_admin/*`:

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/_admin/auth/status` | GET | 🔓 Public | System readiness check |
| `/api/_admin/auth/register` | POST | 🔓 Public | Create first admin account |
| `/api/_admin/auth/login` | POST | 🔓 Public | Admin login |
| `/api/_admin/auth/me` | GET | 🔓 Public | Verify session token |
| `/api/_admin/overview` | GET | 🔐 JWT | System health & stats |
| `/api/_admin/env` | GET/PUT | 🔐 JWT | Read/update `.env` |
| `/api/_admin/config` | GET | 🔐 JWT | List config files |
| `/api/_admin/routes` | GET | 🔐 JWT | List all routes |
| `/api/_admin/scaffold/:type` | POST | 🔐 JWT | Create resources |
| `/api/_admin/database/tables` | GET | 🔐 JWT | List database tables |
| `/api/_admin/database/tables/:name` | GET | 🔐 JWT | Browse table data |
| `/api/_admin/database/migrate` | POST | 🔐 JWT | Run migrations |
| `/api/_admin/database/rollback` | POST | 🔐 JWT | Rollback migrations |
| `/api/_admin/database/seed` | POST | 🔐 JWT | Run seeders |
| `/api/_admin/logs` | GET | 🔐 JWT | Read log files |
| `/api/_admin/cache/flush` | POST | 🔐 JWT | Flush cache |

---

## AI Agent Compatibility

HyperZ is designed to be **AI agentic development-friendly** — making it one of the first Express.js frameworks to ship with first-class AI agent support.

### Supported Tools

| Tool | Config File | What It Does |
|---|---|---|
| **Antigravity** (Gemini) | `AGENTS.md` + `.agent/workflows/` | Full project context + step-by-step workflows |
| **Cursor** | `.cursorrules` | Project-specific coding rules and patterns |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Workspace-aware code suggestions |
| **Claude Code** | `AGENTS.md` | Project conventions and architecture |
| **Windsurf** | `AGENTS.md` | Project rules and context |
| **VS Code AI Extensions** | `AGENTS.md` + `ARCHITECTURE.md` | System overview for any AI tool |

### What Makes HyperZ AI-Friendly?

- **Convention-over-configuration** — Predictable file locations and naming patterns that AI agents can reason about
- **CLI scaffolding** — 16+ `make:` commands that AI agents can use to generate correct boilerplate
- **TypeScript strict mode** — Strong type inference for better AI suggestions
- **Comprehensive docs** — `AGENTS.md` (conventions), `ARCHITECTURE.md` (system diagrams), `FEATURES.md`, `USER_MANUAL.md`
- **Step-by-step workflows** — `.agent/workflows/` with guides for CRUD, middleware, database, AI actions, and dev setup
- **Auto-loaded routes** — AI agents don't need to know where to register routes
- **Admin API** — Programmatic access to routes, database, env, and logs via `/api/_admin/*`

### Quick Example

An AI agent asked to *"add a blog posts feature"* can:

1. Read `AGENTS.md` to understand conventions
2. Follow `.agent/workflows/add-crud-resource.md`
3. Run `make:controller PostController`, `make:model Post -m`, `make:route posts`
4. Edit the migration, route file, and controller
5. Run `migrate` — done! Full CRUD API in minutes.

---

## 🔌 MCP Server (Model Context Protocol)

HyperZ ships with a built-in MCP server that lets AI agents programmatically manage your project — scaffolding, database operations, route inspection, and more.

### Capabilities

| Type | Count | Examples |
|---|---|---|
| **Tools** | 13 | `scaffold_controller`, `run_migration`, `list_routes`, `read_env` |
| **Resources** | 6 | `hyperz://project/structure`, `hyperz://database/tables` |
| **Prompts** | 4 | `create_crud_resource`, `debug_api_endpoint`, `optimize_database` |
| **Transports** | 2 | stdio (local), Streamable HTTP (web) |

### Setup (Claude Desktop / Cursor)

Add to your MCP config:

```json
{
  "mcpServers": {
    "hyperz": {
      "command": "npx",
      "args": ["hyperz-mcp"],
      "cwd": "/path/to/your/hyperz/project"
    }
  }
}
```

Or run directly: `npm run mcp`

### Admin Panel

The MCP Server page in the Admin Panel (`/mcp`) provides a visual dashboard with:
- **Component Map** — architecture diagram with registered tools, resources, and prompts
- **Tool Tester** — execute MCP tools directly from the UI
- **AI Automation** — one-click database operations and quick actions

---

## Architecture

```
HyperZ/
├── admin/                        # Next.js Admin Panel
│   ├── app/                      # Admin pages (Dashboard, DB, Routes, etc.)
│   ├── components/               # Shared components (Sidebar, Layout)
│   └── package.json              # Admin dependencies
│
├── app/                          # Your application code
│   ├── ai/                       # AI action classes
│   ├── controllers/              # HTTP controllers
│   ├── jobs/                     # Queue job classes
│   ├── models/                   # Data models
│   ├── middleware/                # Custom middleware
│   └── routes/                   # Route definitions
│       └── api.ts                # API routes (auto-loaded)
│
├── bin/
│   ├── hyperz.ts                 # CLI entry point
│   └── hyperz-mcp.ts             # MCP server entry point
│
├── config/                       # Configuration files
│   ├── ai.ts                     # AI Gateway config
│   ├── app.ts                    # Application config
│   ├── auth.ts                   # Authentication config
│   ├── cache.ts                  # Cache config
│   ├── database.ts               # Database config
│   ├── docs.ts                   # Swagger/OpenAPI docs config
│   ├── features.ts               # Feature flags config
│   ├── graphql.ts                # GraphQL config
│   ├── mail.ts                   # Mail config
│   ├── queue.ts                  # Queue config
│   ├── ratelimit.ts              # Rate limiting tiers config
│   ├── security.ts               # Security config (CSRF, sanitization, hashing, encryption)
│   ├── storage.ts                # Storage config
│   └── webhooks.ts               # Webhook config
│
├── database/
│   ├── factories/                # Database factories
│   ├── migrations/               # Database migrations
│   └── seeders/                  # Database seeders
│
├── lang/                         # i18n translation files
│   ├── en/messages.json          # English translations
│   └── bn/messages.json          # Bengali translations
│
├── src/                          # Framework core (don't edit)
│   ├── ai/                       # AI Gateway (OpenAI, Anthropic, Google)
│   ├── auth/                     # Auth manager & RBAC
│   │   └── rbac/                 # Gate, Policy, Role middleware
│   ├── cache/                    # Cache manager (Memory + Redis)
│   ├── cli/                      # CLI engine & stubs
│   ├── config/                   # Config loader
│   ├── core/                     # Application, Container, PluginManager
│   ├── database/                 # Database, Model, Migration, Factory
│   ├── events/                   # Event dispatcher
│   ├── http/                     # Router, Controller, Request, Response
│   │   ├── exceptions/           # HTTP exceptions & handler
│   │   └── middleware/           # Built-in middleware
│   ├── i18n/                     # Localization manager
│   ├── logging/                  # Logger (Pino)
│   ├── mail/                     # Mailer (Nodemailer)
│   ├── playground/               # API Playground UI
│   ├── providers/                # Service providers
│   ├── queue/                    # Queue manager (Sync + BullMQ)
│   ├── scheduling/               # Task scheduler
│   ├── storage/                  # Storage manager (Local + S3)
│   ├── security/                  # Security barrel exports
│   ├── support/                  # Helpers, Str, Collection, Encrypter, SignedUrl, FeatureFlags
│   ├── testing/                  # HTTP test client
│   ├── validation/               # Zod validator
│   ├── webhooks/                 # Webhook manager (HMAC signing, retry, delivery logs)
│   └── websocket/                # WebSocket manager (Socket.io)
│
├── storage/                      # App storage
│   ├── cache/
│   ├── logs/
│   └── uploads/
│
├── app.ts                        # Application bootstrap
├── server.ts                     # Server entry point
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── tsconfig.json                 # TypeScript config
└── package.json
```

### Service Provider Architecture

HyperZ uses a service-provider pattern inspired by Laravel:

```
Boot Order:
  1. AppServiceProvider       → Kernel, global middleware, DI bindings
  2. SecurityServiceProvider  → HTTPS, sanitization, CSRF, hashing, token blacklist
  3. FeaturesServiceProvider  → Lifecycle hooks, feature flags, audit log
  4. DatabaseServiceProvider  → TypeORM (DataSource) + MongoDB (Mongoose) connections
  5. EventServiceProvider     → Event dispatcher
  6. CacheServiceProvider     → Cache manager
  7. RouteServiceProvider     → Auto-discovers & loads app/routes/*.ts
```

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|---|---|---|
| `APP_NAME` | Application name | `HyperZ` |
| `APP_ENV` | Environment (`development`, `production`) | `development` |
| `APP_PORT` | Server port | `7700` |
| `APP_KEY` | Encryption key (run `key:generate`) | — |
| `DB_DRIVER` | SQL driver (`sqlite`, `mysql`, `postgres`) | `sqlite` |
| `MONGO_ENABLED` | Enable MongoDB | `false` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/hyperz` |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRATION` | Token expiry | `7d` |
| `CACHE_DRIVER` | Cache backend (`memory`, `redis`) | `memory` |
| `QUEUE_DRIVER` | Queue backend (`sync`, `redis`) | `sync` |
| `AI_PROVIDER` | AI provider (`openai`, `anthropic`, `google`) | `openai` |
| `APP_LOCALE` | Default locale | `en` |
| `WEBHOOK_SECRET` | Default webhook signing secret | — |
| `WEBHOOK_MAX_RETRIES` | Max webhook delivery retries | `3` |

See [.env.example](.env.example) for all available options.

### Database

**SQLite** (default — zero config):
```env
DB_DRIVER=sqlite
```

**MySQL**:
```env
DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=hyperz
DB_USER=root
DB_PASSWORD=secret
```

**PostgreSQL**:
```env
DB_DRIVER=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=hyperz
DB_USER=postgres
DB_PASSWORD=secret
```

**MongoDB** (alongside SQL):
```env
MONGO_ENABLED=true
MONGO_URI=mongodb://127.0.0.1:27017/hyperz
```

---

## Authentication & RBAC

### Scaffold Auth

```bash
npx hyperz make:auth
```

This creates:
- `app/controllers/AuthController.ts` — Login, Register, Me endpoints
- `app/routes/auth.ts` — Auth routes
- `database/migrations/*_create_auth_tables.ts` — Users, Roles, Permissions tables

### Using Auth Middleware

```typescript
import { authMiddleware } from '../../src/http/middleware/AuthMiddleware.js';
import { roleMiddleware, permissionMiddleware } from '../../src/auth/rbac/RoleMiddleware.js';

// Require authentication
router.get('/profile', authMiddleware(), controller.profile.bind(controller));

// Require specific role
router.get('/admin', authMiddleware(), roleMiddleware('admin'), controller.admin.bind(controller));

// Require specific permission
router.delete('/users/:id', authMiddleware(), permissionMiddleware('delete-users'), controller.destroy.bind(controller));
```

### Using Gates

```typescript
import { Gate } from '../../src/auth/rbac/Gate.js';

// Define abilities
Gate.define('edit-post', (user, post) => user.id === post.authorId);

// Check in controller
const allowed = await Gate.allows('edit-post', req.user, post);
```

---

## Validation

HyperZ uses **Zod** for type-safe request validation:

```typescript
import { z } from 'zod';
import { validate } from '../../src/validation/Validator.js';

const createPostSchema = z.object({
  title: z.string().min(3).max(255),
  body: z.string().min(10),
  published: z.boolean().optional(),
});

router.post('/posts', validate(createPostSchema), controller.store.bind(controller));
```

Invalid requests automatically return a `422` response with detailed error messages.

---

## i18n / Localization

HyperZ supports multi-language translations with JSON files:

```typescript
import { I18n } from './src/i18n/I18n.js';

// Translations are auto-loaded from lang/ directory on boot
I18n.t('welcome');                        // "Welcome to HyperZ!"
I18n.t('greeting', { name: 'John' });     // "Hello, John!"
I18n.t('errors.not_found');               // "Resource not found."

// Switch locale
I18n.setLocale('bn');
I18n.t('welcome');                        // "হাইপারজেড-এ স্বাগতম!"
```

Add new languages by creating `lang/<locale>/messages.json`.

---

## Events

```typescript
import { EventDispatcher } from '../../src/events/EventDispatcher.js';

// Register listener
EventDispatcher.on('user.registered', async (user) => {
  console.log(`Welcome ${user.name}!`);
  // Send welcome email, log analytics, etc.
});

// Dispatch event
await EventDispatcher.dispatch('user.registered', { name: 'John', email: 'john@example.com' });
```

---

## Task Scheduling

```typescript
import { Scheduler } from '../../src/scheduling/Scheduler.js';

const scheduler = new Scheduler();

scheduler
  .everyMinute('health-check', async () => { /* ping services */ })
  .daily('cleanup', async () => { /* purge old records */ })
  .weekly('report', async () => { /* generate reports */ });

scheduler.start();
```

---

## 🗺️ v2 Roadmap & Vision

HyperZ is evolving rapidly. Here is our plan for the upcoming versions:

### v2.1 (Current Focus)
- ✅ Autonomous Agent factory
- ✅ Multi-provider AI Fallback
- ✅ Native RAG (pgvector/Weaviate)
- ✅ Tenant-aware DB Pooling

### v2.1.1 (February 2026 — Latest)
- [x] **Enterprise Security Suite:** AES-256-GCM encryption, CSRF protection, request sanitization, signed URLs, token blacklisting, API key auth middleware
- [x] **Feature Flags:** Config/env/custom driver-based feature toggles with per-user/tenant gate middleware
- [x] **Lifecycle Hooks:** Global onRequest/onResponse/onError/onFinish hooks
- [x] **Audit Logging:** Pluggable-store audit trail with auto-middleware for state-changing requests
- [x] **Webhook System:** HMAC-SHA256 signed outbound webhooks with retry, backoff, and delivery logging
- [x] **AI Streaming (SSE):** StreamResponse helper for real-time LLM token streaming
- [x] **Query Builder:** Fluent `DB.table().where().get()` facade for raw SQL
- [x] **OpenAPI Enhancement:** Zod-to-JSON-Schema converter for accurate Swagger body/query/param schemas
- [x] **CLI: `make:test` & `make:module`:** One-command scaffolding for tests and full domain modules

### v2.2 (Q2 2026)
- [ ] **HyperZ-UI Starter Kit:** A pre-built SaaS frontend for the HyperZ backend.
- [ ] **Advanced Agent Memory:** Support for long-term "Graph" memory.
- [ ] **One-Click Deploy:** Integrated adapters for Vercel, Railway, and AWS Lambda.

### v2.3 (Q3 2026)
- [ ] **Fine-tuning Pipeline:** Built-in tools for fine-tuning models on tenant data.
- [ ] **AI-Driven Rate Limiting:** Dynamic throttling based on token costs and system load.

---

## 🧪 Tech Stack

| Package | Purpose |
|---|---|
| [Express 5.x](https://expressjs.com/) | HTTP framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [TypeORM](https://typeorm.io/) | ORM — Active Record, migrations, relations |
| [Mongoose](https://mongoosejs.com/) | MongoDB ODM |
| [Zod](https://zod.dev/) | Schema validation |
| [Pino](https://getpino.io/) | Logging |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | JWT authentication |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing |
| [Commander.js](https://github.com/tj/commander.js) | CLI framework |
| [Socket.io](https://socket.io/) | WebSocket / real-time |
| [ioredis](https://github.com/redis/ioredis) | Redis client |
| [BullMQ](https://bullmq.io/) | Job queue (Redis-backed) |
| [Nodemailer](https://nodemailer.com/) | Email sending |
| [node-cron](https://github.com/node-cron/node-cron) | Task scheduling |
| [Helmet](https://helmetjs.github.io/) | Security headers |
| [graphql-yoga](https://the-guild.dev/graphql/yoga-server) | GraphQL server |
| [tsx](https://github.com/privatenumber/tsx) | TypeScript execution & hot-reload |

---

## Docker Deployment

### Production

```bash
# Build and start the full stack (app + Redis)
docker compose up -d --build

# View logs
docker compose logs -f app

# Stop
docker compose down
```

This starts:
- **HyperZ app** — multi-stage Alpine build, non-root user, health checks
- **Redis 7** — for cache and queue backends

The app is available at **http://localhost:7700**

### Development (Hot-Reload)

```bash
# Start with source-mounted hot-reload + Redis
docker compose -f docker-compose.dev.yml up
```

### Standalone Docker

```bash
# Build the image
docker build -t hyperz .

# Run with your .env
docker run -d --name hyperz -p 7700:7700 --env-file .env hyperz
```

### Environment Variables

Pass environment variables via `.env` file or `docker compose` overrides:

```env
APP_PORT=7700
CACHE_DRIVER=redis
QUEUE_DRIVER=redis
REDIS_HOST=redis        # Use 'redis' as host when using docker compose
```

---

## Contributing

We welcome contributions! Here's how to get started:

### Development Setup

```bash
# Fork & clone the repo
git clone https://github.com/<your-username>/HyperZ.git
cd HyperZ

# Install dependencies
npm install

# Start dev server with hot-reload
npm run dev
```

### Guidelines

1. **Fork** the repository and create your branch from `main`
2. **Follow** the existing code style (TypeScript strict mode)
3. **Write** clear commit messages
4. **Test** your changes before submitting
5. **Submit** a Pull Request with a clear description

### Areas for Contribution

- � Documentation & tutorials
- 🧪 Comprehensive test suite (Vitest)
- 🎨 API Playground UI enhancements
- � Additional AI provider drivers
- 🌍 More language translation files
- 📊 Swagger/OpenAPI auto-generation (with Zod-to-JSON-Schema)
- 🏗️ Additional database drivers

---

## Roadmap

### ✅ Implemented

- [x] Redis cache driver
- [x] BullMQ queue driver
- [x] S3 / cloud storage driver
- [x] WebSocket / Socket.io provider
- [x] REPL / Tinker command
- [x] AI Gateway (OpenAI, Anthropic, Google AI)
- [x] Database Factory (Faker-ready)
- [x] Plugin auto-discovery
- [x] Vitest test helpers & HTTP test client
- [x] i18n / Localization support
- [x] API Playground — built-in Postman-like API testing UI
- [x] Auto-generated API docs (Swagger/OpenAPI at `/api/docs`)
- [x] Rate limiting per user/API key (multi-tier)
- [x] Real-time dashboard & monitoring
- [x] GraphQL integration (graphql-yoga)
- [x] Docker & deployment templates
- [x] Admin panel UI (Next.js)
- [x] MCP Server (19 tools, 6 resources, 4 prompts)
- [x] Multi-tenancy (experimental)
- [x] Billing integration (experimental)

### 🔮 Planned

- [ ] **HyperZ-UI Starter Kit:** A pre-built SaaS frontend for the HyperZ backend.
- [ ] **Advanced Agent Memory:** Support for long-term "Graph" memory.
- [ ] **One-Click Deploy:** Integrated adapters for Vercel, Railway, and AWS Lambda.
- [ ] **Fine-tuning Pipeline:** Built-in tools for fine-tuning models on tenant data.
- [ ] **AI-Driven Rate Limiting:** Dynamic throttling based on token costs and system load.

---

## Documentation

- 🤖 [AI Agent Guide](AGENTS.md)
- 🏗️ [Architecture Guide](ARCHITECTURE.md)
- 📈 [Stability Guarantees](STABILITY.md)
- 🛡️ [Security Policy](SECURITY.md)
- 📋 [Product Features Specification](docs/FEATURES.md)
- 📖 [User Manual](docs/USER_MANUAL.md)
- ⚔️ [Framework Comparison](docs/COMPARISON.md)
- 📄 [Changelog](CHANGELOG.md)

---

## Acknowledgments

This framework was built using the **Antigravity IDE** with **Claude Opus 4.6**. It is based on **Express.js** and **Next.js**, with core architectural inspiration from **Laravel**.

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/ShahjahanAli">Shahjahan Ali</a>
</p>

<p align="center">
  <sub>⚡ HyperZ — Ship faster. Scale effortlessly.</sub>
</p>
