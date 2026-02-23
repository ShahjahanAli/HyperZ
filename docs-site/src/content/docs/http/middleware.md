---
title: "Middleware"
description: "Create and register middleware in HyperZ — global middleware, route-level middleware, and Kernel registration."
---

**Middleware** intercepts incoming requests before they reach your route handlers. HyperZ supports both global middleware (applied to every request) and route-level middleware (applied selectively).

## Creating Middleware

Use the CLI to scaffold middleware:

```bash
npx tsx bin/hyperz.ts make:middleware ThrottleMiddleware
```

Or create one manually in `app/middleware/`:

```typescript
import type { Request, Response, NextFunction } from 'express';

export class ThrottleMiddleware {
  handle(req: Request, res: Response, next: NextFunction): void {
    // Perform throttle logic
    const allowed = this.checkRateLimit(req);

    if (!allowed) {
      res.status(429).json({ message: 'Too many requests' });
      return;
    }

    next();
  }

  private checkRateLimit(req: Request): boolean {
    // Rate limiting implementation
    return true;
  }
}
```

## Route-Level Middleware

Apply middleware to specific routes or route groups:

```typescript
import { authMiddleware } from '../../src/auth/AuthMiddleware.js';
import { validate } from '../../src/validation/Validator.js';

// Single route
router.post('/products', authMiddleware, controller.store.bind(controller));

// Route group
router.group({ middleware: [authMiddleware] }, (r) => {
  r.get('/dashboard', controller.dashboard.bind(controller));
  r.get('/settings', controller.settings.bind(controller));
});
```

## Global Middleware (Kernel)

Register middleware that runs on every request in the HTTP Kernel:

```typescript
import type { Application } from '../../src/core/Application.js';

export class Kernel {
  middleware = [
    corsMiddleware,
    bodyParserMiddleware,
    sanitizeMiddleware,
  ];

  routeMiddleware: Record<string, Function> = {
    auth: authMiddleware,
    throttle: throttleMiddleware,
    role: roleMiddleware,
  };
}
```

## Middleware Execution Order

Middleware executes in the order it is registered:

1. Global middleware (from Kernel)
2. Route group middleware
3. Route-level middleware
4. Controller method
