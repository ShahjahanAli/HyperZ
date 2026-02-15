import { AIGateway } from './AIGateway.js';
import { Logger } from '../logging/Logger.js';

export interface AgentConfig {
    name: string;
    skills: string[];
    memory: 'short-term' | 'vector' | 'persistent';
    tools: string[];
}

export class Agent {
    private ai: AIGateway;
    private config: AgentConfig;

    constructor(ai: AIGateway, config: AgentConfig) {
        this.ai = ai;
        this.config = config;
    }

    /**
     * Factory to create a named agent.
     */
    static create(name: string, ai: AIGateway): AgentBuilder {
        return new AgentBuilder(name, ai);
    }

    async run(prompt: string): Promise<string> {
        Logger.info(`[Agent:${this.config.name}] Running task: ${prompt}`);

        const systemPrompt = `You are an AI agent named "${this.config.name}". 
        Your skills are: ${this.config.skills.join(', ')}. 
        You have access to tools: ${this.config.tools.join(', ')}.
        Your memory type is: ${this.config.memory}.`;

        const response = await this.ai.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]);

        return response.content;
    }
}

export class AgentBuilder {
    private name: string;
    private ai: AIGateway;
    private skills: string[] = [];
    private memory: 'short-term' | 'vector' | 'persistent' = 'short-term';
    private tools: string[] = [];

    constructor(name: string, ai: AIGateway) {
        this.name = name;
        this.ai = ai;
    }

    withSkills(skills: string[]): this {
        this.skills = skills;
        return this;
    }

    withMemory(type: 'short-term' | 'vector' | 'persistent'): this {
        this.memory = type;
        return this;
    }

    withTools(tools: string[]): this {
        this.tools = tools;
        return this;
    }

    build(): Agent {
        return new Agent(this.ai, {
            name: this.name,
            skills: this.skills,
            memory: this.memory,
            tools: this.tools
        });
    }
}
