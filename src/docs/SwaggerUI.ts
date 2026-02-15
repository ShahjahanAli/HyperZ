// ──────────────────────────────────────────────────────────────
// HyperZ — Swagger UI Server
//
// Serves an embedded Swagger UI at /api/docs using a self-
// contained HTML page (no swagger-ui-express dependency needed).
// ──────────────────────────────────────────────────────────────

import type { Express, Request, Response, Router } from 'express';
import { generateOpenAPISpec } from './SwaggerGenerator.js';
import { Logger } from '../logging/Logger.js';

/**
 * Register Swagger UI and OpenAPI JSON endpoint on the Express app or Router.
 */
export function registerSwaggerUI(app: Express | Router, docsConfig: any): void {
    if (docsConfig.enabled === false) return;

    const basePath = docsConfig.path || '/api/docs';

    // ── OpenAPI JSON spec endpoint ─────────────────────────────
    (app as any).get(`${basePath}/openapi.json`, (_req: Request, res: Response) => {
        const spec = generateOpenAPISpec(app as any, docsConfig);
        res.json(spec);
    });

    // ── Swagger UI HTML ────────────────────────────────────────
    (app as any).get(basePath, (_req: Request, res: Response) => {
        const specUrl = `${basePath}/openapi.json`;
        res.setHeader('Content-Type', 'text/html');
        res.send(buildSwaggerHTML(docsConfig.title || 'HyperZ API', specUrl));
    });

    Logger.info(`  📖 API Docs available at ${basePath}`);
}

/**
 * Build a self-contained Swagger UI HTML page using CDN assets.
 */
function buildSwaggerHTML(title: string, specUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0f; }
        .swagger-ui { max-width: 1200px; margin: 0 auto; }
        .topbar-wrapper img { content: url(''); height: 0; }
        .swagger-ui .topbar { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 12px 24px; }
        .swagger-ui .topbar .download-url-wrapper { display: flex; }
        .swagger-ui .info hgroup.main { margin: 0; }
        /* Dark theme overrides */
        .swagger-ui, .swagger-ui .info .title, .swagger-ui .opblock-tag { color: #e2e8f0 !important; }
        .swagger-ui .scheme-container, .swagger-ui section.models { background: #111827; border-color: #374151; }
        .swagger-ui .opblock .opblock-summary { border-color: #374151; }
        .swagger-ui .opblock .opblock-section-header { background: #1f2937; }
        .swagger-ui .opblock-body pre, .swagger-ui .highlight-code { background: #0d1117 !important; }
        .swagger-ui .response-col_description__inner p { color: #9ca3af; }
        .swagger-ui .btn { border-color: #6366f1; color: #a5b4fc; }
        .swagger-ui .btn:hover { background: #6366f1; color: #fff; }
        .swagger-ui select { background: #1f2937; color: #e2e8f0; border-color: #374151; }
        .swagger-ui input[type=text] { background: #1f2937; color: #e2e8f0; border-color: #374151; }
        .swagger-ui textarea { background: #1f2937; color: #e2e8f0; border-color: #374151; }
        .swagger-ui .model-box { background: #111827; }
        .swagger-ui section.models .model-container { background: #1f2937; }
        .swagger-ui .opblock.opblock-get { background: rgba(59,130,246,0.08); border-color: #3b82f6; }
        .swagger-ui .opblock.opblock-post { background: rgba(34,197,94,0.08); border-color: #22c55e; }
        .swagger-ui .opblock.opblock-put { background: rgba(249,115,22,0.08); border-color: #f97316; }
        .swagger-ui .opblock.opblock-delete { background: rgba(239,68,68,0.08); border-color: #ef4444; }
        .swagger-ui .opblock.opblock-patch { background: rgba(168,85,247,0.08); border-color: #a855f7; }
        /* Header bar */
        .hyperz-header {
            background: linear-gradient(135deg, #1a1a2e 0%, #0f172a 100%);
            padding: 20px 32px; display: flex; align-items: center; gap: 12px;
            border-bottom: 1px solid #334155;
        }
        .hyperz-header h1 { font-size: 1.3rem; color: #f1f5f9; font-weight: 700; font-family: system-ui; }
        .hyperz-header span { color: #a78bfa; }
        .hyperz-header .badge { font-size: 0.7rem; background: #6366f1; color: #fff; padding: 2px 8px; border-radius: 99px; font-weight: 500; }
    </style>
</head>
<body>
    <div class="hyperz-header">
        <h1>⚡ <span>HyperZ</span> API Documentation</h1>
        <div class="badge">OpenAPI 3.1</div>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: '${specUrl}',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: 'BaseLayout',
            defaultModelsExpandDepth: -1,
            docExpansion: 'list',
            filter: true,
            tryItOutEnabled: true,
        });
    </script>
</body>
</html>`;
}
