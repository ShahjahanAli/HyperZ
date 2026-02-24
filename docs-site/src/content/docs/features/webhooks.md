---
title: "Webhooks"
description: "Send and receive webhooks in HyperZ — register endpoints, dispatch events with HMAC signing, automatic retries, and delivery logging."
---

**Webhooks** in HyperZ let you notify external systems when events occur in your application. The `WebhookManager` handles HMAC signing, automatic retries with exponential backoff, and delivery logging.

## Configuration

Set webhook defaults in `.env` and `config/webhooks.ts`:

```bash
WEBHOOK_SECRET=your-secret-key
WEBHOOK_MAX_RETRIES=3
```

```typescript
export default {
  secret: env('WEBHOOK_SECRET', ''),
  maxRetries: Number(env('WEBHOOK_MAX_RETRIES', '3')),
  timeout: 30000, // Request timeout in ms
};
```

## Registering Webhook Endpoints

Register external URLs to receive events:

```typescript
import { WebhookManager } from '../../src/webhooks/WebhookManager.js';

WebhookManager.register({
  url: 'https://partner.example.com/webhooks',
  events: ['user.created', 'order.placed'],
  secret: 'endpoint-specific-secret',
});
```

## Dispatching Webhooks

Trigger webhook delivery when events occur:

```typescript
await WebhookManager.dispatch('user.created', {
  id: user.id,
  email: user.email,
  createdAt: user.created_at,
});
```

## Verifying Incoming Webhooks

Verify HMAC signatures on received webhook payloads:

```typescript
const isValid = WebhookManager.verifySignature(
  req.body,           // Raw payload
  req.headers['x-webhook-signature'] as string,
  secret,
);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

## Retry & Delivery Logging

Failed deliveries are automatically retried with exponential backoff. Delivery attempts are logged for debugging:

- **Attempt 1** — immediate
- **Attempt 2** — after 5 seconds
- **Attempt 3** — after 25 seconds
