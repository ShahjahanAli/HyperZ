---
title: Using Plugins
description: Install and use HyperZ plugins
---

## Overview

HyperZ has a first-class plugin ecosystem. Plugins can add routes, middleware, services, CLI commands, and more — all through a formalized contract with lifecycle hooks, dependency resolution, and config validation.

## Installing Plugins

### From npm

```bash
npm install hyperz-plugin-analytics
```

If the package has a `"hyperz-plugin"` key in its `package.json`, HyperZ auto-discovers and loads it at boot time. No manual registration needed.

### Local Plugins

Create a directory in `plugins/` with an `index.ts` entry point:

```
plugins/
└── my-plugin/
    └── index.ts
```

Local plugins are auto-discovered from the `plugins/` directory.

### Manual Registration

```typescript
// app.ts
import myPlugin from './plugins/my-plugin/index.js';

const app = createApp();
await app.plugins.register(myPlugin);
```

## Plugin Lifecycle

1. **Discovery** — Plugins found in `node_modules/` and `plugins/`
2. **Validation** — Plugin structure and config schema checked
3. **Registration** — Config defaults merged, services bound, `register()` hook called
4. **Boot** — Dependencies resolved, `boot()` hook called in dependency order
5. **Runtime** — Plugin services available to your application
6. **Shutdown** — `shutdown()` hook called on graceful termination

## Health Checks

Plugins can define health check hooks:

```typescript
const health = await app.plugins.healthCheck();
// Map<string, boolean> — plugin name → healthy

for (const [name, healthy] of health) {
    console.log(`${name}: ${healthy ? '✅' : '❌'}`);
}
```

## Querying Plugins

```typescript
// Check if a plugin is loaded
app.plugins.has('hyperz-plugin-analytics');

// Get plugin info
const entry = app.plugins.get('hyperz-plugin-analytics');
console.log(entry?.status); // 'booted'
console.log(entry?.plugin.meta.version); // '1.2.0'

// List all plugins
const all = app.plugins.all(); // Map<string, PluginRegistryEntry>

// Only booted plugins
const booted = app.plugins.booted();

// Only failed plugins (for debugging)
const failed = app.plugins.failed();
```

## Plugin Events

Listen for plugin lifecycle events:

```typescript
app.plugins.on('plugin:registered', (event) => {
    console.log(`Plugin registered: ${event.pluginName}`);
});

app.plugins.on('plugin:booted', (event) => {
    console.log(`Plugin booted: ${event.pluginName}`);
});

app.plugins.on('plugin:failed', (event) => {
    console.error(`Plugin failed: ${event.pluginName}`, event.data);
});
```
