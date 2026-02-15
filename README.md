<p align="center">
  <img src="https://img.shields.io/badge/⚡-HyperZ-blueviolet?style=for-the-badge&labelColor=000000" alt="HyperZ" />
</p>

<h1 align="center">HyperZ Framework</h1>

<p align="center">
  <strong>A modern, Laravel-inspired, enterprise-grade API framework built on Express.js & TypeScript</strong>
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

## Why HyperZ?

HyperZ brings the developer experience you love from Laravel to the Node.js ecosystem — an opinionated, batteries-included framework with a powerful CLI, built-in auth, RBAC, AI gateway, live API playground, and a modular service-provider architecture. If you've ever wished Express had the structure and tooling of a full-stack framework, HyperZ is for you.

---

## Features

| Category | What You Get |
|---|---|
| 🏗️ **Core** | IoC Service Container, Service Providers, Config Manager, Application Kernel |
| 🌐 **HTTP** | Laravel-style Router (groups, named routes, resource CRUD), Controller base class |
| 🛡️ **Middleware** | JWT Auth, CORS, Helmet, Rate Limiting, Request Logging — all built-in |
| 🗄️ **Database** | **Knex.js** (SQLite, MySQL, PostgreSQL) **+ Mongoose** (MongoDB) — dual driver support |
| 📊 **ORM** | Active Record Model (CRUD, soft deletes, timestamps, fillable/hidden fields) |
| 🔐 **Auth & RBAC** | JWT authentication, bcrypt hashing, Gates, Policies, Role & Permission middleware |
| ✅ **Validation** | Zod-powered request validation (body, query, params) with type safety |
| 🔧 **CLI** | 16+ Artisan-style commands for scaffolding, migrations, seeding, AI actions, and more |
| 📡 **Events** | Pub/Sub event dispatcher with async listeners |
| 📬 **Mail** | Nodemailer integration with SMTP transport |
| 💾 **Cache** | Memory + **Redis** drivers with `remember()` helper |
| 📦 **Queue** | Sync + **BullMQ** (Redis) drivers with delayed job dispatching |
| 📁 **Storage** | Local filesystem + **AWS S3** drivers |
| 🌐 **WebSocket** | Real-time communication via Socket.io with channel & room management |
| 🤖 **AI Gateway** | Multi-provider AI integration (OpenAI, Anthropic, Google AI) with unified API |
| 🎮 **API Playground** | Built-in Postman-like API testing UI at `/api/playground` |
| 🏭 **Factories** | Database Factory for test data generation (Faker-ready) |
| 🔌 **Plugins** | Auto-discovery plugin manager for modular extensions |
| 🌍 **i18n** | Multi-language localization with JSON-based translations |
| 🧪 **Testing** | HTTP test client for integration testing (Vitest-ready) |
| ⏰ **Scheduler** | Cron-like task scheduler with fluent API |
| 📝 **Logging** | Pino-powered structured logging with pretty dev output |
| 🧰 **Utilities** | String helpers, Collection class, global env/helpers |
| 🔁 **Tinker** | Interactive REPL with preloaded app context |
| 🧠 **AI Agent-Ready** | Built-in support for Cursor, Copilot, Antigravity, and other AI coding tools |
| 🔌 **MCP Server** | Model Context Protocol server with 13 tools, 6 resources, 4 prompts for AI automation |

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

# Generate application key
npx tsx bin/hyperz.ts key:generate

# Copy environment config
cp .env.example .env

# Start development server (with hot-reload)
npm run dev
```

Your API is now running at **http://localhost:7700/api** ⚡

Visit the built-in API Playground at **http://localhost:7700/api/playground** 🎮

---

## Quick Start

### 1. Create a Controller

```bash
npx tsx bin/hyperz.ts make:controller PostController
```

This generates `app/controllers/PostController.ts`:

```typescript
import { Controller } from '../../src/http/Controller.js';
import type { Request, Response } from 'express';

export class PostController extends Controller {
  async index(req: Request, res: Response): Promise<void> {
    this.success(res, [], 'Posts retrieved');
  }

  async store(req: Request, res: Response): Promise<void> {
    this.created(res, req.body, 'Post created');
  }

  async show(req: Request, res: Response): Promise<void> {
    this.success(res, { id: req.params.id }, 'Post found');
  }

  async update(req: Request, res: Response): Promise<void> {
    this.success(res, { id: req.params.id, ...req.body }, 'Post updated');
  }

  async destroy(req: Request, res: Response): Promise<void> {
    this.noContent(res);
  }
}
```

### 2. Create a Model with Migration

```bash
npx tsx bin/hyperz.ts make:model Post -m
```

This generates:
- `app/models/Post.ts` — Active Record model
- `database/migrations/YYYYMMDDHHMMSS_create_posts_table.ts` — Migration file

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
npx tsx bin/hyperz.ts migrate
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
npx tsx bin/hyperz.ts make:controller <Name>     # Create a controller
npx tsx bin/hyperz.ts make:model <Name> [-m]      # Create a model (-m = with migration)
npx tsx bin/hyperz.ts make:migration <name>       # Create a migration
npx tsx bin/hyperz.ts make:seeder <Name>          # Create a seeder
npx tsx bin/hyperz.ts make:middleware <Name>       # Create a middleware
npx tsx bin/hyperz.ts make:route <name>           # Create a route file
npx tsx bin/hyperz.ts make:auth                   # Scaffold full authentication
npx tsx bin/hyperz.ts make:job <Name>             # Create a queue job
npx tsx bin/hyperz.ts make:factory <Name>         # Create a database factory
npx tsx bin/hyperz.ts make:ai-action <Name>       # Create an AI action class

# Database
npx tsx bin/hyperz.ts migrate                     # Run pending migrations
npx tsx bin/hyperz.ts migrate:rollback            # Rollback last batch
npx tsx bin/hyperz.ts db:seed                     # Run all seeders
npx tsx bin/hyperz.ts db:seed -c UserSeeder       # Run specific seeder

# Utilities
npx tsx bin/hyperz.ts key:generate                # Generate app key
npx tsx bin/hyperz.ts serve                       # Start dev server
npx tsx bin/hyperz.ts route:list                  # List route files
npx tsx bin/hyperz.ts tinker                      # Interactive REPL
```

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
```

### Configuration

Set your provider in `.env`:

```env
AI_PROVIDER=openai          # or 'anthropic' or 'google'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
```

### Generate AI Action Scaffolding

```bash
npx tsx bin/hyperz.ts make:ai-action SummarizeAction
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

## Admin Panel

HyperZ ships with a **built-in Next.js admin panel** for visual management of your application — no terminal required.

### Setup

```bash
cd admin
npm install
npm run dev       # Starts on http://localhost:3100
```

> **Note:** The HyperZ API must be running on port 7700 for the admin panel to communicate with it.

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

### Admin API Endpoints

The admin panel communicates via internal REST endpoints at `/api/_admin/*`:

| Endpoint | Method | Description |
|---|---|---|
| `/api/_admin/overview` | GET | System health & stats |
| `/api/_admin/env` | GET/PUT | Read/update `.env` |
| `/api/_admin/config` | GET | List config files |
| `/api/_admin/routes` | GET | List all routes |
| `/api/_admin/scaffold/:type` | POST | Create resources |
| `/api/_admin/database/tables` | GET | List database tables |
| `/api/_admin/database/tables/:name` | GET | Browse table data |
| `/api/_admin/database/migrate` | POST | Run migrations |
| `/api/_admin/database/rollback` | POST | Rollback migrations |
| `/api/_admin/database/seed` | POST | Run seeders |
| `/api/_admin/logs` | GET | Read log files |
| `/api/_admin/cache/flush` | POST | Flush cache |

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
      "args": ["tsx", "bin/hyperz-mcp.ts"],
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
│   ├── mail.ts                   # Mail config
│   ├── queue.ts                  # Queue config
│   └── storage.ts                # Storage config
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
│   ├── support/                  # Helpers, Str, Collection
│   ├── testing/                  # HTTP test client
│   ├── validation/               # Zod validator
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
  1. AppServiceProvider      → Kernel, global middleware
  2. DatabaseServiceProvider  → SQL (Knex) + MongoDB (Mongoose) connections
  3. EventServiceProvider     → Event dispatcher
  4. CacheServiceProvider     → Cache manager
  5. RouteServiceProvider     → Auto-discovers & loads app/routes/*.ts
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
| `DB_DRIVER` | SQL driver (`sqlite`, `mysql`, `postgresql`) | `sqlite` |
| `MONGO_ENABLED` | Enable MongoDB | `false` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/hyperz` |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRATION` | Token expiry | `7d` |
| `CACHE_DRIVER` | Cache backend (`memory`, `redis`) | `memory` |
| `QUEUE_DRIVER` | Queue backend (`sync`, `redis`) | `sync` |
| `AI_PROVIDER` | AI provider (`openai`, `anthropic`, `google`) | `openai` |
| `APP_LOCALE` | Default locale | `en` |

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
DB_DRIVER=postgresql
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
npx tsx bin/hyperz.ts make:auth
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

## Tech Stack

| Package | Purpose |
|---|---|
| [Express 5.x](https://expressjs.com/) | HTTP framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Knex.js](https://knexjs.org/) | SQL query builder |
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
- 📊 Swagger/OpenAPI auto-generation
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

### 🔮 Future

- [ ] Auto-generated API docs (Swagger/OpenAPI)
- [ ] Rate limiting per user/API key
- [ ] Real-time dashboard & monitoring
- [ ] GraphQL integration layer
- [x] Docker & deployment templates
- [x] Admin panel UI (Next.js)

---

## Documentation

- 🤖 [AI Agent Guide](AGENTS.md)
- 🏗️ [Architecture Guide](ARCHITECTURE.md)
- 📋 [Product Features Specification](docs/FEATURES.md)
- 📖 [User Manual](docs/USER_MANUAL.md)
- ⚔️ [Framework Comparison](docs/COMPARISON.md)
- 📄 [Changelog](CHANGELOG.md)

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/ShahjahanAli">Shahjahan Ali</a>
</p>

<p align="center">
  <sub>⚡ HyperZ — Ship faster. Scale effortlessly.</sub>
</p>
