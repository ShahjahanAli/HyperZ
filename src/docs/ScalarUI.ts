// ──────────────────────────────────────────────────────────────
// HyperZ — Scalar API Reference
//
// Serves an embedded Scalar API Reference at a configurable
// path using the CDN-hosted Scalar package (zero npm deps).
// Replaces or complements the Swagger UI with a modern,
// interactive OpenAPI documentation explorer.
// ──────────────────────────────────────────────────────────────

import type { Express, Request, Response, Router } from 'express';
import { generateOpenAPISpec } from './SwaggerGenerator.js';
import { Logger } from '../logging/Logger.js';

export interface ScalarConfig {
    /** Enable/disable Scalar reference (default: true) */
    enabled?: boolean;

    /** Base path for the Scalar UI (default: '/api/reference') */
    path?: string;

    /** Page title (default: 'HyperZ API Reference') */
    title?: string;

    /** Scalar theme — 'default' | 'alternate' | 'moon' | 'purple' | 'solarized' | 'bluePlanet' | 'saturn' | 'kepler' | 'mars' | 'deepSpace' | 'none' */
    theme?: string;

    /** Show sidebar in the reference (default: true) */
    showSidebar?: boolean;

    /** Hide "Download OpenAPI Spec" button (default: false) */
    hideDownloadButton?: boolean;

    /** Hide dark mode toggle (default: false) */
    hideDarkModeToggle?: boolean;

    /** Default HTTP client for code samples (default: 'fetch') */
    defaultHttpClient?: { targetKey: string; clientKey: string };

    /** Custom CSS to inject */
    customCss?: string;

    /** Metadata passed through to Scalar */
    metaData?: Record<string, string>;

    /** Docs config (passed through for OpenAPI spec generation) */
    [key: string]: unknown;
}

/**
 * Register Scalar API Reference and OpenAPI JSON endpoint on the Express app or Router.
 */
export function registerScalarUI(app: Express | Router, config: ScalarConfig): void {
    if (config.enabled === false) return;

    const basePath = config.path || '/api/reference';
    const specPath = `${basePath}/openapi.json`;

    // ── OpenAPI JSON spec endpoint ─────────────────────────────
    (app as Express).get(specPath, (_req: Request, res: Response) => {
        const spec = generateOpenAPISpec(app as Express, config);
        res.json(spec);
    });

    // ── Scalar API Reference HTML ──────────────────────────────
    (app as Express).get(basePath, (_req: Request, res: Response) => {
        res.setHeader('Content-Type', 'text/html');
        res.send(buildScalarHTML(config, specPath));
    });

    Logger.info(`  [+] Scalar API Reference available at ${basePath}`);
}

/**
 * Build self-contained Scalar API Reference HTML page.
 * Uses the @scalar/api-reference CDN bundle — zero npm dependencies.
 */
function buildScalarHTML(config: ScalarConfig, specUrl: string): string {
    const title = config.title || 'HyperZ API Reference';
    const theme = config.theme || 'purple';
    const showSidebar = config.showSidebar !== false;
    const hideDownloadButton = config.hideDownloadButton ?? false;
    const hideDarkModeToggle = config.hideDarkModeToggle ?? false;
    const customCss = config.customCss || '';

    const defaultHttpClient = config.defaultHttpClient
        ? JSON.stringify(config.defaultHttpClient)
        : JSON.stringify({ targetKey: 'javascript', clientKey: 'fetch' });

    const metaData = config.metaData
        ? Object.entries(config.metaData)
            .map(([key, value]) => `<meta name="${escapeHtml(key)}" content="${escapeHtml(value)}" />`)
            .join('\n    ')
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    ${metaData}
    <style>
        /* Reset & base */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; }

        /* HyperZ branded header */
        .hyperz-reference-header {
            background: linear-gradient(135deg, #1a1a2e 0%, #0f172a 100%);
            padding: 14px 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid #334155;
            z-index: 100;
            position: sticky;
            top: 0;
        }
        .hyperz-reference-header h1 {
            font-size: 1.1rem;
            color: #f1f5f9;
            font-weight: 700;
        }
        .hyperz-reference-header h1 span { color: #a78bfa; }
        .hyperz-reference-header .badge {
            font-size: 0.65rem;
            background: #6366f1;
            color: #fff;
            padding: 2px 8px;
            border-radius: 99px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }
        .hyperz-reference-header .badge-scalar {
            background: linear-gradient(135deg, #10b981, #059669);
        }
        .hyperz-reference-header .nav-links {
            margin-left: auto;
            display: flex;
            gap: 16px;
        }
        .hyperz-reference-header .nav-links a {
            color: #94a3b8;
            text-decoration: none;
            font-size: 0.8rem;
            transition: color 0.15s;
        }
        .hyperz-reference-header .nav-links a:hover { color: #e2e8f0; }

        ${customCss}
    </style>
</head>
<body>
    <div class="hyperz-reference-header">
        <h1>⚡ <span>HyperZ</span> API Reference</h1>
        <div class="badge">OpenAPI 3.1</div>
        <div class="badge badge-scalar">Scalar</div>
        <div class="nav-links">
            <a href="/api/docs">Swagger UI</a>
            <a href="/api/playground">Playground</a>
        </div>
    </div>

    <script
        id="api-reference"
        data-url="${specUrl}"
        data-configuration="${escapeHtml(JSON.stringify({
            theme,
            showSidebar,
            hideDownloadButton,
            hideDarkModeToggle,
            defaultHttpClient: JSON.parse(defaultHttpClient),
            spec: { url: specUrl },
        }))}"
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
}

/**
 * Escape HTML entities to prevent XSS in rendered output.
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
