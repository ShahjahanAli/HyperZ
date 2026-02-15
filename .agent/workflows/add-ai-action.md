---
description: How to create an AI-powered action using the AI Gateway
---

# Add an AI Action

## Steps

// turbo-all

1. Ensure an AI provider is configured in `.env`:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

2. Create the AI action:
```bash
npx tsx bin/hyperz.ts make:ai-action <Name>Action
```

3. Edit `app/ai/<Name>Action.ts` — customize the system prompt and messages.

4. Use the AI Gateway in a controller:
```typescript
import { AIGateway } from '../../src/ai/AIGateway.js';

const ai = new AIGateway();
ai.autoConfig();

// Chat
const result = await ai.chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: userInput },
]);

// Simple completion
const text = await ai.complete('Summarize this article...');

// Embeddings (OpenAI only)
const vector = await ai.embed('text to embed');
```

## Supported Providers

| Provider | Env Variable | Models |
|---|---|---|
| OpenAI | `OPENAI_API_KEY` | GPT-4o, GPT-4o-mini |
| Anthropic | `ANTHROPIC_API_KEY` | Claude 4 Sonnet |
| Google AI | `GOOGLE_AI_API_KEY` | Gemini 2.0 Flash |
