---
title: "Framework Comparison"
description: "See how HyperZ compares to Express.js, NestJS, Fastify, AdonisJS, and other Node.js frameworks."
---

HyperZ is a **Laravel-inspired, batteries-included** framework for Node.js. Here's how it compares to popular alternatives.

## Comparison Table

| Feature | HyperZ | Express.js | NestJS | Fastify | AdonisJS |
|---|---|---|---|---|---|
| **TypeScript-first** | ✅ Strict mode | ❌ Optional | ✅ Built-in | ❌ Optional | ✅ Built-in |
| **IoC Container** | ✅ Built-in | ❌ None | ✅ Built-in | ❌ None | ✅ Built-in |
| **ORM / Models** | ✅ Active Record | ❌ BYO | ❌ BYO | ❌ BYO | ✅ Lucid |
| **Migrations** | ✅ TypeORM | ❌ BYO | ❌ BYO | ❌ BYO | ✅ Built-in |
| **Auth (JWT + RBAC)** | ✅ Built-in | ❌ BYO | ❌ BYO | ❌ BYO | ✅ Built-in |
| **Validation** | ✅ Zod | ❌ BYO | ✅ class-validator | ❌ BYO | ✅ VineJS |
| **AI Gateway** | ✅ Built-in | ❌ None | ❌ None | ❌ None | ❌ None |
| **Queue System** | ✅ Sync + BullMQ | ❌ BYO | ✅ Bull | ❌ BYO | ❌ BYO |
| **CLI Scaffolding** | ✅ Full suite | ❌ None | ✅ Nest CLI | ❌ None | ✅ Ace CLI |
| **WebSockets** | ✅ Socket.io | ❌ BYO | ✅ Built-in | ❌ BYO | ❌ BYO |
| **Feature Flags** | ✅ Built-in | ❌ None | ❌ None | ❌ None | ❌ None |
| **Admin Panel** | ✅ Next.js | ❌ None | ❌ None | ❌ None | ❌ None |

*BYO = Bring Your Own (requires third-party packages)*

## Why HyperZ?

```typescript
// One command to scaffold a full CRUD module
// npx hyperz make:module Product

// Creates: Model, Controller, Routes, Migration, Test
// With: validation, auth middleware, pagination — all wired up
```

## Key Differentiators

- **AI-Native**: Built-in AI Gateway, Agents, Prompt Manager, Vector DB, and SSE streaming
- **Enterprise-Ready**: Multi-tenancy, audit logging, feature flags, and RBAC out of the box
- **Laravel-Inspired DX**: Convention-over-configuration with powerful CLI scaffolding
- **Express.js 5 Foundation**: Full compatibility with the Express ecosystem

## Migration Guides

Coming soon:
- Migrating from Express.js to HyperZ
- Migrating from NestJS to HyperZ
- Migrating from AdonisJS to HyperZ
