---
title: "Storage"
description: "Store and retrieve files in HyperZ using the Storage abstraction — Local filesystem and Amazon S3 drivers."
---

**Storage** in HyperZ provides a unified API for file operations across **Local** filesystem and **Amazon S3** backends. Switch drivers via configuration without changing application code.

## Configuration

Set the storage driver in `.env`:

```bash
STORAGE_DRIVER=local   # local | s3
S3_BUCKET=my-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

Configure in `config/storage.ts`:

```typescript
export default {
  driver: env('STORAGE_DRIVER', 'local'),
  local: {
    root: 'storage/uploads',
  },
  s3: {
    bucket: env('S3_BUCKET', ''),
    region: env('S3_REGION', 'us-east-1'),
  },
};
```

## Storing Files

```typescript
import { Storage } from '../../src/storage/Storage.js';

// Store a buffer or string
await Storage.put('avatars/user-1.png', fileBuffer);

// Store from an upload (Express multer file)
await Storage.putFile('documents', req.file);
```

## Retrieving Files

```typescript
// Get file contents as Buffer
const contents = await Storage.get('avatars/user-1.png');

// Get a public URL
const url = await Storage.url('avatars/user-1.png');

// Check if file exists
const exists = await Storage.exists('avatars/user-1.png');
```

## Deleting Files

```typescript
await Storage.delete('avatars/user-1.png');
```

## Listing Files

```typescript
const files = await Storage.files('documents/');
// => ['documents/report.pdf', 'documents/invoice.pdf']
```
