---
title: Installation
description: How to install and set up HyperZ
---

## Prerequisites

- **Node.js** ≥ 20
- **npm** or **pnpm**
- **Git**

## Create a New Project

```bash
# Clone the starter template
git clone https://github.com/hyperz-framework/hyperz my-api
cd my-api

# Install dependencies
npm install

# Generate encryption keys
npx tsx bin/hyperz.ts key:generate

# Run migrations
npx tsx bin/hyperz.ts migrate

# Start the dev server
npm run dev
```

Your API is now running at **http://localhost:7700/api**.

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Key variables to configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_PORT` | Server port | `7700` |
| `APP_ENV` | Environment | `development` |
| `DB_DRIVER` | Database driver (`sqlite`, `mysql`, `postgresql`) | `sqlite` |
| `APP_KEY` | Encryption key (auto-generated) | — |
| `JWT_SECRET` | JWT signing secret (auto-generated) | — |
| `AI_PROVIDER` | AI provider (`openai`, `anthropic`, `google`) | `openai` |
| `HTTP_ADAPTER` | HTTP framework (`express`, `fastify`, `hono`) | `express` |
| `ORM_DRIVER` | ORM (`typeorm`, `drizzle`) | `typeorm` |

## Verify Installation

```bash
# Check the health endpoint
curl http://localhost:7700/health

# List all routes
npx tsx bin/hyperz.ts route:list

# Open API playground
open http://localhost:7700/api/playground
```

## Project Structure

After installation, your project looks like this:

```
my-api/
├── app/                    # Your application code
│   ├── controllers/        # HTTP controllers
│   ├── models/             # Database models
│   ├── routes/             # Route definitions
│   ├── middleware/          # Custom middleware
│   └── jobs/               # Queue jobs
├── config/                 # Configuration files
├── database/
│   ├── migrations/         # Database migrations
│   └── seeders/            # Database seeders
├── src/                    # Framework core (don't edit)
├── .env                    # Environment variables
├── app.ts                  # Application bootstrap
└── server.ts               # Server entry point
```

## Next Steps

- [Quick Start Guide](/getting-started/quick-start/) — Build your first endpoint
- [Configuration](/getting-started/configuration/) — Deep dive into config files
- [CLI Commands](/cli/commands/) — Learn the scaffolding tools
