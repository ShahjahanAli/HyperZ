import { env } from '../src/support/helpers.js';

export default {
    /*
    |--------------------------------------------------------------------------
    | Default AI Provider
    |--------------------------------------------------------------------------
    | Supported: 'openai', 'anthropic', 'google'
    */
    default: env('AI_PROVIDER', 'openai'),

    providers: {
        openai: {
            apiKey: env('OPENAI_API_KEY', ''),
            baseUrl: env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
            model: env('OPENAI_MODEL', 'gpt-4o-mini'),
        },

        anthropic: {
            apiKey: env('ANTHROPIC_API_KEY', ''),
            model: env('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514'),
        },

        google: {
            apiKey: env('GOOGLE_AI_API_KEY', ''),
            model: env('GOOGLE_AI_MODEL', 'gemini-2.0-flash'),
        },
    },
};
