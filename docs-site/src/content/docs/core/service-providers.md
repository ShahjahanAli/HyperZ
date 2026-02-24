---
title: "Service Providers"
description: "Understand how HyperZ service providers register and boot services during the application lifecycle."
---

**Service Providers** are the central place during application bootstrapping. Every core framework feature and your own application services are registered and booted through providers, following a two-phase lifecycle: `register()` and `boot()`.

## Provider Lifecycle

Each service provider goes through two phases:

1. **Register** — Bind services into the container. No other services should be resolved here.
2. **Boot** — All providers have been registered. You can now resolve services and perform initialization.

```typescript
import type { Application } from '../../src/core/Application.js';

export class AppServiceProvider {
  register(app: Application): void {
    // Bind services — do not resolve other services here
    app.singleton('analytics', () => new AnalyticsService());
  }

  boot(app: Application): void {
    // All services registered — safe to resolve and initialize
    const analytics = app.make<AnalyticsService>('analytics');
    analytics.initialize();
  }
}
```

## Creating a Service Provider

Use the CLI to scaffold a new provider or create one manually in `src/providers/`:

```typescript
export class PaymentServiceProvider {
  register(app: Application): void {
    app.singleton('payment', () => {
      return new StripePaymentGateway(env('STRIPE_KEY', ''));
    });
  }

  boot(app: Application): void {
    // Set up webhooks, event listeners, etc.
  }
}
```

## Registering Providers

Providers are registered in the application bootstrap file (`app.ts`):

```typescript
import { PaymentServiceProvider } from './src/providers/PaymentServiceProvider.js';

const app = await createApp({
  providers: [
    new PaymentServiceProvider(),
    // ...other providers
  ],
});
```

## Deferred Providers

For providers that are not needed on every request, you can defer loading until the service is actually resolved:

```typescript
export class ReportServiceProvider {
  deferred = true;
  provides = ['report-generator'];

  register(app: Application): void {
    app.singleton('report-generator', () => new ReportGenerator());
  }
}
```
