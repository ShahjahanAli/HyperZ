# Contributing to HyperZ

Thank you for your interest in contributing to HyperZ! We are building the world's first AI-native Enterprise SaaS framework, and we welcome help from the community.

## How to Contribute

1. **Bug Reports & Feature Requests:** Please open an issue on GitHub.
2. **Code Contributions:**
    - Fork the repository.
    - Create a new branch for your feature or fix.
    - Write tests for your changes.
    - Ensure all existing tests pass (`npm test`).
    - Submit a Pull Request with a clear description of the changes.

## Development Setup

1. `npm install`
2. `cp .env.example .env` (and configure)
3. `npx hyperz key:generate`
4. `npm run dev`

## Running Tests

```bash
npm test          # Run all tests (Vitest)
npm run test:ci   # Run in CI mode
```

The test suite covers: service container, router, validator, cache, events, models, security (encryption, CSRF, hashing, signed URLs, token blacklist, API keys), feature flags, lifecycle hooks, audit log, webhooks, AI streaming, and OpenAPI generation.

## Coding Standards

- Use TypeScript strict mode for all new code
- Follow the framework's existing patterns (Service Providers, DI, etc.)
- Use `.js` extensions in import paths (ES Module output)
- Write tests for new features (use `npx hyperz make:test <Name>` to scaffold)
- Update documentation in `docs/` for any new features

## Contribution Areas

| Area | Directory | Description |
|---|---|---|
| Core Framework | `src/` | Service providers, container, lifecycle |
| Security | `src/security/`, `src/auth/` | Encryption, auth, CSRF, sanitization |
| Database | `src/database/` | Query builder, models, migrations |
| AI | `src/ai/` | AI gateway, streaming, agents, RAG |
| Webhooks | `src/webhooks/` | Webhook dispatch, signing, delivery |
| Feature System | `src/support/` | Feature flags, helpers, encrypter |
| HTTP | `src/http/` | Router, controller, middleware, hooks |
| CLI | `src/cli/` | Commands, scaffolding stubs |
| Admin Panel | `admin/` | Next.js dashboard |
| Documentation | `docs/` | User manual, features, comparisons |

## Roadmap

Check the `README.md` for our current v2 vision and future plans.
