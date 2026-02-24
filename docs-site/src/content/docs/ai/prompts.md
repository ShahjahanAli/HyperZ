---
title: "Prompt Manager"
description: "Manage AI prompt templates in HyperZ — load versioned templates from files, interpolate variables, and organize prompts by domain."
---

The **Prompt Manager** lets you manage AI prompt templates as files rather than hardcoding them in your application. It supports versioning, variable interpolation, and domain-based organization.

## Storing Prompts

Place prompt templates in `app/prompts/` organized by domain:

```
app/prompts/
├── email/
│   ├── welcome.md
│   └── welcome@v2.md
├── support/
│   └── ticket-reply.md
└── summary/
    └── article.md
```

## Loading Templates

Use the `PromptManager` to load and render templates:

```typescript
import { PromptManager } from '../../src/ai/PromptManager.js';

const prompts = new PromptManager();

// Load a prompt with variable interpolation
const prompt = await prompts.load('email/welcome', {
  user: 'Jane',
  product: 'HyperZ',
});
```

## Versioned Prompts

Append `@version` to the template name to use a specific version:

```typescript
// Load version 2 of the welcome email prompt
const prompt = await prompts.load('email/welcome@v2', {
  user: 'Jane',
  product: 'HyperZ',
});
```

This lets you A/B test prompts or roll back to previous versions without code changes.

## Using with AI Gateway

Combine the Prompt Manager with the AI Gateway for structured AI workflows:

```typescript
const ai = new AIGateway();
const prompts = new PromptManager();

const systemPrompt = await prompts.load('support/ticket-reply', {
  companyName: 'Acme Corp',
  tone: 'professional',
});

const response = await ai.chat([
  { role: 'system', content: systemPrompt },
  { role: 'user', content: ticketMessage },
]);
```
