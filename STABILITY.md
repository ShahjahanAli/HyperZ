# HyperZ: API Stability Guarantees & Versioning Policy

This document outlines the stability guarantees and versioning commitment for the HyperZ framework.

## Semantic Versioning (SemVer)

HyperZ follows [Semantic Versioning 2.0.0](https://semver.org/).

- **MAJOR** version (v2.x.x → v3.x.x): Breaking changes that require developer action.
- **MINOR** version (v2.0.x → v2.1.x): New features and improvements, fully backward compatible.
- **PATCH** version (v2.0.0 → v2.0.1): Bug fixes and security patches only.

## Deprecation Policy

When an API or feature is scheduled for removal:
1. It will be marked as `@deprecated` in a **MINOR** version.
2. It will remain functional for at least one full **MINOR** release cycle.
3. It will be removed in the next **MAJOR** version.

## Long-Term Support (LTS)

HyperZ identifies specific versions for Long-Term Support:
- **v2.5 (Current Goal)**: Designated as the first LTS candidate.
- **LTS Duration**: 18 months of maintenance (security fixes and critical bug fixes).

## Experimental Features

Features marked with **[EXPERIMENTAL]** or placed in internal `_` namespaces (e.g., `/api/_admin`) do not follow the strict SemVer guarantees and may change in minor releases.

## Module Stability Matrix

| Module | Status | Since |
|---|---|---|
| Core (Container, Providers, Router) | **Stable** | v2.0 |
| Authentication (JWT, RBAC) | **Stable** | v2.0 |
| Database (TypeORM, Migrations) | **Stable** | v2.0 |
| Validation (Zod) | **Stable** | v2.0 |
| Cache, Queue, Mail, Storage | **Stable** | v2.0 |
| Security Suite (Encrypter, CSRF, Sanitization, HashService) | **Stable** | v2.1 |
| Token Blacklisting, API Key Auth | **Stable** | v2.1 |
| Signed URLs, HTTPS Enforcement | **Stable** | v2.1 |
| Feature Flags | **Stable** | v2.1 |
| Lifecycle Hooks | **Stable** | v2.1 |
| Audit Log | **Stable** | v2.1 |
| Query Builder (DB Facade) | **Stable** | v2.1 |
| Webhook System | **Stable** | v2.1 |
| AI Streaming (SSE) | **Stable** | v2.1 |
| AI Gateway & Agents | Maturing | v2.0 |
| GraphQL Integration | Maturing | v2.0 |
| Admin Panel | **[EXPERIMENTAL]** | v2.0 |
| MCP Server | **[EXPERIMENTAL]** | v2.0 |
| Multi-Tenancy | **[EXPERIMENTAL]** | v2.0 |
| Billing | **[EXPERIMENTAL]** | v2.0 |
