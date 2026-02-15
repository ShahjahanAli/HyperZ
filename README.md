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
  <a href="#architecture">Architecture</a> •
  <a href="#documentation">Docs</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Why HyperZ?

HyperZ brings the developer experience you love from Laravel to the Node.js ecosystem — an opinionated, batteries-included framework with a powerful CLI, built-in auth, RBAC, and a modular service-provider architecture. If you've ever wished Express had the structure and tooling of a full-stack framework, HyperZ is for you.

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
| 🔧 **CLI** | 12+ Artisan-style commands for scaffolding, migrations, seeding, and more |
| 📡 **Events** | Pub/Sub event dispatcher with async listeners |
| 📬 **Mail** | Nodemailer integration with SMTP transport |
| 💾 **Cache** | Memory driver (Redis-ready) with `remember()` helper |
| 📦 **Queue** | Sync driver (BullMQ-ready) with job dispatching |
| 📁 **Storage** | Local filesystem driver (S3-ready) |
| ⏰ **Scheduler** | Cron-like task scheduler with fluent API |
| 📝 **Logging** | Pino-powered structured logging with pretty dev output |
| 🧰 **Utilities** | String helpers, Collection class, global env/helpers |

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

  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.success(res, { id }, 'Post found');
  }

  async store(req: Request, res: Response): Promise<void> {
    this.created(res, req.body, 'Post created');
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.success(res, { id, ...req.body }, 'Post updated');
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
GET  http://localhost:7700/api           → Welcome message
GET  http://localhost:7700/api/health    → Health check
GET  http://localhost:7700/api/posts     → Your posts
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

# Database
npx tsx bin/hyperz.ts migrate                     # Run pending migrations
npx tsx bin/hyperz.ts migrate:rollback            # Rollback last batch
npx tsx bin/hyperz.ts db:seed                     # Run all seeders
npx tsx bin/hyperz.ts db:seed -c UserSeeder       # Run specific seeder

# Utilities
npx tsx bin/hyperz.ts key:generate                # Generate app key
npx tsx bin/hyperz.ts serve                       # Start dev server
npx tsx bin/hyperz.ts route:list                  # List route files
```

---

## Architecture

```
HyperZ/
├── app/                          # Your application code
│   ├── controllers/              # HTTP controllers
│   ├── models/                   # Data models
│   ├── middleware/                # Custom middleware
│   └── routes/                   # Route definitions
│       └── api.ts                # API routes (auto-loaded)
│
├── bin/
│   └── hyperz.ts                 # CLI entry point
│
├── config/                       # Configuration files
│   ├── app.ts                    # Application config
│   ├── auth.ts                   # Authentication config
│   ├── cache.ts                  # Cache config
│   ├── database.ts               # Database config
│   ├── mail.ts                   # Mail config
│   ├── queue.ts                  # Queue config
│   └── storage.ts                # Storage config
│
├── database/
│   ├── migrations/               # Database migrations
│   └── seeders/                  # Database seeders
│
├── src/                          # Framework core (don't edit)
│   ├── auth/                     # Auth manager & RBAC
│   │   ├── AuthManager.ts        # JWT + bcrypt
│   │   └── rbac/                 # Gate, Policy, Role middleware
│   ├── cache/                    # Cache manager
│   ├── cli/                      # CLI engine & stubs
│   ├── config/                   # Config loader
│   ├── core/                     # Application, Container, Kernel
│   ├── database/                 # Database, Model, Migration, Seeder
│   ├── events/                   # Event dispatcher
│   ├── http/                     # Router, Controller, Request, Response
│   │   ├── exceptions/           # HTTP exceptions & handler
│   │   └── middleware/           # Built-in middleware
│   ├── logging/                  # Logger (Pino)
│   ├── mail/                     # Mailer (Nodemailer)
│   ├── providers/                # Service providers
│   ├── queue/                    # Queue manager
│   ├── scheduling/               # Task scheduler
│   ├── storage/                  # Storage manager
│   ├── support/                  # Helpers, Str, Collection
│   └── validation/               # Zod validator
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
| [Nodemailer](https://nodemailer.com/) | Email sending |
| [node-cron](https://github.com/node-cron/node-cron) | Task scheduling |
| [Helmet](https://helmetjs.github.io/) | Security headers |
| [tsx](https://github.com/privatenumber/tsx) | TypeScript execution & hot-reload |

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

- 🔌 Redis cache driver
- 🔌 BullMQ queue driver
- 🔌 S3 storage driver
- 🔌 WebSocket support
- 📖 Documentation & tutorials
- 🧪 Test suite (Vitest)
- 🌍 i18n / Localization
- 🔌 Plugin system

---

## Roadmap

- [ ] Redis cache & queue drivers
- [ ] S3 / cloud storage driver
- [ ] WebSocket / Socket.io provider
- [ ] REPL / Tinker command
- [ ] Auto-generated API docs (Swagger/OpenAPI)
- [ ] Database Factory (Faker-powered)
- [ ] Plugin auto-discovery
- [ ] Vitest test helpers & HTTP test client
- [ ] i18n / Localization support
- [ ] Rate limiting per user/API key

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
