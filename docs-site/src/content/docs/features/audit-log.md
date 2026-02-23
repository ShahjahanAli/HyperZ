---
title: "Audit Logging"
description: "Track user actions and data changes in HyperZ with the AuditLog — record events, track model changes, and auto-log state-changing requests."
---

The **Audit Log** provides a structured way to record user actions and data changes for compliance, debugging, and security monitoring.

## Recording Events

Log arbitrary actions with metadata:

```typescript
import { AuditLog } from '../../src/logging/AuditLog.js';

await AuditLog.record({
  action: 'user.login',
  userId: user.id,
  ip: req.ip,
  metadata: { browser: req.headers['user-agent'] },
});
```

## Tracking Model Changes

Record before/after state when models are updated:

```typescript
const before = await Product.find(id);
const after = await Product.update(id, req.body);

await AuditLog.recordChange({
  model: 'Product',
  modelId: id,
  action: 'update',
  before,
  after,
  userId: req.user?.id,
});
```

## Automatic Audit Middleware

HyperZ includes middleware that automatically logs all state-changing HTTP requests (POST, PUT, PATCH, DELETE):

```typescript
// Enabled by default — logs:
// - HTTP method and path
// - User ID (if authenticated)
// - IP address
// - Request body (sanitized)
// - Response status code
```

## Querying Audit Logs

Retrieve audit entries for review:

```typescript
const logs = await AuditLog.query({
  userId: 42,
  action: 'user.login',
  from: new Date('2026-01-01'),
  to: new Date('2026-02-01'),
});
```
