---
title: "Lifecycle & Hooks"
description: "Hook into every stage of the HyperZ request lifecycle with LifecycleHooks — onRequest, onResponse, onError, and onFinish."
---

**Lifecycle Hooks** let you run logic at every stage of a request's journey through HyperZ. Unlike middleware, lifecycle hooks fire beyond the normal middleware stack — making them ideal for telemetry, audit logging, and request transformation.

## Registering Hooks

Use the `LifecycleHooks` API to register callbacks for each lifecycle phase:

```typescript
import { LifecycleHooks } from '../../src/http/LifecycleHooks.js';

// Fires before any middleware or route handler
LifecycleHooks.onRequest((req, res) => {
  req.startTime = Date.now();
});

// Fires after the response is sent
LifecycleHooks.onResponse((req, res) => {
  const duration = Date.now() - req.startTime;
  console.log(`${req.method} ${req.path} — ${duration}ms`);
});
```

## Error Hooks

Capture and handle errors globally, independent of your error-handling middleware:

```typescript
LifecycleHooks.onError((err, req, res) => {
  // Report to external error tracking service
  Sentry.captureException(err, {
    extra: { path: req.path, method: req.method },
  });
});
```

## Finish Hooks

Run cleanup logic after the response has been fully sent and the connection is closed:

```typescript
LifecycleHooks.onFinish((req, res) => {
  // Clean up temporary files, release resources
  if (req.tempFiles) {
    req.tempFiles.forEach((file: string) => fs.unlinkSync(file));
  }
});
```

## Hook Execution Order

Hooks execute in the following order for each request:

1. `onRequest` hooks (in registration order)
2. Middleware stack & route handler
3. `onResponse` hooks (in registration order)
4. `onFinish` hooks (after connection close)
5. `onError` hooks (only if an error occurred, at the point of failure)
