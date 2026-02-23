---
title: "Streaming (SSE)"
description: "Stream AI responses in real time with HyperZ's StreamResponse and SSE middleware — Server-Sent Events for token-by-token delivery."
---

**Streaming** in HyperZ uses Server-Sent Events (SSE) to deliver AI-generated content token-by-token to the client. This provides a real-time, ChatGPT-like experience for your API consumers.

## StreamResponse

Use `StreamResponse` to send streaming data from your controllers:

```typescript
import { StreamResponse } from '../../src/ai/StreamResponse.js';

async streamChat(req: Request, res: Response): Promise<void> {
  const stream = new StreamResponse(res);

  stream.start();
  stream.write('Hello');
  stream.write(', world');
  stream.write('!');
  stream.end();
}
```

## SSE Middleware

Apply the `sseMiddleware()` to routes that stream responses — it sets the correct headers automatically:

```typescript
import { sseMiddleware } from '../../src/ai/StreamResponse.js';

router.post('/chat/stream', sseMiddleware(), controller.streamChat.bind(controller));
```

## Streaming AI Responses

Stream tokens from the AI Gateway through an SSE connection:

```typescript
import { StreamResponse } from '../../src/ai/StreamResponse.js';
import { AIGateway } from '../../src/ai/AIGateway.js';

async streamAI(req: Request, res: Response): Promise<void> {
  const ai = new AIGateway();
  const stream = new StreamResponse(res);

  const iterator = ai.streamChat([
    { role: 'user', content: req.body.message },
  ]);

  stream.start();
  await stream.streamIterator(iterator);
  stream.end();
}
```

## Client-Side Consumption

Consume the SSE stream from a browser client:

```typescript
const eventSource = new EventSource('/api/chat/stream');

eventSource.onmessage = (event) => {
  const token = event.data;
  document.getElementById('output')!.textContent += token;
};

eventSource.addEventListener('done', () => {
  eventSource.close();
});
```
