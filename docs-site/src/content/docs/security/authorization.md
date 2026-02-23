---
title: "Authorization (RBAC)"
description: "Control access with HyperZ's role-based authorization — Gate, Policy, RoleMiddleware, and permission checks."
---

**Authorization** in HyperZ uses a role-based access control (RBAC) system. Define abilities with `Gate`, organize logic into `Policy` classes, and protect routes with `RoleMiddleware`.

## Gate — Defining Abilities

Register authorization checks globally:

```typescript
import { Gate } from '../../src/auth/Gate.js';

Gate.define('edit-post', (user, post) => {
  return user.id === post.authorId || user.role === 'admin';
});

Gate.define('delete-user', (user) => {
  return user.role === 'super-admin';
});
```

## Checking Permissions

Check abilities anywhere in your application:

```typescript
async update(req: Request, res: Response): Promise<void> {
  const post = await Post.find(req.params.id);

  if (!Gate.allows('edit-post', req.user, post)) {
    this.error(res, 'Unauthorized', 403);
    return;
  }

  const updated = await Post.update(post.id, req.body);
  this.success(res, updated);
}
```

## Policies

Organize authorization logic per model into policy classes:

```typescript
export class PostPolicy {
  view(user: AuthUser, post: Post): boolean {
    return post.published || user.id === post.authorId;
  }

  update(user: AuthUser, post: Post): boolean {
    return user.id === post.authorId;
  }

  delete(user: AuthUser, post: Post): boolean {
    return user.id === post.authorId || user.role === 'admin';
  }
}
```

## Role Middleware

Protect routes by requiring specific roles:

```typescript
import { RoleMiddleware } from '../../src/auth/RoleMiddleware.js';

// Only admins can access
router.get('/admin/users', RoleMiddleware('admin'), controller.index.bind(controller));

// Multiple roles allowed
router.put('/posts/:id', RoleMiddleware('admin', 'editor'), controller.update.bind(controller));
```
