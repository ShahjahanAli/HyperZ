---
title: "Authentication"
description: "Implement JWT-based authentication in HyperZ — login, registration, guards, token refresh, and token blacklisting."
---

**Authentication** in HyperZ is powered by JSON Web Tokens (JWT). The framework provides a complete auth system with login, registration, guards, token refresh, and token blacklisting out of the box.

## Scaffolding Auth

Generate a full authentication system with a single command:

```bash
npx hyperz make:auth
```

This creates login, register, and token refresh routes along with the necessary controllers and middleware.

## Protecting Routes

Use the `authMiddleware` to require authentication on routes:

```typescript
import { authMiddleware } from '../../src/auth/AuthMiddleware.js';

router.group({ middleware: [authMiddleware] }, (r) => {
  r.get('/profile', controller.profile.bind(controller));
  r.put('/profile', controller.updateProfile.bind(controller));
});
```

## Accessing the Authenticated User

The authenticated user is available on `req.user` after the auth middleware:

```typescript
async profile(req: Request, res: Response): Promise<void> {
  const user = req.user;
  this.success(res, user, 'Profile retrieved');
}
```

## Token Blacklisting

Revoke tokens on logout or when security is compromised:

```typescript
import { TokenBlacklist } from '../../src/auth/TokenBlacklist.js';

// Revoke a token by its JTI (JWT ID)
await TokenBlacklist.revoke(jti);

// Check if a token has been revoked
const revoked = await TokenBlacklist.isRevoked(jti);
```

## API Key Authentication

For machine-to-machine auth, use API key middleware:

```typescript
import { apiKeyMiddleware } from '../../src/auth/ApiKeyMiddleware.js';

router.get('/external/data', apiKeyMiddleware(resolver, ['read:data']), handler);
```
