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

// ── Provider Interface ──────────────────────────────────────

interface AIProvider {
    name: string;
    chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AIResponse>;
    complete(prompt: string, options?: AICompletionOptions): Promise<AIResponse>;
    embed(input: string | string[], model?: string): Promise<AIEmbeddingResponse>;
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
     * Get a specific provider.
     */
    provider(name?: string): AIProvider {
        const providerName = name ?? this.defaultProvider;
        const p = this.providers.get(providerName);
        if (!p) throw new Error(`[AI] Provider "${providerName}" not configured. Set the API key in .env`);
        return p;
    }

    /**
     * Chat with an AI model.
     */
    async chat(
        messages: AIMessage[],
        options?: AICompletionOptions & { provider?: string }
    ): Promise<AIResponse> {
        const response = await this.provider(options?.provider).chat(messages, options);
        this.totalTokensUsed += response.usage?.totalTokens ?? 0;
        Logger.debug(`[AI] Chat response from ${response.provider}/${response.model} (${response.latencyMs}ms, ${response.usage?.totalTokens ?? 0} tokens)`);
        return response;
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
