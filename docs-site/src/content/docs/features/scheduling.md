---
title: "Scheduling"
description: "Schedule recurring tasks in HyperZ using the cron-based task scheduler — define schedules, run jobs, and manage task frequency."
---

The **Scheduler** lets you define recurring tasks using cron expressions. Schedule jobs, commands, or arbitrary functions to run automatically at specified intervals.

## Defining Schedules

Register scheduled tasks during application boot:

```typescript
import { Scheduler } from '../../src/scheduling/Scheduler.js';

// Run every minute
Scheduler.schedule('* * * * *', async () => {
  await cleanUpExpiredTokens();
});

// Run every hour
Scheduler.schedule('0 * * * *', async () => {
  await generateHourlyReport();
});

// Run daily at midnight
Scheduler.schedule('0 0 * * *', async () => {
  await pruneOldLogs();
});
```

## Scheduling Jobs

Dispatch queue jobs on a schedule:

```typescript
import { Queue } from '../../src/queue/QueueManager.js';
import { DailyDigest } from '../jobs/DailyDigest.js';

// Send daily digest emails every day at 8 AM
Scheduler.schedule('0 8 * * *', async () => {
  const users = await User.all();
  for (const user of users) {
    await Queue.dispatch(new DailyDigest(user.id));
  }
});
```

## Cron Expression Reference

| Expression | Description |
|---|---|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Daily at midnight |
| `0 0 * * 1` | Every Monday at midnight |
| `0 0 1 * *` | First day of every month |

## Error Handling

Wrap scheduled tasks with error handling to prevent failures from stopping the scheduler:

```typescript
Scheduler.schedule('0 * * * *', async () => {
  try {
    await processQueue();
  } catch (error) {
    logger.error('Scheduled task failed:', error);
  }
});
```
