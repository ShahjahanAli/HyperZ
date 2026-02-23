---
title: "Events"
description: "Decouple your HyperZ application with the EventDispatcher — define events, register listeners, and dispatch asynchronously."
---

The **EventDispatcher** provides a publish-subscribe system for decoupling components. Emit events from anywhere and handle them with dedicated listener functions.

## Registering Listeners

Register event listeners during application boot:

```typescript
import { EventDispatcher } from '../../src/events/EventDispatcher.js';

EventDispatcher.on('user.created', async (user) => {
  await sendWelcomeEmail(user);
});

EventDispatcher.on('user.created', async (user) => {
  await createDefaultSettings(user);
});
```

## Dispatching Events

Emit events with a payload:

```typescript
// After creating a user
const user = await User.create(data);
await EventDispatcher.dispatch('user.created', user);
```

## One-Time Listeners

Register a listener that fires only once:

```typescript
EventDispatcher.once('app.ready', () => {
  console.log('Application is ready!');
});
```

## Typed Events

Define event types for type safety:

```typescript
interface AppEvents {
  'user.created': { id: number; email: string };
  'order.placed': { orderId: number; total: number };
  'payment.failed': { orderId: number; reason: string };
}

EventDispatcher.on<AppEvents['user.created']>('user.created', async (payload) => {
  // payload is typed as { id: number; email: string }
  console.log(`New user: ${payload.email}`);
});
```
