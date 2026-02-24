# Security Policy

## Supported Versions

We provide security updates for the following versions of HyperZ:

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within HyperZ, please send an e-mail to security@hyperz.dev. All security vulnerabilities will be promptly addressed.

Please include the following in your report:
- A description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact.

**Do not open a public issue for security vulnerabilities.**

## Security Practices

HyperZ implements comprehensive default security measures:

### Authentication & Authorization
- **JWT Authentication**: Secure, stateless session management with `AuthManager`
- **Token Blacklisting**: Revoke JWTs before expiry via `TokenBlacklist` (pluggable store)
- **API Key Auth**: SHA-256 hashed API key authentication with scope-based access via `ApiKeyMiddleware`
- **RBAC**: Role-based access control with Gates, Policies, and middleware

### Cryptography
- **Bcrypt Hashing**: Industry-standard password hashing via `HashService` (configurable cost factor)
- **AES-256-GCM Encryption**: Authenticated encryption via `Encrypter` using `APP_KEY`
- **HMAC-SHA256 Signed URLs**: Tamper-proof URL generation via `SignedUrl` with expiration support

### Request Protection
- **CSRF Protection**: Double-submit cookie pattern with timing-safe comparison
- **Request Sanitization**: Auto-strips XSS payloads and blocks prototype pollution on body/query/params
- **HTTPS Enforcement**: Automatic HTTP→HTTPS redirect in production (respects `X-Forwarded-Proto`)
- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Rate Limiting**: Per-user/per-key/per-IP tiered rate limiting

### Data Protection
- **SQL Injection Protection**: Prepared statements via TypeORM
- **Input Validation**: Zod schema validation middleware
- **Audit Logging**: Automatic logging of all state-changing requests

### Webhook Security
- **HMAC-SHA256 Signing**: All outbound webhooks are cryptographically signed
- **Signature Verification**: `WebhookManager.verifySignature()` for inbound webhook validation
