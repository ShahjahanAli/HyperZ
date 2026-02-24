---
title: "AI Agents"
description: "Build autonomous AI workflows in HyperZ using Agent.create() — multi-step reasoning, tool use, and orchestrated task execution."
---

**AI Agents** in HyperZ enable autonomous, multi-step workflows powered by large language models. Agents can reason, use tools, and execute complex tasks without manual orchestration.

## Creating an Agent

Use `Agent.create()` to define an agent with a name and AI gateway:

```typescript
import { Agent } from '../../src/ai/Agent.js';
import { AIGateway } from '../../src/ai/AIGateway.js';

const ai = new AIGateway();

const agent = Agent.create('research-assistant', ai)
  .withSystemPrompt('You are a research assistant that finds and summarizes information.')
  .withTools([searchTool, summarizeTool])
  .withMaxSteps(10);
```

## Running an Agent

Execute the agent with a user prompt:

```typescript
const result = await agent.run('Find the latest papers on transformer architectures and summarize the key findings.');

console.log(result.output);
console.log(result.steps); // Array of reasoning steps taken
```

## Defining Tools

Agents can use tools to interact with external systems:

```typescript
const searchTool = {
  name: 'search',
  description: 'Search the web for information',
  parameters: {
    query: { type: 'string', description: 'Search query' },
  },
  async execute({ query }: { query: string }) {
    // Perform search and return results
    return await searchService.search(query);
  },
};
```

## Agent in API Routes

Use agents within controllers to power API endpoints:

```typescript
export class ResearchController extends Controller {
  async query(req: Request, res: Response): Promise<void> {
    const agent = Agent.create('assistant', ai)
      .withSystemPrompt('Answer user questions accurately.')
      .withMaxSteps(5);

    const result = await agent.run(req.body.question);
    this.success(res, { answer: result.output });
  }
}
```
