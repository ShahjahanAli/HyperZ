---
title: "CSRF & XSS Protection"
description: "Protect your HyperZ application from CSRF and XSS attacks — double-submit cookie pattern, input sanitization, and SecurityServiceProvider."
---

HyperZ includes built-in protection against **Cross-Site Request Forgery (CSRF)** and **Cross-Site Scripting (XSS)** attacks, enabled automatically through the `SecurityServiceProvider`.

## CSRF Protection

HyperZ uses the **double-submit cookie** pattern. A CSRF token is set as a cookie and must be included in the request header for all state-changing requests (POST, PUT, PATCH, DELETE).

```typescript
// Client-side — include the CSRF token in request headers
fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': getCookie('XSRF-TOKEN'),
  },
  body: JSON.stringify({ name: 'Widget' }),
});
```

## Excluding Routes from CSRF

Some routes (like webhooks) need to bypass CSRF verification:

```typescript
// config/security.ts
export default {
  csrf: {
    enabled: true,
    exclude: [
      '/api/webhooks/*',
      '/api/stripe/callback',
    ],
  },
};
```

## XSS Sanitization

HyperZ automatically sanitizes request body, query parameters, and URL parameters to strip malicious scripts and prevent prototype pollution:

```typescript
// This input:
{ "name": "<script>alert('xss')</script>" }

// Is automatically sanitized to:
{ "name": "" }
```

The sanitization middleware runs globally and is registered by the `SecurityServiceProvider`.

## SecurityServiceProvider

Both CSRF and XSS protections are enabled through the `SecurityServiceProvider`, which is registered automatically during application boot:

```typescript
// Protections enabled automatically:
// - CSRF double-submit cookie verification
// - XSS input sanitization
// - Prototype pollution prevention
// - Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
```
