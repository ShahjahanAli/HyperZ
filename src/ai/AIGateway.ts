// ──────────────────────────────────────────────────────────────
// HyperZ Framework — AI Gateway (Multi-Provider)
// ──────────────────────────────────────────────────────────────

import { Logger } from '../logging/Logger.js';
import { env } from '../support/helpers.js';

// ── Types ───────────────────────────────────────────────────

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AICompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
}

export interface AIResponse {
    content: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    provider: string;
    latencyMs: number;
}

export interface AIEmbeddingResponse {
    embeddings: number[][];
    model: string;
    provider: string;
    usage?: { totalTokens: number };
}

export interface ModelCost {
    prompt: number; // Cost per 1k tokens
    completion: number;
}

const MODEL_COSTS: Record<string, ModelCost> = {
    'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
    'gpt-4o': { prompt: 0.005, completion: 0.015 },
    'claude-sonnet-4-20250514': { prompt: 0.003, completion: 0.015 },
    'gemini-2.0-flash': { prompt: 0.0001, completion: 0.0004 },
};

// ── Provider Interface ──────────────────────────────────────

interface AIProvider {
    name: string;
    chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AIResponse>;
    complete(prompt: string, options?: AICompletionOptions): Promise<AIResponse>;
    embed(input: string | string[], model?: string): Promise<AIEmbeddingResponse>;
}

// ── AI Action Builder ───────────────────────────────────────

export class AIAction {
    private gateway: AIGateway;
    private name: string;
    private context: Record<string, any> = {};
    private modelName?: string;
    private providerName?: string;

    constructor(gateway: AIGateway, name: string) {
        this.gateway = gateway;
        this.name = name;
    }

    withContext(context: Record<string, any>): this {
        this.context = { ...this.context, ...context };
        return this;
    }

    withModel(model: string): this {
        this.modelName = model;
        return this;
    }

    withProvider(provider: string): this {
        this.providerName = provider;
        return this;
    }

    async execute(): Promise<AIResponse> {
        // In a real implementation, this would load a prompt template named this.name
        // and interpolate this.context. For now, we simulate a system message.
        const messages: AIMessage[] = [
            { role: 'system', content: `Action: ${this.name}. Context: ${JSON.stringify(this.context)}` },
            { role: 'user', content: `Process the action ${this.name} with the provided context.` }
        ];

        return this.gateway.chat(messages, {
            model: this.modelName,
            provider: this.providerName
        });
    }
}

// ── OpenAI Provider ─────────────────────────────────────────

class OpenAIProvider implements AIProvider {
    name = 'openai';
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string, baseUrl?: string) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl ?? 'https://api.openai.com/v1';
    }

    async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AIResponse> {
        const start = Date.now();
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: options?.model ?? 'gpt-4o-mini',
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens,
            }),
        });

        const data = await res.json() as any;
        if (!res.ok) throw new Error(`[AI:OpenAI] ${data.error?.message ?? 'Request failed'}`);

        return {
            content: data.choices[0].message.content,
            model: data.model,
            provider: 'openai',
            usage: {
                promptTokens: data.usage?.prompt_tokens ?? 0,
                completionTokens: data.usage?.completion_tokens ?? 0,
                totalTokens: data.usage?.total_tokens ?? 0,
            },
            latencyMs: Date.now() - start,
        };
    }

    async complete(prompt: string, options?: AICompletionOptions): Promise<AIResponse> {
        return this.chat([{ role: 'user', content: prompt }], options);
    }

    async embed(input: string | string[], model?: string): Promise<AIEmbeddingResponse> {
        const res = await fetch(`${this.baseUrl}/embeddings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: model ?? 'text-embedding-3-small',
                input: Array.isArray(input) ? input : [input],
            }),
        });

        const data = await res.json() as any;
        if (!res.ok) throw new Error(`[AI:OpenAI] Embedding failed`);

        return {
            embeddings: data.data.map((d: any) => d.embedding),
            model: data.model,
            provider: 'openai',
            usage: { totalTokens: data.usage?.total_tokens ?? 0 },
        };
    }
}

// ── Anthropic Provider ──────────────────────────────────────

class AnthropicProvider implements AIProvider {
    name = 'anthropic';
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string, baseUrl?: string) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl ?? 'https://api.anthropic.com/v1';
    }

    async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AIResponse> {
        const start = Date.now();
        const systemMsg = messages.find(m => m.role === 'system');
        const nonSystem = messages.filter(m => m.role !== 'system');

        const res = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: options?.model ?? 'claude-sonnet-4-20250514',
                max_tokens: options?.maxTokens ?? 4096,
                system: systemMsg?.content,
                messages: nonSystem.map(m => ({ role: m.role, content: m.content })),
                temperature: options?.temperature ?? 0.7,
            }),
        });

        const data = await res.json() as any;
        if (!res.ok) throw new Error(`[AI:Anthropic] ${data.error?.message ?? 'Request failed'}`);

        return {
            content: data.content[0].text,
            model: data.model,
            provider: 'anthropic',
            usage: {
                promptTokens: data.usage?.input_tokens ?? 0,
                completionTokens: data.usage?.output_tokens ?? 0,
                totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
            },
            latencyMs: Date.now() - start,
        };
    }

    async complete(prompt: string, options?: AICompletionOptions): Promise<AIResponse> {
        return this.chat([{ role: 'user', content: prompt }], options);
    }

    async embed(): Promise<AIEmbeddingResponse> {
        throw new Error('[AI:Anthropic] Embeddings not supported — use OpenAI or Google.');
    }
}

// ── Google AI Provider ──────────────────────────────────────

class GoogleAIProvider implements AIProvider {
    name = 'google';
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AIResponse> {
        const start = Date.now();
        const model = options?.model ?? 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

        const contents = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            }));

        const systemInstruction = messages.find(m => m.role === 'system');

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                ...(systemInstruction ? {
                    systemInstruction: { parts: [{ text: systemInstruction.content }] },
                } : {}),
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens,
                },
            }),
        });

        const data = await res.json() as any;
        if (!res.ok) throw new Error(`[AI:Google] ${data.error?.message ?? 'Request failed'}`);

        return {
            content: data.candidates[0].content.parts[0].text,
            model,
            provider: 'google',
            usage: {
                promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
                completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
                totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
            },
            latencyMs: Date.now() - start,
        };
    }

    async complete(prompt: string, options?: AICompletionOptions): Promise<AIResponse> {
        return this.chat([{ role: 'user', content: prompt }], options);
    }

    async embed(input: string | string[], model?: string): Promise<AIEmbeddingResponse> {
        const embedModel = model ?? 'text-embedding-004';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${embedModel}:embedContent?key=${this.apiKey}`;
        const texts = Array.isArray(input) ? input : [input];
        const embeddings: number[][] = [];

        for (const text of texts) {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: { parts: [{ text }] } }),
            });
            const data = await res.json() as any;
            embeddings.push(data.embedding?.values ?? []);
        }

        return { embeddings, model: embedModel, provider: 'google' };
    }
}

// ── AI Gateway Manager ──────────────────────────────────────

export class AIGateway {
    private providers = new Map<string, AIProvider>();
    private defaultProvider: string;
    private totalTokensUsed = 0;
    private totalCost = 0;

    constructor(defaultProvider = 'openai') {
        this.defaultProvider = defaultProvider;
    }

    /**
     * Register an AI provider.
     */
    registerProvider(name: string, provider: AIProvider): this {
        this.providers.set(name, provider);
        return this;
    }

    /**
     * Auto-configure providers from environment variables.
     */
    autoConfig(): this {
        const openaiKey = env('OPENAI_API_KEY', '');
        const anthropicKey = env('ANTHROPIC_API_KEY', '');
        const googleKey = env('GOOGLE_AI_API_KEY', '');

        if (openaiKey) {
            this.registerProvider('openai', new OpenAIProvider(openaiKey, env('OPENAI_BASE_URL', '')));
        }
        if (anthropicKey) {
            this.registerProvider('anthropic', new AnthropicProvider(anthropicKey));
        }
        if (googleKey) {
            this.registerProvider('google', new GoogleAIProvider(googleKey));
        }

        Logger.debug(`[AI] Providers configured: ${[...this.providers.keys()].join(', ') || 'none'}`);
        return this;
    }

    /**
     * Create a new AI action builder.
     */
    action(name: string): AIAction {
        return new AIAction(this, name);
    }

    /**
     * Get a specific provider.
     */
    provider(name?: string): AIProvider {
        const providerName = name ?? this.defaultProvider;
        const p = this.providers.get(providerName);
        if (!p) throw new Error(`[AI] Provider "${providerName}" not configured. Set the API key in .env`);
        return p;
    }

    /**
     * Chat with an AI model with automatic fallback support.
     */
    async chat(
        messages: AIMessage[],
        options?: AICompletionOptions & { provider?: string; fallbackProviders?: string[] }
    ): Promise<AIResponse> {
        const providersToTry = [
            options?.provider ?? this.defaultProvider,
            ...(options?.fallbackProviders ?? [])
        ];

        let lastError: Error | null = null;

        for (const providerName of providersToTry) {
            try {
                const response = await this.provider(providerName).chat(messages, options);
                this.trackUsage(response);
                Logger.debug(`[AI] Chat response from ${response.provider}/${response.model} (${response.latencyMs}ms, ${response.usage?.totalTokens ?? 0} tokens)`);
                return response;
            } catch (error: any) {
                Logger.warn(`[AI] Provider "${providerName}" failed: ${error.message}. Trying fallback...`);
                lastError = error;
            }
        }

        throw new Error(`[AI] All providers failed. Last error: ${lastError?.message}`);
    }

    /**
     * Track token usage and estimate cost.
     */
    private trackUsage(response: AIResponse): void {
        const tokens = response.usage?.totalTokens ?? 0;
        this.totalTokensUsed += tokens;

        const costConfig = MODEL_COSTS[response.model];
        if (costConfig && response.usage) {
            const cost = (response.usage.promptTokens / 1000 * costConfig.prompt) +
                (response.usage.completionTokens / 1000 * costConfig.completion);
            this.totalCost += cost;
        }
    }

    /**
     * Single-prompt completion.
     */
    async complete(
        prompt: string,
        options?: AICompletionOptions & { provider?: string }
    ): Promise<AIResponse> {
        const response = await this.provider(options?.provider).complete(prompt, options);
        this.totalTokensUsed += response.usage?.totalTokens ?? 0;
        return response;
    }

    /**
     * Generate embeddings.
     */
    async embed(
        input: string | string[],
        options?: { model?: string; provider?: string }
    ): Promise<AIEmbeddingResponse> {
        return this.provider(options?.provider).embed(input, options?.model);
    }

    /**
     * Get total tokens used across all requests.
     */
    getTokensUsed(): number {
        return this.totalTokensUsed;
    }

    /**
     * List configured providers.
     */
    listProviders(): string[] {
        return [...this.providers.keys()];
    }
}
