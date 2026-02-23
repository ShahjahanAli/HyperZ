---
title: "Encryption & Hashing"
description: "Secure sensitive data in HyperZ with AES-256-GCM encryption, bcrypt password hashing, and tamper-proof signed URLs."
---

HyperZ provides three security primitives: **Encrypter** for symmetric encryption, **HashService** for password hashing, and **SignedUrl** for tamper-proof URL generation.

## Encrypter (AES-256-GCM)

Encrypt and decrypt sensitive data using your `APP_KEY`:

```typescript
import { Encrypter } from '../../src/support/Encrypter.js';

// Encrypt plaintext
const encrypted = Encrypter.encrypt('sensitive-data');

// Decrypt back to plaintext
const decrypted = Encrypter.decrypt(encrypted);
// => 'sensitive-data'
```

The `APP_KEY` is set in your `.env` file. Generate one with:

```bash
npx tsx bin/hyperz.ts key:generate
```

## HashService (bcrypt)

Hash and verify passwords securely:

```typescript
import { HashService } from '../../src/auth/HashService.js';

// Hash a password
const hash = await HashService.make('my-password');

// Verify a password against a hash
const valid = await HashService.check('my-password', hash);
// => true
```

## SignedUrl

Create tamper-proof, time-limited URLs:

```typescript
import { SignedUrl } from '../../src/support/SignedUrl.js';

// Create a signed URL (expires in 3600 seconds)
const url = SignedUrl.create('https://example.com/download', { fileId: '42' }, 3600);

// Verify a signed URL
const valid = SignedUrl.verify(url);
// => true (if not expired and not tampered with)
```

## Configuration

Security settings are defined in `config/security.ts`:

```typescript
export default {
  encryption: {
    algorithm: 'aes-256-gcm',
  },
  hashing: {
    driver: 'bcrypt',
    rounds: 12,
  },
};
```
