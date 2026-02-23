// ──────────────────────────────────────────────────────────────
// HyperZ Config — API Documentation (Swagger/OpenAPI + Scalar)
// ──────────────────────────────────────────────────────────────

import { env, envBool } from '../src/support/helpers.js';

export default {
    /** Enable/disable API docs endpoints */
    enabled: envBool('DOCS_ENABLED', true),

    /** Title shown in Swagger UI */
    title: env('APP_NAME', 'HyperZ') + ' API Documentation',

    /** API version */
    version: '1.0.0',

    /** API description */
    description: 'Auto-generated API documentation for the HyperZ framework. Explore endpoints, schemas, and authentication.',

    /** Base path for Swagger UI */
    path: '/api/docs',

    /** Servers list */
    servers: [
        { url: env('APP_URL', 'http://localhost:7700'), description: 'Local Development' },
    ],

    /** Security schemes */
    securitySchemes: {
        bearerAuth: {
            type: 'http' as const,
            scheme: 'bearer',
            bearerFormat: 'JWT',
        },
        apiKeyAuth: {
            type: 'apiKey' as const,
            in: 'header' as const,
            name: 'X-API-Key',
        },
    },

    /** Contact info */
    contact: {
        name: env('APP_NAME', 'HyperZ') + ' Team',
        url: env('APP_URL', 'http://localhost:7700'),
    },

    // ── Scalar API Reference ──────────────────────────────────
    scalar: {
        /** Enable/disable Scalar API Reference (default: true) */
        enabled: envBool('SCALAR_ENABLED', true),

        /** Base path for Scalar reference UI */
        path: '/api/reference',

        /** Scalar theme: 'default' | 'alternate' | 'moon' | 'purple' | 'solarized' | 'bluePlanet' | 'saturn' | 'kepler' | 'mars' | 'deepSpace' | 'none' */
        theme: env('SCALAR_THEME', 'purple'),

        /** Show sidebar navigation */
        showSidebar: true,

        /** Hide the download spec button */
        hideDownloadButton: false,

        /** Hide dark mode toggle */
        hideDarkModeToggle: false,

        /** Default HTTP client for code samples */
        defaultHttpClient: { targetKey: 'javascript', clientKey: 'fetch' },
    },
};
