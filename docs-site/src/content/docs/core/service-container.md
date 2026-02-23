---
title: "Service Container"
description: "Learn about HyperZ's IoC container — binding, singleton registration, auto-resolution, and decorator-based dependency injection."
---

The **Service Container** is the heart of HyperZ's dependency injection system. It manages class dependencies and performs automatic resolution, allowing you to write loosely coupled, testable code following Inversion of Control (IoC) principles.

## Binding Services

Register services into the container using `bind()` for transient bindings or `singleton()` for shared instances.

```typescript
import { Container } from '../../src/core/Container.js';

const container = new Container();

// Transient binding — new instance each time
container.bind('logger', () => new ConsoleLogger());

// Singleton binding — same instance every time
container.singleton('config', () => new ConfigManager());
```

## Resolving Services

Retrieve services from the container using `make()`. The container will automatically resolve nested dependencies.

```typescript
const logger = container.make<ConsoleLogger>('logger');
const config = container.make<ConfigManager>('config');
```

## Auto-Resolution

The container can automatically resolve classes and their constructor dependencies without explicit registration.

```typescript
import { Injectable } from '../../src/core/Container.js';

@Injectable()
class UserService {
  constructor(private logger: ConsoleLogger) {}
}

// Container automatically resolves ConsoleLogger
const userService = container.make(UserService);
```

## Decorators

HyperZ provides decorators for streamlined dependency injection:

```typescript
import { Injectable, Singleton } from '../../src/core/Container.js';

@Injectable()
class AnalyticsService {
  constructor(private logger: Logger) {}
}

@Singleton()
class CacheService {
  // Only one instance will ever be created
}
```

## Contextual Binding

Provide different implementations based on the consuming class.

```typescript
container.bind('mailer', () => new SmtpMailer());

// When NotificationService needs a mailer, give it a different one
container.when(NotificationService).needs('mailer').give(() => new SesMailer());
```
