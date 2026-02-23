---
title: "Queues & Jobs"
description: "Offload heavy tasks in HyperZ with background queues — Sync and BullMQ drivers, job classes, retries, and delayed dispatch."
---

**Queues** let you defer time-consuming tasks — like sending emails or processing uploads — to background workers. HyperZ supports **Sync** (in-process) and **BullMQ** (Redis-backed) drivers.

## Configuration

Set the queue driver in `.env`:

```bash
QUEUE_DRIVER=sync   # sync | redis
REDIS_URL=redis://localhost:6379
```

## Creating a Job

Use the CLI to scaffold a job:

```bash
npx tsx bin/hyperz.ts make:job SendWelcomeEmail
```

Define the job in `app/jobs/`:

```typescript
import { BaseJob } from '../../src/queue/QueueManager.js';

export class SendWelcomeEmail extends BaseJob {
  constructor(private userId: number) {
    super();
  }

  async handle(): Promise<void> {
    const user = await User.find(this.userId);
    await mailer.send('welcome', { to: user.email, data: { name: user.name } });
  }

  retries = 3;
  backoff = 5000; // ms between retries
}
```

## Dispatching Jobs

Push jobs onto the queue from anywhere in your application:

```typescript
import { Queue } from '../../src/queue/QueueManager.js';

// Dispatch immediately
await Queue.dispatch(new SendWelcomeEmail(user.id));

// Dispatch with delay (milliseconds)
await Queue.dispatch(new SendWelcomeEmail(user.id), { delay: 60000 });
```

## Job Lifecycle

Jobs go through these states:

1. **Queued** — waiting to be picked up
2. **Processing** — currently executing `handle()`
3. **Completed** — finished successfully
4. **Failed** — threw an error (retried up to `retries` times)
