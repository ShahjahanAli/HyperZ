// ──────────────────────────────────────────────────────────────
// HyperZ Framework — CLI Command Registry
// ──────────────────────────────────────────────────────────────

import type { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { Table } from 'cli-table3';
import pluralize from 'pluralize';
import { config as loadEnv } from 'dotenv';
import { randomString } from '../support/helpers.js';
import { initializeDataSource } from '../database/DataSource.js';

const ROOT = process.cwd();

// ── Stub Helper ─────────────────────────────────────────────

function readStub(stubName: string): string {
    const stubPath = path.join(ROOT, 'src', 'cli', 'stubs', `${stubName}.stub`);
    return fs.readFileSync(stubPath, 'utf-8');
}

function writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
}

function toTableName(name: string): string {
    // UserProfile → user_profiles
    const snake = name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    return pluralize(snake);
}

function toCamelCase(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1);
}

function toPascalCase(name: string): string {
    return name.split(/[-_]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
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

// ── Register All Commands ───────────────────────────────────

export function registerCommands(program: Command): void {

    // ── make:controller ─────────────────────────────────────
    program
        .command('make:controller <name>')
        .description('Create a new controller')
        .action((name: string) => {
            const stub = readStub('controller').replace(/\{\{name\}\}/g, name);
            const filePath = path.join(ROOT, 'app', 'controllers', `${name}.ts`);
            writeFile(filePath, stub);
            console.log(chalk.green(`✓ Controller created: app/controllers/${name}.ts`));
        });

    // ── make:model ──────────────────────────────────────────
    program
        .command('make:model <name>')
        .description('Create a new model')
        .option('-m, --migration', 'Also create a migration')
        .action((name: string, opts: any) => {
            const tableName = toTableName(name);
            const stub = readStub('model')
                .replace(/\{\{name\}\}/g, name)
                .replace(/\{\{tableName\}\}/g, tableName);
            const filePath = path.join(ROOT, 'app', 'models', `${name}.ts`);
            writeFile(filePath, stub);
            console.log(chalk.green(`✓ Model created: app/models/${name}.ts`));

            if (opts.migration) {
                const className = toPascalCase(`create_${tableName}_table`);
                const migStub = readStub('migration')
                    .replace(/\{\{tableName\}\}/g, tableName)
                    .replace(/\{\{className\}\}/g, className);
                const migName = `${timestamp()}_create_${tableName}_table.ts`;
                const migPath = path.join(ROOT, 'database', 'migrations', migName);
                writeFile(migPath, migStub);
                console.log(chalk.green(`✓ Migration created: database/migrations/${migName}`));
            }
        });

    // ── make:migration ──────────────────────────────────────
    program
        .command('make:migration <name>')
        .description('Create a new migration')
        .action((name: string) => {
            // Extract table name from common patterns
            let tableName = name;
            if (name.startsWith('create_') && name.endsWith('_table')) {
                tableName = name.replace('create_', '').replace('_table', '');
            }

            const className = toPascalCase(name);
            const stub = readStub('migration')
                .replace(/\{\{tableName\}\}/g, tableName)
                .replace(/\{\{className\}\}/g, className);
            const fileName = `${timestamp()}_${name}.ts`;
            const filePath = path.join(ROOT, 'database', 'migrations', fileName);
            writeFile(filePath, stub);
            console.log(chalk.green(`✓ Migration created: database/migrations/${fileName}`));
        });

    // ── make:seeder ─────────────────────────────────────────
    program
        .command('make:seeder <name>')
        .description('Create a new seeder')
        .action((name: string) => {
            const tableName = toTableName(name.replace('Seeder', ''));
            const stub = readStub('seeder').replace(/\{\{tableName\}\}/g, tableName);
            const filePath = path.join(ROOT, 'database', 'seeders', `${name}.ts`);
            writeFile(filePath, stub);
            console.log(chalk.green(`✓ Seeder created: database/seeders/${name}.ts`));
        });

    // ── make:middleware ──────────────────────────────────────
    program
        .command('make:middleware <name>')
        .description('Create a new middleware')
        .action((name: string) => {
            const camelName = toCamelCase(name);
            const stub = readStub('middleware')
                .replace(/\{\{name\}\}/g, name)
                .replace(/\{\{camelName\}\}/g, camelName);
            const filePath = path.join(ROOT, 'app', 'middleware', `${name}.ts`);
            writeFile(filePath, stub);
            console.log(chalk.green(`✓ Middleware created: app/middleware/${name}.ts`));
        });

    // ── make:route ──────────────────────────────────────────
    program
        .command('make:route <name>')
        .description('Create a new route file')
        .action((name: string) => {
            const stub = readStub('route').replace(/\{\{name\}\}/g, name);
            const filePath = path.join(ROOT, 'app', 'routes', `${name}.ts`);
            writeFile(filePath, stub);
            console.log(chalk.green(`✓ Route file created: app/routes/${name}.ts`));
        });

    // ── migrate ─────────────────────────────────────────────
    program
        .command('migrate')
        .description('Run pending database migrations')
        .action(async () => {
            loadEnv();
            const { Database } = await import('../database/Database.js');
            const { Migration } = await import('../database/Migration.js');

            const ds = await initializeDataSource();
            Database.setDataSource(ds);

            const migration = new Migration(path.join(ROOT, 'database', 'migrations'));
            await migration.migrate();
            await Database.disconnect();
        });

    // ── migrate:rollback ────────────────────────────────────
    program
        .command('migrate:rollback')
        .description('Rollback the last batch of migrations')
        .action(async () => {
            loadEnv();
            const { Database } = await import('../database/Database.js');
            const { Migration } = await import('../database/Migration.js');

            const ds = await initializeDataSource();
            Database.setDataSource(ds);

            const migration = new Migration(path.join(ROOT, 'database', 'migrations'));
            await migration.rollback();
            await Database.disconnect();
        });

    // ── db:seed ─────────────────────────────────────────────
    program
        .command('db:seed')
        .description('Run database seeders')
        .option('-c, --class <name>', 'Run a specific seeder')
        .action(async (opts: any) => {
            loadEnv();
            const { Database } = await import('../database/Database.js');
            const { Seeder } = await import('../database/Seeder.js');

            const ds = await initializeDataSource();
            Database.setDataSource(ds);

            const seeder = new Seeder(path.join(ROOT, 'database', 'seeders'));

            if (opts.class) {
                await seeder.seedOne(opts.class);
            } else {
                await seeder.seed();
            }

            await Database.disconnect();
        });

    // ── route:list ──────────────────────────────────────────
    program
        .command('route:list')
        .description('List all registered routes')
        .action(async () => {
            console.log(chalk.cyan('\n⚡ HyperZ — Registered Routes\n'));

            // Scan route files
            const routesDir = path.join(ROOT, 'app', 'routes');
            if (!fs.existsSync(routesDir)) {
                console.log(chalk.yellow('  No route files found in app/routes/'));
                return;
            }

            const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
            console.log(chalk.gray(`  Found ${files.length} route file(s): ${files.join(', ')}\n`));
            console.log(chalk.gray('  (Start the server to see resolved routes with methods & paths)'));
        });

    // ── serve ───────────────────────────────────────────────
    program
        .command('serve')
        .description('Start the development server')
        .option('-p, --port <port>', 'Port number', '3000')
        .action(async (opts: any) => {
            console.log(chalk.cyan(`\n⚡ Starting HyperZ dev server on port ${opts.port}...\n`));
            // Delegate to tsx watch
            const { execSync } = await import('node:child_process');
            try {
                execSync(`npx tsx watch server.ts`, { stdio: 'inherit', cwd: ROOT });
            } catch {
                // Process interrupted
            }
        });

    // ── key:generate ────────────────────────────────────────
    program
        .command('key:generate')
        .description('Generate application key and JWT secret')
        .action(() => {
            const appKey = randomString(64);
            const jwtSecret = randomString(64);
            const envPath = path.join(ROOT, '.env');

            if (fs.existsSync(envPath)) {
                let content = fs.readFileSync(envPath, 'utf-8');

                // APP_KEY
                if (content.includes('APP_KEY=')) {
                    content = content.replace(/APP_KEY=.*/, `APP_KEY=${appKey}`);
                } else {
                    content += `\nAPP_KEY=${appKey}`;
                }

                // JWT_SECRET
                if (content.includes('JWT_SECRET=')) {
                    content = content.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);
                } else {
                    content += `\nJWT_SECRET=${jwtSecret}`;
                }

                fs.writeFileSync(envPath, content);
            } else {
                fs.writeFileSync(envPath, `APP_KEY=${appKey}\nJWT_SECRET=${jwtSecret}\n`);
            }

            console.log(chalk.green(`✓ APP_KEY generated: ${appKey.substring(0, 16)}...`));
            console.log(chalk.green(`✓ JWT_SECRET generated: ${jwtSecret.substring(0, 16)}...`));
        });

    // ── make:auth ───────────────────────────────────────────
    program
        .command('make:auth')
        .description('Scaffold authentication (controller, routes, migration)')
        .action(() => {
            // Auth Controller
            const authController = `import { Controller } from '../../src/http/Controller.js';
import { AuthManager } from '../../src/auth/AuthManager.js';
import type { Request, Response } from 'express';

const auth = new AuthManager();

export class AuthController extends Controller {
  /**
   * Register a new user.
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;
    const hashedPassword = await auth.hashPassword(password);

    // TODO: Save user to database
    const user = { id: 1, name, email };
    const token = auth.generateToken(user);

    this.created(res, { user, token }, 'Registration successful');
  }

  /**
   * Login user.
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    // TODO: Replace with actual user lookup
    const result = await auth.attempt(
      { email, password },
      async (email) => {
        // Replace this with: const user = await User.where({ email }).first();
        return null;
      }
    );

    if (!result) {
      this.error(res, 'Invalid credentials', 401);
      return;
    }

    this.success(res, result, 'Login successful');
  }

  /**
   * Get authenticated user.
   * GET /api/auth/me
   */
  async me(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;
    this.success(res, user, 'Authenticated user');
  }
}
`;

            // Auth Routes
            const authRoutes = `import { HyperZRouter } from '../../src/http/Router.js';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../../src/http/middleware/AuthMiddleware.js';

const router = new HyperZRouter();
const controller = new AuthController();

// Public routes
router.post('/auth/register', controller.register.bind(controller));
router.post('/auth/login', controller.login.bind(controller));

// Protected routes
router.group({ prefix: '/auth', middleware: [authMiddleware()] }, (r) => {
  r.get('/me', controller.me.bind(controller));
});

export default router;
`;

            // Auth Migration
            const authMigration = `import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.string('role').defaultTo('user');
    table.timestamp('email_verified_at').nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();
  });

  // Roles table
  await knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('name').unique().notNullable();
    table.string('description').nullable();
    table.timestamps(true, true);
  });

  // Permissions table
  await knex.schema.createTable('permissions', (table) => {
    table.increments('id').primary();
    table.string('name').unique().notNullable();
    table.string('description').nullable();
    table.timestamps(true, true);
  });

  // Role-Permission pivot
  await knex.schema.createTable('role_permissions', (table) => {
    table.increments('id').primary();
    table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
    table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE');
    table.unique(['role_id', 'permission_id']);
  });

  // User-Role pivot
  await knex.schema.createTable('user_roles', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
    table.unique(['user_id', 'role_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
}
`;

            // Write files
            writeFile(path.join(ROOT, 'app', 'controllers', 'AuthController.ts'), authController);
            writeFile(path.join(ROOT, 'app', 'routes', 'auth.ts'), authRoutes);
            writeFile(
                path.join(ROOT, 'database', 'migrations', `${timestamp()}_create_auth_tables.ts`),
                authMigration
            );

            console.log(chalk.green('✓ Auth scaffolded:'));
            console.log(chalk.gray('  → app/controllers/AuthController.ts'));
            console.log(chalk.gray('  → app/routes/auth.ts'));
            console.log(chalk.gray('  → database/migrations/*_create_auth_tables.ts'));
        });

    // ── make:job ────────────────────────────────────────────
    program
        .command('make:job <name>')
        .description('Create a new queue job')
        .action((name: string) => {
            const stub = readStub('job').replace(/\{\{name\}\}/g, name);
            const filePath = path.join(ROOT, 'app', 'jobs', `${name}.ts`);
            writeFile(filePath, stub);
            console.log(chalk.green(`✓ Job created: app/jobs/${name}.ts`));
        });

    // ── make:factory ────────────────────────────────────────
    program
        .command('make:factory <name>')
        .description('Create a new database factory')
        .action((name: string) => {
            const tableName = toTableName(name.replace('Factory', ''));
            const stub = readStub('factory')
                .replace(/\{\{name\}\}/g, name)
                .replace(/\{\{tableName\}\}/g, tableName);
            const filePath = path.join(ROOT, 'database', 'factories', `${name}.ts`);
            writeFile(filePath, stub);
            console.log(chalk.green(`✓ Factory created: database/factories/${name}.ts`));
        });

    // ── make:ai-action ──────────────────────────────────────
    program
        .command('make:ai-action <name>')
        .description('Create a new AI action')
        .action((name: string) => {
            const content = `import { AIGateway } from '../../src/ai/AIGateway.js';
import type { AIMessage, AICompletionOptions } from '../../src/ai/AIGateway.js';

const ai = new AIGateway();
ai.autoConfig();

export class ${name} {
  /**
   * Execute the AI action.
   */
  async execute(input: string, options?: AICompletionOptions): Promise<string> {
    const messages: AIMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: input },
    ];

    const response = await ai.chat(messages, options);
    return response.content;
  }
}
`;
            const filePath = path.join(ROOT, 'app', 'ai', `${name}.ts`);
            writeFile(filePath, content);
            console.log(chalk.green(`✓ AI Action created: app/ai/${name}.ts`));
        });

    // ── tinker ──────────────────────────────────────────────
    program
        .command('tinker')
        .description('Interactive REPL with preloaded app context')
        .action(async () => {
            console.log(chalk.cyan('\n⚡ HyperZ Tinker — Interactive REPL\n'));
            console.log(chalk.gray('  Available: db, env, helpers, Logger, Factory'));
            console.log(chalk.gray('  Type .exit to quit\n'));

            const repl = await import('node:repl');
            loadEnv();

            const r = repl.start({ prompt: chalk.magenta('hyperz > '), useGlobal: true });

            // Preload common modules into REPL context
            try {
                const { Database } = await import('../database/Database.js');
                const { Logger } = await import('../logging/Logger.js');
                const helpers = await import('../support/helpers.js');

                r.context.db = Database;
                r.context.Logger = Logger;
                r.context.env = helpers.env;
                r.context.sleep = helpers.sleep;
                r.context.randomString = helpers.randomString;
            } catch {
                // Some modules may not load outside full app boot
            }
        });
}

