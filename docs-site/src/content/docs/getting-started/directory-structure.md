---
title: Directory Structure
description: Understand the HyperZ project layout
---

## Overview

```
HyperZ/
├── app/                    # YOUR application code
│   ├── controllers/        # HTTP controllers
│   ├── models/             # Database models
│   ├── middleware/          # Custom middleware
│   ├── routes/             # Route files (auto-loaded)
│   ├── jobs/               # Queue job classes
│   └── ai/                 # AI action classes
│
├── config/                 # Configuration files
├── database/
│   ├── migrations/         # TypeORM/Drizzle migrations
│   ├── seeders/            # Database seeders
│   └── factories/          # Data factories (Faker)
│
├── src/                    # Framework core (don't modify)
│   ├── core/               # Application, Container, Plugins
│   ├── http/               # Router, Controller, Adapters
│   ├── database/           # Model, Database, Drizzle, QueryBuilder
│   ├── auth/               # JWT, RBAC, API keys
│   ├── ai/                 # AI Gateway, Agents, Prompts
│   ├── docs/               # Swagger, Scalar, OpenAPI
│   ├── cache/              # Cache drivers
│   ├── queue/              # Queue drivers
│   ├── events/             # Event dispatcher
│   ├── mail/               # Mailer
│   ├── storage/            # File storage
│   ├── websocket/          # WebSocket (Socket.io)
│   └── ...                 # More framework modules
│
├── docs-site/              # Starlight documentation site
├── admin/                  # Next.js Admin Panel
├── plugins/                # Local plugins (auto-discovered)
├── lang/                   # Translation files
├── storage/                # Runtime storage (logs, cache, uploads)
├── .env                    # Environment variables
├── app.ts                  # Application bootstrap
└── server.ts               # Server entry point
```

## Key Directories

### `app/` — Your Code

This is where all your application-specific code lives. The framework never modifies files here.

- **controllers/** — Handle HTTP requests and return responses
- **models/** — Define database entities and relationships
- **routes/** — Define URL patterns (auto-loaded, no registration needed)
- **middleware/** — Custom request/response filters
- **jobs/** — Background tasks for queue processing
- **ai/** — AI action classes for structured AI tasks

### `config/` — Configuration

Each file exports a configuration object. Values are typically read from environment variables with sensible defaults.

### `database/` — Schema & Seeds

- **migrations/** — Schema changes (timestamped, run via CLI)
- **seeders/** — Sample/default data for development
- **factories/** — Faker-powered data generators for testing

### `src/` — Framework Core

:::caution
Do not modify files in `src/` unless you're contributing to the framework itself.
:::

The framework's internal modules. Organized by domain (auth, cache, database, etc.).

### `plugins/` — Local Plugins

Place local plugin directories here. Each plugin should have an `index.ts` entry point exporting a `HyperZPlugin` object. They are auto-discovered at boot time.
