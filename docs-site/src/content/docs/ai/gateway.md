---
title: "AI Gateway"
description: "Use HyperZ's unified AI Gateway to interact with OpenAI, Anthropic, and Google AI through a single interface."
---

The **AI Gateway** provides a unified interface for working with multiple AI providers — OpenAI, Anthropic, and Google AI (Gemini). Switch providers with a config change; your application code stays the same.

## Configuration

Set your AI provider and credentials in `.env`:

```bash
AI_PROVIDER=openai        # openai | anthropic | google
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
```

Configure models and defaults in `config/ai.ts`:

```typescript
export default {
  provider: env('AI_PROVIDER', 'openai'),
  models: {
    default: 'gpt-4o',
    fast: 'gpt-4o-mini',
  },
  maxTokens: 4096,
};
```

## Sending Requests

Use the gateway to send chat completions:

```typescript
import { AIGateway } from '../../src/ai/AIGateway.js';

const ai = new AIGateway();

const response = await ai.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Explain quantum computing in one paragraph.' },
]);

console.log(response.content);
```

## Structured Actions

Define reusable AI actions for specific tasks:

```typescript
const summary = await ai.action('summarize', {
  text: articleContent,
  maxLength: 200,
});
```

## Streaming Responses

Stream tokens as they arrive for real-time UIs:

```typescript
const stream = ai.streamChat([
  { role: 'user', content: 'Write a short story.' },
]);

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```
