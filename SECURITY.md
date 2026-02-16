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

HyperZ implements several default security measures:
- **JWT Authentication**: Secure, stateless session management.
- **Bcrypt Hashing**: Industry-standard password hashing.
- **SQL Injection Protection**: Prepared statements via Knex/TypeORM.
- **XSS Protection**: HTML sanitization helpers and secure templating defaults.
- **Rate Limiting**: Built-in protection against brute-force attacks.
