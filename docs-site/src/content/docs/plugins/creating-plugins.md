---
title: Creating Plugins
description: Build your own HyperZ plugin
---

## Overview

HyperZ plugins are defined using the `definePlugin()` helper, which provides full type safety for the plugin contract.

## Minimal Plugin

```typescript
// plugins/my-plugin/index.ts
import { definePlugin } from '../../src/core/PluginContract.js';

export default definePlugin({
    meta: {
        name: 'my-plugin',
        version: '1.0.0',
        description: 'My first HyperZ plugin',
    },
    hooks: {
        register(app) {
            console.log('Plugin registered!');
        },
        boot(app) {
            console.log('Plugin booted!');
        },
    },
});
```

## Full Plugin Example

```typescript
import { definePlugin } from '../../src/core/PluginContract.js';
import type { Application } from '../../src/core/Application.js';

class AnalyticsService {
    track(event: string, data: Record<string, unknown>) {
        console.log(`[Analytics] ${event}`, data);
    }
}

export default definePlugin({
    meta: {
        name: 'hyperz-analytics',
        version: '2.0.0',
        description: 'Analytics tracking plugin',
        author: 'HyperZ Team',
        license: 'MIT',
        hyperz: '>=1.0.0',
    },

    // Configuration schema
    config: {
        key: 'analytics',
        defaults: {
            enabled: true,
            trackingId: '',
            sampleRate: 1.0,
        },
        envVars: ['ANALYTICS_TRACKING_ID'],
        validate(config) {
            if (!config.trackingId) {
                throw new Error('analytics.trackingId is required');
            }
        },
    },

    // Dependencies on other plugins
    dependencies: [
        { name: 'hyperz-auth', version: '>=1.0.0', required: false },
    ],

    // Lifecycle hooks
    hooks: {
        register(app) {
            app.container.singleton('analytics', () => new AnalyticsService());
        },

        boot(app) {
            const analytics = app.container.make<AnalyticsService>('analytics');
            analytics.track('plugin.booted', { plugin: 'hyperz-analytics' });
        },

        routes(app) {
            app.express.get('/api/analytics/events', (req, res) => {
                res.json({ events: [] });
            });
        },

        healthCheck() {
            return true;
        },

        shutdown(app) {
            console.log('Analytics plugin shutting down');
        },
    },

    // Global middleware
    middleware: [
        (req: any, _res: any, next: any) => {
            req.analyticsStartTime = Date.now();
            next();
        },
    ],

    tags: ['analytics', 'tracking'],
});
```

## Plugin Contract Reference

### `meta` (required)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ | Unique plugin identifier |
| `version` | `string` | ✅ | Semver version |
| `description` | `string` | | Human-readable description |
| `author` | `string \| object` | | Author info |
| `hyperz` | `string` | | Framework version constraint |
| `license` | `string` | | License identifier |

### `hooks` (optional)

| Hook | When Called | Use Case |
|------|-----------|----------|
| `register(app)` | Before boot | Bind services, set config |
| `boot(app)` | After all providers registered | Use services, initialize |
| `routes(app)` | After routes loaded | Add plugin routes |
| `commands(app)` | During boot | Register CLI commands |
| `healthCheck(app)` | On demand | Return plugin health status |
| `shutdown(app)` | App termination | Cleanup resources |

### `config` (optional)

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Config namespace key |
| `defaults` | `object` | Default values |
| `envVars` | `string[]` | Required env variables |
| `validate(config)` | `function` | Validation function (throw on error) |

### `dependencies` (optional)

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Required plugin name |
| `version` | `string` | Semver constraint |
| `required` | `boolean` | If `false`, dependency is optional |

## Publishing to npm

To make your plugin auto-discoverable, add a `hyperz-plugin` key to your `package.json`:

```json
{
  "name": "hyperz-plugin-analytics",
  "version": "2.0.0",
  "hyperz-plugin": {
    "entry": "dist/index.js"
  }
}
```

Then publish:

```bash
npm publish
```

Users install with `npm install hyperz-plugin-analytics` and it loads automatically.
