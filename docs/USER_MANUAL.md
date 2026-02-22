# ⚡ HyperZ Framework — User Manual

**Version:** 2.1.1  
**Last Updated:** February 2026  

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Project Structure](#2-project-structure)
3. [Configuration](#3-configuration)
4. [Creating Your First API](#4-creating-your-first-api)
5. [Database Operations](#5-database-operations)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Request Validation](#7-request-validation)
8. [Caching](#8-caching)
9. [Queues & Jobs](#9-queues--jobs)
10. [File Storage](#10-file-storage)
11. [WebSocket](#11-websocket)
12. [AI Gateway](#12-ai-gateway)
13. [API Playground](#13-api-playground)
14. [i18n / Localization](#14-i18n--localization)
15. [Events & Scheduling](#15-events--scheduling)
16. [Mail](#16-mail)
17. [Testing](#17-testing)
18. [Tinker REPL](#18-tinker-repl)
19. [Plugins](#19-plugins)
20. [CLI Reference](#20-cli-reference)
21. [Deployment](#21-deployment)
22. [Troubleshooting](#22-troubleshooting)
23. [Security Services](#23-security-services)
24. [Feature Flags](#24-feature-flags)
25. [Lifecycle Hooks](#25-lifecycle-hooks)
26. [Audit Log](#26-audit-log)
27. [Webhook System](#27-webhook-system)
28. [Query Builder (DB Facade)](#28-query-builder-db-facade)
29. [AI Streaming (SSE)](#29-ai-streaming-sse)

---

## 1. Getting Started

### 1.1 Prerequisites

| Requirement | Minimum Version |
|---|---|
| Node.js | ≥ 20.0.0 |
| npm | ≥ 9.0.0 |

### 1.2 Installation

```bash
# Clone the repository
git clone https://github.com/ShahjahanAli/HyperZ.git
cd HyperZ

# Install dependencies
npm install

# Generate application key
npx tsx bin/hyperz.ts key:generate

# Copy environment configuration
cp .env.example .env

# Start development server
npm run dev
```

### 1.3 Verify Installation

After running `npm run dev`, you should see:

```
⚡ HyperZ server running on port 7700 [development]
   → http://localhost:7700
  🎮 API Playground available at /api/playground
```

Visit these URLs to verify:

| URL | Expected Result |
|---|---|
| `http://localhost:7700/api` | Welcome JSON message |
| `http://localhost:7700/api/health` | Health check response |
| `http://localhost:7700/api/playground` | API Playground UI |

---

## 2. Project Structure

```
HyperZ/
├── app/                    ← Your application code
│   ├── ai/                 ← AI action classes
│   ├── controllers/        ← HTTP controllers
│   ├── jobs/               ← Queue job classes
│   ├── models/             ← Data models
│   ├── middleware/          ← Custom middleware
│   └── routes/             ← Route definitions
│       └── api.ts          ← API routes (auto-loaded)
├── config/                 ← Configuration files
├── database/
│   ├── factories/          ← Database factories
│   ├── migrations/         ← Database migrations
│   └── seeders/            ← Database seeders
├── lang/                   ← Translation files
├── src/                    ← Framework core (do not edit)
├── storage/                ← App storage (cache, logs, uploads)
├── app.ts                  ← Application bootstrap
├── server.ts               ← Server entry point
└── .env                    ← Environment variables
```

**Key principle:** You write code in `app/`, `config/`, `database/`, and `lang/`. The `src/` directory is the framework core — avoid modifying it.

---

## 3. Configuration

### 3.1 Environment Variables

All configuration is managed through the `.env` file. Copy `.env.example` as your starting point.

#### Application Settings

```env
APP_NAME=HyperZ            # Your app name
APP_ENV=development         # development, staging, production
APP_PORT=7700               # Server port
APP_KEY=                    # Auto-generated via key:generate
APP_DEBUG=true              # Enable debug mode
APP_URL=http://localhost:7700
```

#### Database Settings

**SQLite** (default, zero-config):
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
DB_PASSWORD=your_password
```

**PostgreSQL**:
```env
DB_DRIVER=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=hyperz
DB_USER=postgres
DB_PASSWORD=your_password
```

**MongoDB** (additional, alongside SQL):
```env
MONGO_ENABLED=true
MONGO_URI=mongodb://127.0.0.1:27017/hyperz
```

#### Redis Settings

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### Cache & Queue Settings

```env
CACHE_DRIVER=memory         # memory (default) or redis
QUEUE_DRIVER=sync           # sync (default) or redis
```

#### AI Settings

```env
AI_PROVIDER=openai           # openai, anthropic, or google
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
GOOGLE_AI_API_KEY=...
GOOGLE_AI_MODEL=gemini-2.0-flash
```

#### i18n Settings

```env
APP_LOCALE=en                # Default language
APP_FALLBACK_LOCALE=en       # Fallback if key not found
```

### 3.2 Config Files

Configuration files live in `config/` and export default objects:

| File | Purpose |
|---|---|
| `config/app.ts` | App name, env, port, debug |
| `config/auth.ts` | JWT secret, expiration |
| `config/cache.ts` | Cache driver, TTL |
| `config/database.ts` | DB connections |
| `config/mail.ts` | SMTP settings |
| `config/queue.ts` | Queue driver |
| `config/storage.ts` | Storage disks |
| `config/ai.ts` | AI provider settings |
| **`config/docs.ts`** | **OpenAPI / Swagger configuration** |
| **`config/monitoring.ts`** | **Observability settings** |
| **`config/security.ts`** | **CSRF, HTTPS, sanitization settings** |
| **`config/features.ts`** | **Feature flag definitions** |
| **`config/webhooks.ts`** | **Webhook secret and retry settings** |
| **`config/ratelimit.ts`** | **Per-user rate limit tiers** |

---

## 4. Creating Your First API

### Step 1: Create a Persistent Controller

```bash
npx tsx bin/hyperz.ts make:controller Product --model Product
```

This generates `app/controllers/ProductController.ts` with full CRUD logic linked to the `Product` model:

```typescript
import { Controller } from '../../src/http/Controller.js';
import { Product } from '../models/Product.js';
import type { Request, Response } from 'express';

export class ProductController extends Controller {
  async index(req: Request, res: Response): Promise<void> {
    const items = await Product.all();
    this.success(res, items, 'Product index');
  }

  async store(req: Request, res: Response): Promise<void> {
    const item = await Product.create(req.body);
    this.created(res, item, 'Product created');
  }

  async show(req: Request, res: Response): Promise<void> {
    const item = await Product.findOrFail(req.params.id);
    this.success(res, item, 'Product found');
  }

  async update(req: Request, res: Response): Promise<void> {
    const item = await Product.findOrFail(req.params.id);
    await Object.assign(item, req.body).save();
    this.success(res, item, 'Product updated');
  }

  async destroy(req: Request, res: Response): Promise<void> {
    const item = await Product.findOrFail(req.params.id);
    await item.remove();
    this.noContent(res);
  }
}
```

### Step 2: Create a Model with Migration

```bash
npx tsx bin/hyperz.ts make:model Product -m
```

Edit the generated migration file to define your schema:

```typescript
import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateProductsTable20260216170613 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "products",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "name", type: "varchar", isNullable: false },
                    { name: "description", type: "text", isNullable: true },
                    { name: "price", type: "decimal", precision: 10, scale: 2, isNullable: false },
                    { name: "stock", type: "int", default: 0 },
                    { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("products");
    }
}
```

### Step 3: Register Routes

Edit `app/routes/api.ts`:

```typescript
import { HyperZRouter } from '../../src/http/Router.js';
import { ProductController } from '../controllers/ProductController.js';

const router = new HyperZRouter();
const products = new ProductController();

// This generates: GET/POST/PUT/DELETE /products + /products/:id
router.resource('/products', products);

export default router;
```

### Step 4: Run Migrations

```bash
npx tsx bin/hyperz.ts migrate
```

### Step 5: Test Your API

Using the command line:
```bash
curl http://localhost:7700/api/products
```

Or open the **API Playground** at `http://localhost:7700/api/playground` and test visually!

---

## 5. Database Operations

### 5.1 Migrations

**Create a migration:**
```bash
npx tsx bin/hyperz.ts make:migration create_orders_table
```

**Run all pending migrations:**
```bash
npx tsx bin/hyperz.ts migrate
```

**Rollback the last batch:**
```bash
npx tsx bin/hyperz.ts migrate:rollback
```

### 5.2 Seeders

**Create a seeder:**
```bash
npx tsx bin/hyperz.ts make:seeder ProductSeeder
```

**Run all seeders:**
```bash
npx tsx bin/hyperz.ts db:seed
```

**Run a specific seeder:**
```bash
npx tsx bin/hyperz.ts db:seed -c ProductSeeder
```

### 5.3 Model Usage

```typescript
import { Product } from '../models/Product.js';

// Find all
const products = await Product.all();

// Find by ID
const product = await Product.find(1);

// Create
const newProduct = await Product.create({
  name: 'Widget',
  price: 9.99,
  stock: 100,
});

// Update (via ActiveRecord or Entity save)
product.price = 12.99;
await product.save();

// Delete
await product.remove();

// Soft delete (if model has @DeleteDateColumn)
await product.softRemove();
await Product.restore(product.id);
```

### 5.4 Database Factories

**Create a factory:**
```bash
npx tsx bin/hyperz.ts make:factory ProductFactory
```

**Define factory fields:**
```typescript
import { Factory } from '../../src/database/Factory.js';

Factory.define('products', () => ({
  name: 'Test Product ' + Math.random().toString(36).slice(2, 7),
  price: parseFloat((Math.random() * 100).toFixed(2)),
  stock: Math.floor(Math.random() * 500),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));
```

**Use in seeders or tests:**
```typescript
// Create one
const product = Factory.create('products');

// Create many
const products = Factory.createMany('products', 50);
```

---

## 6. Authentication & Authorization

### 6.1 Scaffold Persistent Auth

```bash
npx tsx bin/hyperz.ts make:auth
npx tsx bin/hyperz.ts migrate   # Run the generated auth migrations
```

This creates a production-ready authentication system:
- `app/models/User.ts`: Persistent model with TypeORM and hidden password.
- `app/controllers/AuthController.ts`: Registration (with hashing) and login (with JWT) logic.
- `app/routes/auth.ts`: Ready-to-use authentication routes.
- `database/migrations/*_create_auth_tables.ts`: Tables for users, roles, and permissions.

### 6.2 Auth Endpoints

After scaffolding:

| Method | URL | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user profile (requires auth) |

### 6.3 Protecting Routes

```typescript
import { authMiddleware } from '../../src/http/middleware/AuthMiddleware.js';
import { roleMiddleware, permissionMiddleware } from '../../src/auth/rbac/RoleMiddleware.js';

// Any authenticated user
router.get('/profile', authMiddleware(), controller.profile.bind(controller));

// Admin only
router.get('/admin/dashboard', authMiddleware(), roleMiddleware('admin'), controller.dashboard.bind(controller));

// Users with specific permission
router.delete('/posts/:id', authMiddleware(), permissionMiddleware('delete-posts'), controller.destroy.bind(controller));
```

### 6.4 Gates

```typescript
import { Gate } from '../../src/auth/rbac/Gate.js';

// Define
Gate.define('edit-post', (user, post) => user.id === post.authorId);

// Check
if (await Gate.allows('edit-post', req.user, post)) {
  // Authorized
}
```

---

## 7. Request Validation

```typescript
import { z } from 'zod';
import { validate } from '../../src/validation/Validator.js';

const createProductSchema = z.object({
  name: z.string().min(2).max(255),
  price: z.number().positive(),
  stock: z.number().int().min(0).optional(),
  description: z.string().optional(),
});

router.post('/products', validate(createProductSchema), controller.store.bind(controller));
```

**Invalid request response (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "name", "message": "String must contain at least 2 character(s)" },
    { "field": "price", "message": "Number must be greater than 0" }
  ]
}
```

---

## 8. Caching

### 8.1 Memory Cache (Default)

Works out of the box with zero configuration.

### 8.2 Switch to Redis

```env
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 8.3 Usage

```typescript
// Store a value (TTL: 300 seconds)
await cache.put('product:1', productData, 300);

// Retrieve
const product = await cache.get('product:1');

// Check if exists
const exists = await cache.has('product:1');

// Remember pattern (get from cache or compute)
const data = await cache.remember('expensive-query', 600, async () => {
  return await db.query('...');
});

// Delete
await cache.forget('product:1');

// Clear all
await cache.flush();
```

---

## 9. Queues & Jobs

### 9.1 Create a Job

```bash
npx tsx bin/hyperz.ts make:job SendWelcomeEmail
```

This creates `app/jobs/SendWelcomeEmail.ts`:

```typescript
import { BaseJob } from '../../src/queue/QueueManager.js';

export class SendWelcomeEmail extends BaseJob {
  name = 'SendWelcomeEmail';

  constructor(private data: Record<string, any>) {
    super();
  }

  async handle(): Promise<void> {
    // Send the email
    console.log(`Sending welcome email to ${this.data.email}`);
  }
}
```

### 9.2 Dispatch a Job

```typescript
import { SendWelcomeEmail } from '../jobs/SendWelcomeEmail.js';

// Dispatch immediately
await queue.dispatch(new SendWelcomeEmail({ email: 'john@example.com' }));

// Dispatch with delay (5 seconds)
await queue.dispatchLater(new SendWelcomeEmail({ email: 'john@example.com' }), 5000);
```

### 9.3 Enable BullMQ (Redis-Backed Queue)

```env
QUEUE_DRIVER=redis
REDIS_HOST=127.0.0.1
```

---

## 10. File Storage

### 10.1 Local Storage (Default)

Files are stored in `storage/uploads/`.

### 10.2 Usage

```typescript
// Upload a file
const filePath = await storage.put('avatars/user1.png', fileBuffer);

// Download
const content = await storage.get('avatars/user1.png');

// Check if exists
const exists = await storage.exists('avatars/user1.png');

// Delete
await storage.delete('avatars/user1.png');

// Get URL
const url = storage.url('avatars/user1.png');
```

### 10.3 S3 Storage

Add S3 configuration to your `.env`:

```env
S3_BUCKET=my-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY=AKIA...
S3_SECRET_KEY=...
```

Install the AWS SDK:
```bash
npm install @aws-sdk/client-s3
```

Use S3 disk:
```typescript
await storage.disk('s3').put('images/photo.jpg', buffer);
const url = storage.disk('s3').url('images/photo.jpg');
```

---

## 11. WebSocket

### 11.1 Setup

WebSocket support is provided via Socket.io. To use it:

```typescript
import { WebSocket } from './src/websocket/WebSocket.js';
import http from 'node:http';

const server = http.createServer(app.express);
const ws = new WebSocket(server);

ws.onConnection((socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('chat:message', (data) => {
    ws.broadcast('/chat', 'chat:message', data);
  });
});
```

### 11.2 Client-Side

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:7700');

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('chat:message', { text: 'Hello!' });
});

socket.on('chat:message', (data) => {
  console.log('Received:', data);
});
```

---

## 12. AI Gateway

### 12.1 Configuration

Set your AI provider in `.env`:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

### 12.2 Usage

```typescript
import { AIGateway } from './src/ai/AIGateway.js';

const ai = new AIGateway();
ai.autoConfig();

// Chat conversation
const result = await ai.chat([
  { role: 'system', content: 'You are a helpful coding assistant.' },
  { role: 'user', content: 'Write a function to reverse a string in TypeScript.' },
]);
console.log(result.content);

// Simple completion
const text = await ai.complete('Summarize the benefits of TypeScript');

// Embeddings (OpenAI only)
const vector = await ai.embed('HyperZ is a modern framework');
```

### 12.3 Create AI Actions

```bash
npx tsx bin/hyperz.ts make:ai-action ContentSummarizer
```

This creates `app/ai/ContentSummarizer.ts` with a ready-to-use template.

### 12.4 Switching Providers

Just change the `.env`:

```env
# Switch to Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Switch to Google AI
AI_PROVIDER=google
GOOGLE_AI_API_KEY=...
```

### 12.5 Prompt Templates
Organize your prompts in `app/prompts/`. Create `app/prompts/hiring/job-desc.md`:
```markdown
Write a job description for a {{role}} with {{experience}} years of experience.
```

Usage in code:
```typescript
import { PromptManager } from '../../src/ai/PromptManager.js';
const prompts = new PromptManager(process.cwd());
const content = await prompts.load('hiring/job-desc', {
    role: 'Senior Backend Engineer',
    experience: '5+'
});
```

### 12.6 Vector DB & RAG
Enable a RAG pipeline by using the `VectorDB` registry.

```typescript
import { VectorDB } from '../../src/ai/VectorDB.js';

const vectorDb = VectorDB.use('pinecone'); // Driver from .env

// Indexing
await vectorDb.upsert('kb_articles', [
    { id: '1', text: 'HyperZ uses a service provider architecture.', metadata: { category: 'arch' } }
]);

// Search
const results = await vectorDb.search('kb_articles', 'How is HyperZ structured?');
```

### 12.7 AI Actions & Fallback
Define structured AI actions with automatic provider fallback.

```typescript
const job = await ai.action('code-review')
    .withContext({ code: 'const x = 1;' })
    .withProvider('openai')
    .execute();
```

## 13. Enterprise SaaS Core

### 13.1 Multi-Tenancy
Access the current tenant automatically via `req.tenant`.

```typescript
router.get('/settings', (req, res) => {
    const tenant = req.tenant; // { id: 'acme', name: 'ACME Corp', ... }
});
```

### 13.2 Billing & Usage
Record usage for billing purposes.

```typescript
await billing.recordUsage(req.tenant.id, 'tokens', 1500);
```

### 13.3 AI Agents
Create autonomous agents with specific skills.

```typescript
const supportAgent = Agent.create('Support-Bot', ai)
    .withSkills(['troubleshooting', 'politeness'])
    .withMemory('short-term')
    .build();

const response = await supportAgent.run('My API key is not working');
```

---

## 14. API Playground

### 13.1 Access

Navigate to **http://localhost:7700/api/playground** after starting the server.

### 13.2 How to Use

1. **Browse Routes** — The left sidebar auto-discovers all registered API routes. Click any route to load it.
2. **Set Method & URL** — The top bar has a method selector and URL input.
3. **Add Headers** — The "Headers" tab lets you add/remove request headers.
4. **Add Body** — The "Body" tab has a JSON editor for POST/PUT/PATCH requests.
5. **Auth** — The "Auth" tab supports Bearer Token, Basic Auth, and API Key.
6. **Send** — Click "Send ⚡" or press `Ctrl+Enter`.
7. **View Response** — The bottom pane shows status, timing, body (with JSON highlighting), and headers.
8. **Error Logs** — The "Errors" tab in the response pane captures all 4xx/5xx errors.
9. **History** — Previous requests appear in the sidebar for quick replay.
10. **Theme** — Toggle between dark and light modes with the 🌙/☀️ button.

---

## 15. i18n / Localization

### 14.1 Translation Files

Translations are JSON files in `lang/<locale>/messages.json`:

```json
{
  "welcome": "Welcome to HyperZ!",
  "greeting": "Hello, :name!",
  "errors": {
    "not_found": "Resource not found."
  }
}
```

### 14.2 Usage

```typescript
import { I18n } from './src/i18n/I18n.js';

// Simple translation
I18n.t('welcome');                        // "Welcome to HyperZ!"

// With placeholders
I18n.t('greeting', { name: 'John' });     // "Hello, John!"

// Nested keys
I18n.t('errors.not_found');               // "Resource not found."

// Switch language
I18n.setLocale('bn');
I18n.t('welcome');                        // "হাইপারজেড-এ স্বাগতম!"
```

---

## 16. Enterprise Readiness

### 15.1 Dependency Injection
HyperZ provides a robust DI system using the `Inversify`-like pattern with native decorators.

```typescript
import { Injectable, Singleton } from '../../src/core/Decorators.js';

@Injectable()
@Singleton()
export class AnalyticsService {
    track(event: string) { /* ... */ }
}

@Injectable()
export class UserController extends Controller {
    constructor(private analytics: AnalyticsService) {
        super();
    }
}
```

### 15.2 Monitoring & Metrics
Access the monitoring dashboard in the Admin Panel (`/monitoring`).

- **CPU/Memory:** Real-time gauges.
- **Event Loop Lag:** Critical for Node.js performance tuning.
- **Top Endpoints:** Identify bottleneck routes.
- **Error Tracking:** Real-time 5xx error rate monitoring.

### 14.3 Adding a New Language

1. Create `lang/es/messages.json`
2. Add your translations
3. Switch locale: `I18n.setLocale('es')`

---

## 17. Events & Scheduling

### 15.1 Events

```typescript
import { EventDispatcher } from './src/events/EventDispatcher.js';

// Register a listener
EventDispatcher.on('order.created', async (order) => {
  console.log(`New order #${order.id} for $${order.total}`);
  // Send confirmation email, update inventory, etc.
});

// Fire the event
await EventDispatcher.dispatch('order.created', {
  id: 42,
  total: 99.99,
  items: ['Widget', 'Gadget'],
});
```

### 15.2 Task Scheduling

```typescript
import { Scheduler } from './src/scheduling/Scheduler.js';

const scheduler = new Scheduler();

scheduler
  .everyMinute('health-check', async () => {
    // Monitor uptime
  })
  .daily('db-backup', async () => {
    // Backup database
  })
  .weekly('analytics-report', async () => {
    // Generate and email weekly report
  });

scheduler.start();
```

---

## 18. Mail

### 16.1 Configuration

```env
MAIL_DRIVER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USER=your_username
MAIL_PASSWORD=your_password
MAIL_FROM_NAME=HyperZ
MAIL_FROM_ADDRESS=noreply@hyperz.dev
```

### 16.2 Sending Emails

```typescript
import { Mailer } from './src/mail/Mailer.js';

await Mailer.send({
  to: 'user@example.com',
  subject: 'Welcome to HyperZ!',
  html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
});
```

---

## 19. Testing

### 17.1 HTTP Test Client

```typescript
import { TestClient } from './src/testing/TestClient.js';

const client = new TestClient(app.express);

// GET request
const res = await client.get('/api/products');
console.log(res.status); // 200

// POST with body
const res2 = await client.post('/api/products', {
  name: 'Test Widget',
  price: 9.99,
});

// Authenticated request
const res3 = await client.withToken('your-jwt-token').get('/api/profile');
```

---

## 20. Tinker REPL

Start an interactive REPL with preloaded app context:

```bash
npx tsx bin/hyperz.ts tinker
```

Available in the REPL:
- `db` — Database instance
- `Logger` — Logger
- `env(key)` — Environment variable access
- `sleep(ms)` — Async sleep
- `randomString(len)` — Random string

```
hyperz > await db.query('SELECT * FROM products LIMIT 5')
hyperz > env('APP_NAME')     // "HyperZ"
hyperz > .exit               // Quit
```

---

## 21. Plugins

### 19.1 Creating a Plugin

Create a directory in `plugins/` with a default export:

```typescript
// plugins/analytics/index.ts
export default {
  name: 'analytics',
  register(app: any) {
    // Register bindings
  },
  boot(app: any) {
    // Run setup logic
  },
};
```

### 19.2 Auto-Discovery

Plugins are automatically discovered and loaded when you use:

```typescript
import { PluginManager } from './src/core/PluginManager.js';

const pm = new PluginManager(app.basePath);
await pm.loadAll(app);
```

---

## 22. Admin Panel

HyperZ includes a **built-in Next.js admin panel** for visual management — no terminal required.

### 20.1 Setup

```bash
# Navigate to the admin directory
cd admin

# Install dependencies
npm install

# Start the admin panel (port 3100)
npm run dev
```

> The HyperZ API must be running on port 7700 (`npm run dev` in the project root).

### 20.2 Pages

1. **📊 Dashboard** — System health overview: uptime, memory usage, Node version, route count, table count. Includes quick action buttons to navigate to other pages.

2. **🏗️ Scaffolding** — Visual resource creator. Select a type (controller, model, migration, seeder, middleware, route, job, factory), enter a name, and click Create. Models can optionally include a migration.

3. **🗄️ Database** — Browse all database tables, view column schema and data. Run migrations, rollback, or seed directly from the UI. Supports pagination for large tables.

4. **🛤️ Routes** — View all registered Express routes with color-coded method badges (GET=green, POST=blue, PUT=yellow, DELETE=red). Search and filter by method.

5. **⚙️ Config & Env** — Two tabs:
   - **Environment Variables** — Inline key-value editor for `.env`. Add, edit, remove variables and save.
   - **Config Files** — Browse and view all config files in `config/`.

6. **💾 Cache & Queue** — Service status overview for Cache, Queue, Storage, and WebSocket. Flush all cache with one click.

7. **📋 Logs** — View application log files with:
   - Color-coded log levels (ERROR=red, WARN=yellow, INFO=green, DEBUG=cyan)
   - Text filter
   - Log file selector
   - Auto-refresh toggle (every 3 seconds)

8. **🤖 AI Gateway** — Provider status cards for OpenAI, Anthropic, and Google AI. Shows API key status, default models, and gateway configuration.

### 20.3 Admin API Endpoints

The admin panel communicates via `/api/_admin/*` endpoints:

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

## 23. CLI Reference

| Command | Description |
|---|---|
| `make:controller <Name> [-m M]` | Create a controller (link to model with `-m`) |
| `make:model <Name> [-m]` | Create a model (optionally with migration) |
| `make:migration <name>` | Create a database migration |
| `make:seeder <Name>` | Create a database seeder |
| `make:middleware <Name>` | Create a middleware class |
| `make:route <name>` | Create a route file |
| `make:auth` | Scaffold persistent authentication (BCrypt, TypeORM) |
| `make:job <Name>` | Create a queue job class |
| `make:factory <Name>` | Create a database factory |
| `make:ai-action <Name>` | Create an AI action class |
| `make:test <Name> [-f]` | Create a unit or feature test |
| `make:module <Name>` | Scaffold full domain module (model+controller+route+migration+test) |
| `migrate` | Run pending migrations |
| `migrate:rollback` | Rollback last migration batch |
| `db:seed` | Run all database seeders |
| `db:seed -c <Name>` | Run a specific seeder |
| `key:generate` | Generate application encryption key |
| `serve` | Start the development server |
| `route:list` | List all registered route files |
| `tinker` | Start interactive REPL |

---

## 24. Deployment

### 22.1 Docker Deployment (Recommended)

**Production** — build and start the full stack:
```bash
# Build and start (app + Redis)
docker compose up -d --build

# View logs
docker compose logs -f app

# Stop
docker compose down
```

**Development** — hot-reload with source mounting:
```bash
docker compose -f docker-compose.dev.yml up
```

**Standalone** — without Docker Compose:
```bash
docker build -t hyperz .
docker run -d --name hyperz -p 7700:7700 --env-file .env hyperz
```

### 22.2 Manual Deployment

```env
APP_ENV=production
APP_DEBUG=false
APP_PORT=3000
```

### 22.3 Build

```bash
npm run build
```

### 22.4 Start Production Server

```bash
node dist/server.js
```

### 22.5 Process Manager (PM2)

```bash
npm install -g pm2
pm2 start dist/server.js --name hyperz
pm2 save
```

---

## 25. Troubleshooting

### Common Issues

| Issue | Solution |
|---|---|
| `APP_KEY is empty` | Run `npx tsx bin/hyperz.ts key:generate` |
| `SQLITE_ERROR` | Run `npx tsx bin/hyperz.ts migrate` |
| Port already in use | Change `APP_PORT` in `.env` |
| Module not found | Run `npm install` |
| Redis connection refused | Start Redis or switch to `CACHE_DRIVER=memory` |
| S3 driver unavailable | Run `npm install @aws-sdk/client-s3` |
| Socket.io not working | Ensure `npm install socket.io` was run |
| AI API errors | Check your API key in `.env`, ensure provider is correct |

### Getting Help

- 📋 [Product Features Specification](FEATURES.md)
- 🐛 [GitHub Issues](https://github.com/ShahjahanAli/HyperZ/issues)
- 💬 [Discussions](https://github.com/ShahjahanAli/HyperZ/discussions)

---

## 23. Security Services

HyperZ ships a full security suite configured via `config/security.ts`.

### 23.1 Password Hashing

```typescript
import { HashService } from '../../src/auth/HashService.js';

const hash = await HashService.make('my-password');
const valid = await HashService.check('my-password', hash);
const rehash = await HashService.needsRehash(hash, 14); // check cost factor
```

### 23.2 Encryption

AES-256-GCM authenticated encryption using `APP_KEY`:

```typescript
import { Encrypter } from '../../src/support/Encrypter.js';

const encrypted = Encrypter.encrypt('sensitive-data');
const decrypted = Encrypter.decrypt(encrypted); // "sensitive-data"
```

### 23.3 Signed URLs

Generate tamper-proof URLs with expiration:

```typescript
import { SignedUrl } from '../../src/support/SignedUrl.js';

const url = SignedUrl.create('https://example.com/download', { file: 'report.pdf' }, 3600);
const isValid = SignedUrl.verify(url); // true / false
```

### 23.4 CSRF Protection

Enabled automatically via `SecurityServiceProvider`. Uses double-submit cookie pattern.

- Cookie: `XSRF-TOKEN` (auto-set on every response)
- Header: `X-XSRF-TOKEN` (client must send on POST/PUT/PATCH/DELETE)
- Safe methods (GET/HEAD/OPTIONS) are excluded

### 23.5 Request Sanitization

Enabled automatically. Strips XSS payloads and blocks prototype pollution on `req.body`, `req.query`, and `req.params`.

### 23.6 HTTPS Enforcement

In production (`APP_ENV=production`), HTTP requests are automatically redirected to HTTPS. Respects `X-Forwarded-Proto` behind reverse proxies.

### 23.7 Token Blacklisting

Revoke JWTs before expiry:

```typescript
import { TokenBlacklist } from '../../src/auth/TokenBlacklist.js';

await TokenBlacklist.revoke('jwt-id-here');
const revoked = await TokenBlacklist.isRevoked('jwt-id-here');
```

### 23.8 API Key Authentication

Protect routes with hashed API keys and scopes:

```typescript
import { apiKeyMiddleware } from '../../src/auth/ApiKeyMiddleware.js';

router.get('/data', apiKeyMiddleware(async (key) => {
  // Look up key hash in DB, return { valid: true, scopes: ['read'] }
}, ['read']), controller.index.bind(controller));
```

### Environment Variables

```env
APP_KEY=base64:...          # Required for encryption + signed URLs
WEBHOOK_SECRET=your-secret  # Default webhook signing secret
WEBHOOK_MAX_RETRIES=3       # Max webhook delivery retry attempts
```

---

## 24. Feature Flags

### 24.1 Configuration

Define flags in `config/features.ts`:

```typescript
export default {
  flags: {
    'new-dashboard': { driver: 'config', value: true },
    'beta-ai':       { driver: 'env', envKey: 'FEATURE_BETA_AI' },
    'premium-only':  { driver: 'custom' },
  },
};
```

### 24.2 Runtime Checks

```typescript
import { FeatureFlags } from '../../src/support/FeatureFlags.js';

if (await FeatureFlags.enabled('new-dashboard')) {
  // Feature is on
}

// Dynamic definition with context
FeatureFlags.define('premium-only', async (ctx) => ctx?.user?.plan === 'premium');
await FeatureFlags.enabled('premium-only', { user: req.user });
```

### 24.3 Route Gating

```typescript
import { featureMiddleware } from '../../src/support/FeatureFlags.js';

router.get('/v2/dashboard', featureMiddleware('new-dashboard'), controller.v2Dashboard.bind(controller));
// Returns 404 if flag is disabled
```

---

## 25. Lifecycle Hooks

Register global hooks that fire outside the normal middleware chain:

```typescript
import { LifecycleHooks } from '../../src/http/LifecycleHooks.js';

// Before route handler
LifecycleHooks.onRequest(async (req, res) => {
  req.startTime = Date.now();
});

// After response is sent
LifecycleHooks.onResponse(async (req, res) => {
  console.log(`${req.method} ${req.url} → ${res.statusCode}`);
});

// On unhandled error
LifecycleHooks.onError(async (err, req, res) => {
  externalErrorTracker.report(err);
});

// After response stream closes
LifecycleHooks.onFinish(async (req, res) => {
  const duration = Date.now() - req.startTime;
  metrics.record(req.url, duration);
});
```

---

## 26. Audit Log

### 26.1 Manual Recording

```typescript
import { AuditLog } from '../../src/logging/AuditLog.js';

AuditLog.record({
  action: 'user.login',
  userId: user.id,
  ip: req.ip,
  metadata: { method: 'password' },
});

// Track model changes
AuditLog.recordChange({
  model: 'Post',
  modelId: post.id,
  action: 'update',
  before: { title: 'Old Title' },
  after: { title: 'New Title' },
});
```

### 26.2 Auto-Middleware

The `auditMiddleware()` is registered by `FeaturesServiceProvider` and automatically logs all POST/PUT/PATCH/DELETE requests.

### 26.3 Querying

```typescript
const entries = await AuditLog.getEntries({
  action: 'user.login',
  userId: '42',
  since: new Date('2026-01-01'),
  until: new Date(),
});
```

---

## 27. Webhook System

### 27.1 Register & Dispatch

```typescript
import { WebhookManager } from '../../src/webhooks/WebhookManager.js';

// Register an endpoint
WebhookManager.register({
  url: 'https://partner.example.com/hooks',
  events: ['order.created', 'order.shipped'],
  secret: 'shared-secret',
});

// Dispatch an event
await WebhookManager.dispatch('order.created', { orderId: 123, total: 49.99 });
```

### 27.2 Verify Incoming Webhooks

```typescript
const isValid = WebhookManager.verifySignature(rawBody, signatureHeader, secret);
```

### 27.3 Delivery Logs

```typescript
const logs = WebhookManager.getDeliveryLogs();
// [{ id, url, event, status, statusCode, attempts, ... }]
```

---

## 28. Query Builder (DB Facade)

A fluent SQL query builder for raw database access without models:

```typescript
import { DB } from '../../src/database/QueryBuilder.js';

// Select
const admins = await DB.table('users').where('role', 'admin').orderBy('name').get();

// Insert
await DB.table('products').insert({ name: 'Widget', price: 9.99 });

// Update
await DB.table('products').where('id', 1).update({ price: 12.99 });

// Delete
await DB.table('products').where('id', 1).delete();

// Count & exists
const total = await DB.table('orders').count();
const hasAdmin = await DB.table('users').where('role', 'admin').exists();

// Pagination
const page = await DB.table('posts').paginate(1, 20);

// Transactions
await DB.transaction(async () => {
  await DB.table('accounts').where('id', 1).update({ balance: 90 });
  await DB.table('accounts').where('id', 2).update({ balance: 110 });
});
```

---

## 29. AI Streaming (SSE)

Stream AI responses to clients using Server-Sent Events:

```typescript
import { StreamResponse, sseMiddleware } from '../../src/ai/StreamResponse.js';

router.post('/ai/chat', sseMiddleware(), async (req, res) => {
  const stream = new StreamResponse(res);
  stream.start();

  // Stream from AI provider
  const iterator = ai.streamChat(req.body.messages);
  await stream.streamIterator(iterator);

  // Or write tokens manually
  stream.write('Hello');
  stream.write(' world');
  stream.writeEvent('done', JSON.stringify({ tokens: 42 }));
  stream.end();
});
```

**Client-side consumption:**
```javascript
const eventSource = new EventSource('/api/ai/chat');
eventSource.onmessage = (e) => console.log(e.data);
eventSource.addEventListener('done', (e) => { /* final stats */ });
```

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/ShahjahanAli">Shahjahan Ali</a>
</p>

<p align="center">
  <sub>⚡ HyperZ — Ship faster. Scale effortlessly.</sub>
</p>
