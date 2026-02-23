---
title: "Plugin API Reference"
description: "Extend HyperZ with plugins — the Plugin API for registering services, routes, middleware, and hooks from auto-discovered plugin packages."
---

The **Plugin API** lets you extend HyperZ with reusable, self-contained modules. Plugins placed in the `plugins/` directory are auto-discovered and loaded during application boot.

## Plugin Structure

A plugin is a directory with an `index.ts` entry point:

```
plugins/
└── my-plugin/
    ├── index.ts
    ├── routes.ts
    └── package.json (optional)
```

## Creating a Plugin

Export a plugin object with `register` and optional `boot` methods:

```typescript
import type { Application } from '../../src/core/Application.js';

export default {
  name: 'my-plugin',
  version: '1.0.0',

  register(app: Application): void {
    // Bind services into the container
    app.singleton('my-plugin.service', () => new MyPluginService());
  },

  boot(app: Application): void {
    // Register routes, middleware, hooks, etc.
    const router = app.make('router');
    router.get('/my-plugin/status', (req, res) => {
      res.json({ status: 'active' });
    });
  },
};
```

## Plugin Discovery

Plugins are auto-discovered from the `plugins/` directory. No manual registration is needed — just place your plugin folder and restart the application.

## Plugin Manager API

Interact with loaded plugins programmatically:

```typescript
import { PluginManager } from '../../src/core/PluginManager.js';

// List loaded plugins
const plugins = PluginManager.all();

// Check if a plugin is loaded
const loaded = PluginManager.has('my-plugin');

// Get a plugin instance
const plugin = PluginManager.get('my-plugin');
```

## Best Practices

- Keep plugins self-contained — bundle routes, services, and migrations together
- Use the container for dependency injection rather than hard imports
- Provide a `package.json` with metadata for discoverability
- Namespace your container bindings (e.g., `my-plugin.service`) to avoid conflicts
