// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Server Bootstrap
// ──────────────────────────────────────────────────────────────

import { createApp } from './app.js';
import { registerPlayground } from './src/playground/Playground.js';
import { createAdminRouter } from './src/admin/AdminAPI.js';
import { I18n } from './src/i18n/I18n.js';
import { getMCPServerInfo } from './src/mcp/MCPServer.js';
import * as path from 'node:path';

async function main(): Promise<void> {
    const app = createApp();

    // Register Playground routes BEFORE boot (RouteServiceProvider adds
    // a 404 catch-all at the end of boot — playground must exist before that).
    registerPlayground(app.express);

    // Register Admin API routes
    const adminRouter = await createAdminRouter(app);
    app.express.use('/api/_admin', adminRouter);

    await app.boot();

    // Load translations
    await I18n.load(path.join(app.basePath, 'lang'));

    // Start server
    await app.listen();
}

main().catch((err) => {
    console.error('❌ Failed to start HyperZ:', err);
    process.exit(1);
});
