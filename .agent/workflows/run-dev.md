---
description: How to start the development environment
---

# Start Development Environment

## Steps

// turbo-all

1. Install dependencies (if not done):
```bash
npm install
```

2. Generate application key (first time only):
```bash
npx hyperz key:generate
```

3. Copy environment config (first time only):
```bash
cp .env.example .env
```

4. Start the HyperZ API server:
```bash
npm run dev
```

The server runs at `http://localhost:7700/api` with hot-reload.

5. (Optional) Start the Admin Panel in a separate terminal:
```bash
cd admin
npm install
npm run dev
```

The admin panel runs at `http://localhost:3100`.

## Useful URLs

| URL | Description |
|---|---|
| `http://localhost:7700/api` | API base |
| `http://localhost:7700/api/playground` | API Playground |
| `http://localhost:3100` | Admin Panel |
