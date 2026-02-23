---
title: "Mail"
description: "Send emails from your HyperZ application using Nodemailer — SMTP configuration, templates, and queued delivery."
---

**Mail** in HyperZ is powered by Nodemailer. Configure your SMTP credentials once, then send emails from anywhere in your application using a clean, fluent API.

## Configuration

Set mail credentials in `.env`:

```bash
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USER=your-username
MAIL_PASS=your-password
MAIL_FROM=noreply@example.com
```

Configure in `config/mail.ts`:

```typescript
export default {
  host: env('MAIL_HOST', 'localhost'),
  port: Number(env('MAIL_PORT', '587')),
  auth: {
    user: env('MAIL_USER', ''),
    pass: env('MAIL_PASS', ''),
  },
  from: env('MAIL_FROM', 'noreply@example.com'),
};
```

## Sending Emails

Use the `Mailer` class to send messages:

```typescript
import { Mailer } from '../../src/mail/Mailer.js';

const mailer = new Mailer();

await mailer.send({
  to: 'user@example.com',
  subject: 'Welcome to HyperZ',
  html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
});
```

## Queued Emails

Offload email sending to a background queue for better response times:

```typescript
import { Queue } from '../../src/queue/QueueManager.js';
import { SendWelcomeEmail } from '../jobs/SendWelcomeEmail.js';

await Queue.dispatch(new SendWelcomeEmail(user.id));
```

## Attachments

Include file attachments in your emails:

```typescript
await mailer.send({
  to: 'user@example.com',
  subject: 'Your Invoice',
  html: '<p>Please find your invoice attached.</p>',
  attachments: [
    { filename: 'invoice.pdf', path: '/storage/invoices/inv-001.pdf' },
  ],
});
```
