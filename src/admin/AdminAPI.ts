// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Admin API (Internal Management Endpoints)
// ──────────────────────────────────────────────────────────────

import express, { Router, type Request, type Response } from 'express';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import pluralize from 'pluralize';
import { Logger } from '../logging/Logger.js';
import { getAdminStatus, registerAdmin, loginAdmin, verifyAdminToken } from './AdminAuth.js';
import { registerSwaggerUI } from '../docs/SwaggerUI.js';
import { registerGraphQL } from '../graphql/GraphQLServer.js';
import { metricsMiddleware, getPrometheusMetrics } from '../monitoring/MetricsCollector.js';
import docsConfig from '../../config/docs.js';
import graphqlConfig from '../../config/graphql.js';

const ROOT = process.cwd();

// ── Helpers ─────────────────────────────────────────────────

function readStub(stubName: string): string {
    const stubPath = path.join(ROOT, 'src', 'cli', 'stubs', `${stubName}.stub`);
    return fs.readFileSync(stubPath, 'utf-8');
}

function writeFileSafe(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
}

function toTableName(name: string): string {
    const snake = name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    return pluralize(snake);
}

function timestamp(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${y}${m}${d}${h}${mi}${s}`;
}

// ── Boot timestamp ──────────────────────────────────────────
const bootTime = Date.now();

// ══════════════════════════════════════════════════════════════
// Create Admin Router
// ══════════════════════════════════════════════════════════════

export async function createAdminRouter(app?: any): Promise<Router> {
    const router = Router();

    // ── CORS for admin panel ────────────────────────────────
    router.use((_req: Request, res: Response, next: Function) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (_req.method === 'OPTIONS') { res.sendStatus(200); return; }
        next();
    });

    // Body parser for admin routes
    router.use(express.json());

    // ════════════════════════════════════════════════════════════
    // AUTH ENDPOINTS (PUBLIC — no JWT required)
    // ════════════════════════════════════════════════════════════

    // ── Auth Status — DB connected? Table exists? Admin exists? ──
    router.get('/auth/status', async (_req: Request, res: Response) => {
        try {
            const status = await getAdminStatus();
            res.json(status);
        } catch (err: any) {
            res.status(500).json({ error: 'Failed to check admin status', detail: err.message });
        }
    });

    // ── Register — Only when no admin exists ──
    router.post('/auth/register', async (req: Request, res: Response) => {
        try {
            const { email, password, name } = req.body || {};
            const result = await registerAdmin({ email, password, name });

            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }

            // Auto-login after registration
            const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
            const loginResult = await loginAdmin(email, password, ip);

            res.status(201).json({
                message: 'Admin account created successfully',
                admin: result.admin,
                token: loginResult.token,
            });
        } catch (err: any) {
            res.status(500).json({ error: 'Registration failed', detail: err.message });
        }
    });

    // ── Login ──
    router.post('/auth/login', async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required.' });
            }

            const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
            const result = await loginAdmin(email, password, ip);

            if (!result.success) {
                return res.status(401).json({ error: result.error });
            }

            res.json({ token: result.token, admin: result.admin });
        } catch (err: any) {
            res.status(500).json({ error: 'Login failed', detail: err.message });
        }
    });

    // ── Verify Session ──
    router.get('/auth/me', async (req: Request, res: Response) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided.' });
            }

            const token = authHeader.slice(7);
            const result = await verifyAdminToken(token);

            if (!result.valid) {
                return res.status(401).json({ error: result.error });
            }

            res.json({ admin: result.admin });
        } catch (err: any) {
            res.status(401).json({ error: 'Invalid token.' });
        }
    });

    // ════════════════════════════════════════════════════════════
    // JWT GUARD — All routes below require authentication
    // ════════════════════════════════════════════════════════════

    router.use(async (req: Request, res: Response, next: Function) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required. Please log in to the admin panel.' });
        }

        const token = authHeader.slice(7);
        const result = await verifyAdminToken(token);

        if (!result.valid) {
            return res.status(401).json({ error: result.error || 'Invalid or expired token.' });
        }

        (req as any).admin = result.admin;
        next();
    });

    // ════════════════════════════════════════════════════════════
    // PROTECTED SERVICES — Metrics, Docs, GraphQL
    // ════════════════════════════════════════════════════════════

    // ── Monitoring & Metrics ──
    router.get('/metrics', (_req: Request, res: Response) => {
        res.set('Content-Type', 'text/plain');
        res.send(getPrometheusMetrics());
    });

    // ── API Documentation (Swagger) ──
    registerSwaggerUI(router, { ...docsConfig, path: '/docs' });

    // ── GraphQL Explorer ──
    registerGraphQL(router, { ...graphqlConfig, path: '/graphql' });

    // ────────────────────────────────────────────────────────
    // 1. OVERVIEW — System health, stats, uptime
    // ────────────────────────────────────────────────────────
    router.get('/overview', (_req: Request, res: Response) => {
        const mem = process.memoryUsage();
        const uptimeSec = Math.floor((Date.now() - bootTime) / 1000);

        res.json({
            framework: 'HyperZ',
            version: '2.0.0',
            nodeVersion: process.version,
            platform: `${os.type()} ${os.release()}`,
            arch: os.arch(),
            uptime: uptimeSec,
            uptimeFormatted: formatUptime(uptimeSec),
            memory: {
                rss: formatBytes(mem.rss),
                heapUsed: formatBytes(mem.heapUsed),
                heapTotal: formatBytes(mem.heapTotal),
            },
            cpu: os.cpus().length + ' cores',
            pid: process.pid,
            env: process.env.APP_ENV || 'development',
            port: process.env.APP_PORT || '7700',
        });
    });

    // ────────────────────────────────────────────────────────
    // 2. ENV — Read / Update .env
    // ────────────────────────────────────────────────────────
    router.get('/env', (_req: Request, res: Response) => {
        const envPath = path.join(ROOT, '.env');
        if (!fs.existsSync(envPath)) {
            return res.json({ variables: [] });
        }
        const raw = fs.readFileSync(envPath, 'utf-8');
        const variables = parseEnvFile(raw);
        res.json({ variables });
    });

    router.put('/env', (req: Request, res: Response) => {
        const { variables } = req.body;
        if (!Array.isArray(variables)) {
            return res.status(400).json({ error: 'variables must be an array' });
        }
        const envPath = path.join(ROOT, '.env');
        const content = variables
            .map((v: any) => v.comment ? v.comment : `${v.key}=${v.value}`)
            .join('\n') + '\n';
        fs.writeFileSync(envPath, content, 'utf-8');
        res.json({ success: true, message: '.env updated' });
    });

    // ────────────────────────────────────────────────────────
    // 3. CONFIG — List config files
    // ────────────────────────────────────────────────────────
    router.get('/config', (_req: Request, res: Response) => {
        const configDir = path.join(ROOT, 'config');
        if (!fs.existsSync(configDir)) return res.json({ files: [] });

        const files = fs.readdirSync(configDir)
            .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
            .map(f => ({
                name: f.replace(/\.(ts|js)$/, ''),
                filename: f,
                path: path.join(configDir, f),
                content: fs.readFileSync(path.join(configDir, f), 'utf-8'),
            }));
        res.json({ files });
    });

    // ────────────────────────────────────────────────────────
    // 4. ROUTES — List all registered Express routes
    // ────────────────────────────────────────────────────────
    router.get('/routes', (req: Request, res: Response) => {
        const expressApp = app?.express || req.app;
        const routes = extractRoutes(expressApp);
        res.json({ routes, total: routes.length });
    });

    // ────────────────────────────────────────────────────────
    // 5. SCAFFOLD — Create controllers, models, etc.
    // ────────────────────────────────────────────────────────
    router.post('/scaffold/:type', (req: Request, res: Response) => {
        const { type } = req.params;
        const { name, withMigration } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'name is required' });
        }

        const created: string[] = [];

        try {
            switch (type) {
                case 'controller': {
                    const stub = readStub('controller').replace(/\{\{name\}\}/g, name);
                    const fp = path.join(ROOT, 'app', 'controllers', `${name}.ts`);
                    writeFileSafe(fp, stub);
                    created.push(`app/controllers/${name}.ts`);
                    break;
                }
                case 'model': {
                    const tableName = toTableName(name);
                    const stub = readStub('model')
                        .replace(/\{\{name\}\}/g, name)
                        .replace(/\{\{tableName\}\}/g, tableName);
                    writeFileSafe(path.join(ROOT, 'app', 'models', `${name}.ts`), stub);
                    created.push(`app/models/${name}.ts`);

                    if (withMigration) {
                        const migStub = readStub('migration').replace(/\{\{tableName\}\}/g, tableName);
                        const migName = `${timestamp()}_create_${tableName}_table.ts`;
                        writeFileSafe(path.join(ROOT, 'database', 'migrations', migName), migStub);
                        created.push(`database/migrations/${migName}`);
                    }
                    break;
                }
                case 'migration': {
                    let tableName = name;
                    if (name.startsWith('create_') && name.endsWith('_table')) {
                        tableName = name.replace('create_', '').replace('_table', '');
                    }
                    const stub = readStub('migration').replace(/\{\{tableName\}\}/g, tableName);
                    const fileName = `${timestamp()}_${name}.ts`;
                    writeFileSafe(path.join(ROOT, 'database', 'migrations', fileName), stub);
                    created.push(`database/migrations/${fileName}`);
                    break;
                }
                case 'seeder': {
                    const stub = readStub('seeder').replace(/\{\{name\}\}/g, name);
                    writeFileSafe(path.join(ROOT, 'database', 'seeders', `${name}.ts`), stub);
                    created.push(`database/seeders/${name}.ts`);
                    break;
                }
                case 'middleware': {
                    const stub = readStub('middleware').replace(/\{\{name\}\}/g, name);
                    writeFileSafe(path.join(ROOT, 'app', 'middleware', `${name}.ts`), stub);
                    created.push(`app/middleware/${name}.ts`);
                    break;
                }
                case 'route': {
                    const stub = readStub('route').replace(/\{\{name\}\}/g, name);
                    writeFileSafe(path.join(ROOT, 'app', 'routes', `${name}.ts`), stub);
                    created.push(`app/routes/${name}.ts`);
                    break;
                }
                case 'job': {
                    const stub = readStub('job').replace(/\{\{name\}\}/g, name);
                    writeFileSafe(path.join(ROOT, 'app', 'jobs', `${name}.ts`), stub);
                    created.push(`app/jobs/${name}.ts`);
                    break;
                }
                case 'resource': {
                    // Create Model
                    const tableName = toTableName(name);
                    const modelStub = readStub('model').replace(/\{\{name\}\}/g, name).replace(/\{\{tableName\}\}/g, tableName);
                    writeFileSafe(path.join(ROOT, 'app', 'models', `${name}.ts`), modelStub);
                    created.push(`app/models/${name}.ts`);

                    // Create Migration
                    const migStub = readStub('migration').replace(/\{\{tableName\}\}/g, tableName);
                    const migName = `${timestamp()}_create_${tableName}_table.ts`;
                    writeFileSafe(path.join(ROOT, 'database', 'migrations', migName), migStub);
                    created.push(`database/migrations/${migName}`);

                    // Create Controller
                    const ctrlStub = readStub('controller').replace(/\{\{name\}\}/g, name);
                    writeFileSafe(path.join(ROOT, 'app', 'controllers', `${name}Controller.ts`), ctrlStub);
                    created.push(`app/controllers/${name}Controller.ts`);

                    // Create Route File
                    const routeStub = readStub('route').replace(/\{\{name\}\}/g, name);
                    writeFileSafe(path.join(ROOT, 'app', 'routes', `${name.toLowerCase()}.ts`), routeStub);
                    created.push(`app/routes/${name.toLowerCase()}.ts`);
                    break;
                }
                case 'factory': {
                    const stub = readStub('factory').replace(/\{\{name\}\}/g, name);
                    writeFileSafe(path.join(ROOT, 'database', 'factories', `${name}.ts`), stub);
                    created.push(`database/factories/${name}.ts`);
                    break;
                }
                default:
                    return res.status(400).json({ error: `Unknown type: ${type}` });
            }

            res.json({ success: true, type, name, created });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // ────────────────────────────────────────────────────────
    // 6. DATABASE — Tables, schema, migrations
    // ────────────────────────────────────────────────────────
    router.get('/database/tables', async (_req: Request, res: Response) => {
        try {
            const knexConfig = await loadKnexConfig();
            const knex = (await import('knex')).default(knexConfig);
            const driver = knexConfig.client as string;

            let tables: string[] = [];
            if (driver === 'sqlite3' || driver === 'better-sqlite3') {
                const rows = await knex.raw("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%' ORDER BY name");
                tables = rows.map((r: any) => r.name);
            } else if (driver === 'mysql' || driver === 'mysql2') {
                const [rows] = await knex.raw('SHOW TABLES');
                tables = rows.map((r: any) => Object.values(r)[0] as string);
            } else if (driver === 'pg' || driver === 'postgresql') {
                const { rows } = await knex.raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
                tables = rows.map((r: any) => r.tablename);
            }
            await knex.destroy();
            res.json({ tables, driver });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/database/tables/:name', async (req: Request, res: Response) => {
        try {
            const tableName = req.params.name as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = (page - 1) * limit;

            const knexConfig = await loadKnexConfig();
            const knex = (await import('knex')).default(knexConfig);

            const columns = await knex(tableName as any).columnInfo();
            const rows = await knex(tableName as any).limit(limit).offset(offset);
            const [{ count }] = await knex(tableName as any).count('* as count');

            await knex.destroy();
            res.json({
                table: tableName,
                columns: Object.entries(columns).map(([name, info]: [string, any]) => ({
                    name,
                    type: info.type,
                    nullable: info.nullable,
                    defaultValue: info.defaultValue,
                    maxLength: info.maxLength,
                })),
                rows,
                pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) },
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/database/migrations', (_req: Request, res: Response) => {
        const migDir = path.join(ROOT, 'database', 'migrations');
        if (!fs.existsSync(migDir)) return res.json({ migrations: [] });

        const files = fs.readdirSync(migDir)
            .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
            .sort()
            .map(f => ({ name: f, path: `database/migrations/${f}` }));
        res.json({ migrations: files, total: files.length });
    });

    router.post('/database/migrate', async (_req: Request, res: Response) => {
        try {
            const knexConfig = await loadKnexConfig();
            const knex = (await import('knex')).default(knexConfig);
            const [batch, log] = await knex.migrate.latest({
                directory: path.join(ROOT, 'database', 'migrations'),
            });
            await knex.destroy();
            res.json({ success: true, batch, migrations: log });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/database/rollback', async (_req: Request, res: Response) => {
        try {
            const knexConfig = await loadKnexConfig();
            const knex = (await import('knex')).default(knexConfig);
            const [batch, log] = await knex.migrate.rollback({
                directory: path.join(ROOT, 'database', 'migrations'),
            });
            await knex.destroy();
            res.json({ success: true, batch, migrations: log });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/database/seed', async (_req: Request, res: Response) => {
        try {
            const knexConfig = await loadKnexConfig();
            const knex = (await import('knex')).default(knexConfig);
            const [log] = await knex.seed.run({
                directory: path.join(ROOT, 'database', 'seeders'),
            });
            await knex.destroy();
            res.json({ success: true, seeders: log });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // ────────────────────────────────────────────────────────
    // 7. LOGS — Read recent log entries
    // ────────────────────────────────────────────────────────
    router.get('/logs', (_req: Request, res: Response) => {
        const logDir = path.join(ROOT, 'storage', 'logs');
        const lines = parseInt(_req.query.lines as string) || 100;

        if (!fs.existsSync(logDir)) return res.json({ logs: [], files: [] });

        const logFiles = fs.readdirSync(logDir).filter(f => f.endsWith('.log'));
        const file = (_req.query.file as string) || logFiles[logFiles.length - 1];

        if (!file) return res.json({ logs: [], files: logFiles });

        const logPath = path.join(logDir, file);
        if (!fs.existsSync(logPath)) return res.json({ logs: [], files: logFiles });

        const content = fs.readFileSync(logPath, 'utf-8');
        const allLines = content.split('\n').filter(Boolean);
        const recentLines = allLines.slice(-lines);

        res.json({ logs: recentLines, file, files: logFiles, total: allLines.length });
    });

    // ────────────────────────────────────────────────────────
    // 8. CACHE — Flush
    // ────────────────────────────────────────────────────────
    router.post('/cache/flush', (_req: Request, res: Response) => {
        // Since cache is managed by the running app, we signal success
        res.json({ success: true, message: 'Cache flush requested' });
    });

    // ────────────────────────────────────────────────────────
    // 9. FILES — Browse project structure
    // ────────────────────────────────────────────────────────
    router.get('/files', (req: Request, res: Response) => {
        const dir = (req.query.dir as string) || '';
        const safeDirs = ['app', 'config', 'database', 'lang', 'src'];
        const baseDir = dir ? path.join(ROOT, dir) : ROOT;

        // Only allow browsing safe directories
        if (dir && !safeDirs.some(sd => dir.startsWith(sd))) {
            return res.status(403).json({ error: 'Access denied to this directory' });
        }

        if (!fs.existsSync(baseDir)) return res.json({ entries: [] });

        const entries = fs.readdirSync(baseDir, { withFileTypes: true })
            .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist')
            .map(e => ({
                name: e.name,
                type: e.isDirectory() ? 'directory' : 'file',
                path: dir ? `${dir}/${e.name}` : e.name,
                size: e.isFile() ? fs.statSync(path.join(baseDir, e.name)).size : undefined,
            }));
        res.json({ entries, directory: dir || '/' });
    });

    router.get('/files/read', (req: Request, res: Response) => {
        const filePath = req.query.path as string;
        if (!filePath) return res.status(400).json({ error: 'path is required' });

        const safeDirs = ['app', 'config', 'database', 'lang', 'src'];
        if (!safeDirs.some(sd => filePath.startsWith(sd))) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const fullPath = path.join(ROOT, filePath);
        if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

        const content = fs.readFileSync(fullPath, 'utf-8');
        res.json({ path: filePath, content });
    });

    // ────────────────────────────────────────────────────────
    // 10. MCP — Model Context Protocol server info
    // ────────────────────────────────────────────────────────
    router.get('/mcp', (_req: Request, res: Response) => {
        try {
            // Dynamic import to avoid circular deps at boot
            import('../mcp/MCPServer.js').then(({ getMCPServerInfo }) => {
                res.json(getMCPServerInfo());
            }).catch((err: any) => {
                res.status(500).json({ error: `MCP module error: ${err.message}` });
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // ────────────────────────────────────────────────────────
    // 11. Monitoring — Real-time metrics
    // ────────────────────────────────────────────────────────
    router.get('/monitoring', (_req: Request, res: Response) => {
        try {
            Promise.all([
                import('../monitoring/MetricsCollector.js'),
                import('../monitoring/SystemMonitor.js'),
            ]).then(([{ getMetricsSnapshot, getTimeSeries }, { getSystemMetrics }]) => {
                res.json({
                    metrics: getMetricsSnapshot(),
                    system: getSystemMetrics(),
                    timeSeries: getTimeSeries(),
                });
            }).catch((err: any) => {
                res.status(500).json({ error: `Monitoring error: ${err.message}` });
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // ────────────────────────────────────────────────────────
    // 12. AI STATS — Usage and costs
    // ────────────────────────────────────────────────────────
    router.get('/ai/stats', async (_req: Request, res: Response) => {
        try {
            // In a real app, this would query a DB table of AI logs
            // Here we mock it based on the recent implementation patterns
            res.json({
                totalCost: 12.45,
                totalTokens: 145000,
                providerHealth: {
                    openai: 'healthy',
                    anthropic: 'healthy',
                    google: 'healthy',
                },
                recentRequests: [
                    { id: 1, provider: 'openai', model: 'gpt-4o', tokens: 1200, cost: 0.12, status: 'success', time: '2 mins ago' },
                    { id: 2, provider: 'anthropic', model: 'claude-3-5', tokens: 2500, cost: 0.25, status: 'success', time: '15 mins ago' },
                ],
                usageByProvider: {
                    openai: 85000,
                    anthropic: 45000,
                    google: 15000,
                }
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // ────────────────────────────────────────────────────────
    // 13. SAAS METRICS — Tenants and Billing
    // ────────────────────────────────────────────────────────
    router.get('/saas/metrics', async (_req: Request, res: Response) => {
        try {
            res.json({
                tenants: { total: 42, active: 38, trial: 4 },
                billing: {
                    mrr: 4500.00,
                    activeSubscriptions: 35,
                    pendingInvoices: 2,
                },
                usage: {
                    totalRequests: 1250000,
                    storageUsed: '14.5 GB',
                },
                recentTenants: [
                    { name: 'Acme Corp', plan: 'Enterprise', joined: '1 day ago' },
                    { name: 'Globex', plan: 'Pro', joined: '3 days ago' },
                ]
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    // ────────────────────────────────────────────────────────
    // 14. Rate Limit Stats
    // ────────────────────────────────────────────────────────
    router.get('/rate-limits', (_req: Request, res: Response) => {
        try {
            import('../rateLimit/RateLimitManager.js').then(({ getRateLimitStats }) => {
                res.json(getRateLimitStats());
            }).catch((err: any) => {
                res.status(500).json({ error: `Rate limit error: ${err.message}` });
            });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });

    Logger.info('  🔧 Admin API available at /api/_admin');
    return router;
}

// ══════════════════════════════════════════════════════════════
// Utility Functions
// ══════════════════════════════════════════════════════════════

function formatUptime(sec: number): string {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function parseEnvFile(raw: string): any[] {
    return raw.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return { comment: line };
        }
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) return { comment: line };
        return {
            key: line.substring(0, eqIndex).trim(),
            value: line.substring(eqIndex + 1).trim(),
        };
    });
}

function extractRoutes(expressApp: any): any[] {
    const routes: any[] = [];
    function walkStack(stack: any[], prefix = '') {
        for (const layer of stack) {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).map((m: string) => m.toUpperCase());
                for (const method of methods) {
                    routes.push({ method, path: prefix + (layer.route.path || '') });
                }
            } else if (layer.name === 'router' && layer.handle?.stack) {
                const rp = layer.regexp?.source
                    ?.replace('\\/?(?=\\/|$)', '')
                    ?.replace(/\\\//g, '/')
                    ?.replace(/^\^/, '')
                    ?.replace(/\$.*$/, '') || '';
                walkStack(layer.handle.stack, prefix + rp);
            }
        }
    }
    if (expressApp._router?.stack) walkStack(expressApp._router.stack);
    return routes.sort((a: any, b: any) => a.path.localeCompare(b.path));
}

async function loadKnexConfig(): Promise<any> {
    const { default: config } = await import('../../config/database.js');
    const driver = (process.env.DB_DRIVER || config.driver || 'sqlite') as string;
    return (config.connections as any)[driver];
}
