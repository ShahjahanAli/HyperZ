---
title: "Feature Flags"
description: "Manage feature rollouts in HyperZ with feature flags — define flags, check at runtime, gate routes, and use custom drivers."
---

**Feature Flags** let you enable or disable features at runtime without deploying new code. HyperZ supports config-based, environment-based, and custom flag drivers.

## Defining Flags

Define feature flags in `config/features.ts`:

```typescript
export default {
  flags: {
    'new-dashboard': true,
    'beta-ai': env('FEATURE_BETA_AI', 'false') === 'true',
    'dark-mode': false,
  },
};
```

Or programmatically with a custom resolver:

```typescript
import { FeatureFlags } from '../../src/support/FeatureFlags.js';

FeatureFlags.define('premium-features', async (context) => {
  return context?.user?.plan === 'premium';
});
```

## Checking Flags

Query flags anywhere in your application:

```typescript
import { FeatureFlags } from '../../src/support/FeatureFlags.js';

if (await FeatureFlags.enabled('new-dashboard')) {
  // Show new dashboard
}

if (await FeatureFlags.enabled('premium-features', { user })) {
  // Unlock premium features based on context
}
```

## Route Gating

Protect entire routes behind feature flags using middleware:

```typescript
import { featureMiddleware } from '../../src/support/FeatureFlags.js';

router.get('/v2/dashboard', featureMiddleware('new-dashboard'), controller.dashboard.bind(controller));
// Returns 404 if the flag is disabled
```

## Toggling Flags at Runtime

Enable or disable flags dynamically:

```typescript
FeatureFlags.enable('dark-mode');
FeatureFlags.disable('beta-ai');
```
