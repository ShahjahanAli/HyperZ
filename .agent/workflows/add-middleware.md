---
description: How to create and register custom middleware
---

# Add Middleware

## Steps

// turbo-all

1. Create the middleware:
```bash
npx tsx bin/hyperz.ts make:middleware <Name>Middleware
```

2. Edit the generated file in `app/middleware/<Name>Middleware.ts` to add your logic:
```typescript
import type { Request, Response, NextFunction } from 'express';

export function <Name>Middleware(req: Request, res: Response, next: NextFunction): void {
  // Your middleware logic here
  next();
}
```

3. Use in routes (two options):

**Option A: Per-route middleware**
```typescript
router.get('/path', <Name>Middleware, controller.method.bind(controller));
```

**Option B: Route group middleware**
```typescript
router.group({ prefix: '/protected', middleware: [<Name>Middleware] }, (r) => {
  r.get('/data', controller.index.bind(controller));
});
```
