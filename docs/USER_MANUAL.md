# ⚡ HyperZ Framework — User Manual

**Version:** 2.0.0  
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
DB_DRIVER=postgresql
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

---

## 4. Creating Your First API

### Step 1: Create a Controller

```bash
npx tsx bin/hyperz.ts make:controller ProductController
```

This creates `app/controllers/ProductController.ts`:

```typescript
import { Controller } from '../../src/http/Controller.js';
import type { Request, Response } from 'express';

export class ProductController extends Controller {
  async index(req: Request, res: Response): Promise<void> {
    // Fetch all products
    this.success(res, [], 'Products retrieved');
  }

  async store(req: Request, res: Response): Promise<void> {
    // Create a product
    this.created(res, req.body, 'Product created');
  }

  async show(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.success(res, { id }, 'Product found');
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.success(res, { id, ...req.body }, 'Product updated');
  }

  async destroy(req: Request, res: Response): Promise<void> {
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
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.decimal('price', 10, 2).notNullable();
    table.integer('stock').defaultTo(0);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('products');
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

// Update
await Product.update(1, { price: 12.99 });

// Delete
await Product.delete(1);

// Soft delete (if model supports it)
await Product.softDelete(1);
await Product.restore(1);
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

### 6.1 Scaffold Auth

```bash
npx tsx bin/hyperz.ts make:auth
npx tsx bin/hyperz.ts migrate   # Run the generated auth migrations
```

This creates:
- `app/controllers/AuthController.ts`
- `app/routes/auth.ts`
- Auth migration with users, roles, and permissions tables

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

---

## 13. API Playground

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

## 14. i18n / Localization

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

### 14.3 Adding a New Language

1. Create `lang/es/messages.json`
2. Add your translations
3. Switch locale: `I18n.setLocale('es')`

---

## 15. Events & Scheduling

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

## 16. Mail

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

## 17. Testing

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

## 18. Tinker REPL

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

## 19. Plugins

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

## 20. CLI Reference

| Command | Description |
|---|---|
| `make:controller <Name>` | Create an HTTP controller |
| `make:model <Name> [-m]` | Create a model (optionally with migration) |
| `make:migration <name>` | Create a database migration |
| `make:seeder <Name>` | Create a database seeder |
| `make:middleware <Name>` | Create a middleware class |
| `make:route <name>` | Create a route file |
| `make:auth` | Scaffold full auth system |
| `make:job <Name>` | Create a queue job class |
| `make:factory <Name>` | Create a database factory |
| `make:ai-action <Name>` | Create an AI action class |
| `migrate` | Run pending migrations |
| `migrate:rollback` | Rollback last migration batch |
| `db:seed` | Run all database seeders |
| `db:seed -c <Name>` | Run a specific seeder |
| `key:generate` | Generate application encryption key |
| `serve` | Start the development server |
| `route:list` | List all registered route files |
| `tinker` | Start interactive REPL |

---

## 21. Deployment

### 21.1 Production Environment

```env
APP_ENV=production
APP_DEBUG=false
APP_PORT=3000
```

### 21.2 Build

```bash
npm run build
```

### 21.3 Start Production Server

```bash
node dist/server.js
```

### 21.4 Process Manager (PM2)

```bash
npm install -g pm2
pm2 start dist/server.js --name hyperz
pm2 save
```

---

## 22. Troubleshooting

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

<p align="center">
  Built with ❤️ by <a href="https://github.com/ShahjahanAli">Shahjahan Ali</a>
</p>

<p align="center">
  <sub>⚡ HyperZ — Ship faster. Scale effortlessly.</sub>
</p>
