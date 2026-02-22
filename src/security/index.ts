// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Security Barrel Export
// ──────────────────────────────────────────────────────────────
//
// Re-exports all security-related modules for convenient imports:
//
//   import { HashService, Encrypter, SignedUrl } from '../../src/security/index.js';
// ──────────────────────────────────────────────────────────────

// ── Auth / Cryptography ─────────────────────────────────────
export { HashService } from '../auth/HashService.js';
export { TokenBlacklist } from '../auth/TokenBlacklist.js';
export type { BlacklistStore } from '../auth/TokenBlacklist.js';
export { apiKeyMiddleware, hashApiKey } from '../auth/ApiKeyMiddleware.js';
export type { ApiKeyRecord, ApiKeyResolver } from '../auth/ApiKeyMiddleware.js';

// ── Encryption & Signing ────────────────────────────────────
export { Encrypter } from '../support/Encrypter.js';
export { SignedUrl } from '../support/SignedUrl.js';

// ── Middleware ───────────────────────────────────────────────
export { sanitizeMiddleware } from '../http/middleware/SanitizeMiddleware.js';
export type { SanitizeOptions } from '../http/middleware/SanitizeMiddleware.js';
export { httpsMiddleware } from '../http/middleware/HttpsMiddleware.js';
export type { HttpsOptions } from '../http/middleware/HttpsMiddleware.js';
export { csrfMiddleware } from '../http/middleware/CsrfMiddleware.js';
export type { CsrfOptions } from '../http/middleware/CsrfMiddleware.js';

// ── Provider ────────────────────────────────────────────────
export { SecurityServiceProvider } from '../providers/SecurityServiceProvider.js';
