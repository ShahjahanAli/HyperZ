// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Server Bootstrap
// ──────────────────────────────────────────────────────────────

import { createApp } from './app.js';
import { registerPlayground } from './src/playground/Playground.js';
import { I18n } from './src/i18n/I18n.js';
import * as path from 'node:path';

async function main(): Promise<void> {
    const app = createApp();
    await app.boot();

    // Load translations
    await I18n.load(path.join(app.basePath, 'lang'));

    // Register API Playground
    registerPlayground(app.express);

    // Start server
    await app.listen();
}

main().catch((err) => {
    console.error('❌ Failed to start HyperZ:', err);
    process.exit(1);
});
