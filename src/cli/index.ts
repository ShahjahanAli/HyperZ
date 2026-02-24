import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();

// Helper: Read stub file
function readStub(name: string): string {
    const stubPath = path.join(__dirname, 'stubs', `${name}.stub`);
    return fs.readFileSync(stubPath, 'utf8');
}

// Helper: Write file ensuring directory exists
function writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

// Helper: Convert to table name (snake_case plural)
function toTableName(name: string): string {
    return name
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase() + 's';
}

// Helper: PascalCase
function toPascalCase(str: string): string {
    return str
        .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, c => c.toUpperCase());
}

// Helper: CamelCase
function toCamelCase(str: string): string {
    return str
        .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
        .replace(/^(.)/, c => c.toLowerCase());
}

// Helper: Timestamp for migrations
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

/**
 * Load Environment
 */
function loadEnv() {
    const envPath = path.join(ROOT, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
}

/**
 * Helper: Random String
 */
function randomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Initialize DataSource for CLI
 */
async function initializeDataSource() {
    const { initializeDataSource: init } = await import('../database/DataSource.js');
    return await init();
}

// ── Register All Commands ───────────────────────────────────

export function registerCommands(program: Command): void {

    // ── make:controller ─────────────────────────────────────
    program
        .command('make:controller <name>')
        .description('Create a new controller')
        .option('-m, --model <model>', 'Link to a model and generate CRUD')
        .action((nameInput: string, opts: any) => {
            // Normalize name: remove "Controller" suffix if user provided it
            const baseName = nameInput.replace(/Controller$/i, '');
            const className = `${baseName}Controller`;

            let stub = readStub('controller');

            if (opts.model) {
                const modelName = opts.model;
                stub = stub
                    .replace(/\/\/ import \{ \{\{name\}\} \} from '\.\.\/models\/\{\{name\}\}\.js';/g, `import { ${modelName} } from '../models/${modelName}.js';`)
                    .replace(/\/\/ const items = await \{\{name\}\}\.all\(\);/g, `const items = await ${modelName}.all();`)
                    .replace(/this\.success\(res, \[\], '\{\{name\}\} index'\);/g, `this.success(res, items, '${baseName} index');`)
                    .replace(/\/\/ const item = await \{\{name\}\}\.findOrFail\(id\);/g, `const item = await ${modelName}.findOrFail(id);`)
                    .replace(/this\.success\(res, \{ id \}, '\{\{name\}\} show'\);/g, `this.success(res, item, '${baseName} show');`)
                    .replace(/\/\/ const item = await \{\{name\}\}\.create\(req\.body\);/g, `const item = await ${modelName}.create(req.body);`)
                    .replace(/this\.created\(res, req\.body, 'Resource created'\);/g, `this.created(res, item, 'Resource created');`)
                    .replace(/\/\/ await item\.fill\(req\.body\)\.save\(\);/g, `await Object.assign(item, req.body).save();`)
                    .replace(/this\.success\(res, \{ id, \.\.\.req\.body \}, 'Resource updated'\);/g, `this.success(res, item, 'Resource updated');`)
                    .replace(/\/\/ await item\.delete\(\);/g, `await item.remove();`);
            }

            stub = stub.replace(/\{\{name\}\}/g, baseName);

            const filePath = path.join(ROOT, 'app', 'controllers', `${className}.ts`);
            writeFile(filePath, stub);
            console.log(chalk.green(`✓ Controller created: app/controllers/${className}.ts`));
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
                const ts = timestamp();
                const className = toPascalCase(`create_${tableName}_table`) + ts;
                const migStub = readStub('migration')
                    .replace(/\{\{tableName\}\}/g, tableName)
                    .replace(/\{\{className\}\}/g, className);
                const migName = `${ts}_create_${tableName}_table.ts`;
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

            const ts = timestamp();
            const className = toPascalCase(name) + ts;
            const stub = readStub('migration')
                .replace(/\{\{tableName\}\}/g, tableName)
                .replace(/\{\{className\}\}/g, className);
            const fileName = `${ts}_${name}.ts`;
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
        .description('Scaffold authentication (model, controller, routes, migration)')
        .action(() => {
            // User Model
            const userModel = `import { Entity, Column } from 'typeorm';
import { Model } from '../../src/database/Model.js';

@Entity('users')
export class User extends Model {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', default: 'user' })
  role: string;

  /** Fields hidden from JSON serialization */
  protected static hidden: string[] = ['password'];
}
`;

            // Auth Controller
            const authController = `import { Controller } from '../../src/http/Controller.js';
import { AuthManager } from '../../src/auth/AuthManager.js';
import { User } from '../models/User.js';
import type { Request, Response } from 'express';

const auth = new AuthManager();

export class AuthController extends Controller {
  /**
   * Register a new user.
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await auth.hashPassword(password);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const token = auth.generateToken(user);

        this.created(res, { user, token }, 'Registration successful');
    } catch (err: any) {
        this.error(res, err.message || 'Registration failed');
    }
  }

  /**
   * Login user.
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const result = await auth.attempt(
      { email, password },
      async (email) => {
        return await User.where('email', email).first();
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
            const ts = timestamp();
            const authMigration = `import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateAuthTables${ts} implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users table
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "name", type: "varchar", isNullable: false },
                    { name: "email", type: "varchar", isUnique: true, isNullable: false },
                    { name: "password", type: "varchar", isNullable: false },
                    { name: "role", type: "varchar", default: "'user'" },
                    { name: "email_verified_at", type: "timestamp", isNullable: true },
                    { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "deleted_at", type: "timestamp", isNullable: true },
                ],
            }),
            true
        );

        // Roles table
        await queryRunner.createTable(
            new Table({
                name: "roles",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "name", type: "varchar", isUnique: true, isNullable: false },
                    { name: "description", type: "varchar", isNullable: true },
                    { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                ],
            }),
            true
        );

        // Permissions table
        await queryRunner.createTable(
            new Table({
                name: "permissions",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "name", type: "varchar", isUnique: true, isNullable: false },
                    { name: "description", type: "varchar", isNullable: true },
                    { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                    { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                ],
            }),
            true
        );

        // Role-Permission pivot
        await queryRunner.createTable(
            new Table({
                name: "role_permissions",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "role_id", type: "int" },
                    { name: "permission_id", type: "int" },
                ],
                indices: [{ columnNames: ["role_id", "permission_id"], isUnique: true }]
            }),
            true
        );

        await queryRunner.createForeignKey("role_permissions", new TableForeignKey({
            columnNames: ["role_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "roles",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("role_permissions", new TableForeignKey({
            columnNames: ["permission_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "permissions",
            onDelete: "CASCADE"
        }));

        // User-Role pivot
        await queryRunner.createTable(
            new Table({
                name: "user_roles",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "user_id", type: "int" },
                    { name: "role_id", type: "int" },
                ],
                indices: [{ columnNames: ["user_id", "role_id"], isUnique: true }]
            }),
            true
        );

        await queryRunner.createForeignKey("user_roles", new TableForeignKey({
            columnNames: ["user_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("user_roles", new TableForeignKey({
            columnNames: ["role_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "roles",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("user_roles");
        await queryRunner.dropTable("role_permissions");
        await queryRunner.dropTable("permissions");
        await queryRunner.dropTable("roles");
        await queryRunner.dropTable("users");
    }
}
`;

            // Write files
            writeFile(path.join(ROOT, 'app', 'models', 'User.ts'), userModel);
            writeFile(path.join(ROOT, 'app', 'controllers', 'AuthController.ts'), authController);
            writeFile(path.join(ROOT, 'app', 'routes', 'auth.ts'), authRoutes);
            writeFile(
                path.join(ROOT, 'database', 'migrations', `${ts}_create_auth_tables.ts`),
                authMigration
            );

            console.log(chalk.green('✓ Auth scaffolded:'));
            console.log(chalk.gray('  → app/models/User.ts'));
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

    // ── make:test ───────────────────────────────────────────
    program
        .command('make:test <name>')
        .description('Create a new test file')
        .option('-u, --unit', 'Create a unit test (default)')
        .option('-f, --feature', 'Create a feature/integration test')
        .action((nameInput: string, opts: any) => {
            const baseName = nameInput.replace(/\.test$/i, '');
            const name = toPascalCase(baseName);
            const stub = readStub('test').replace(/\{\{name\}\}/g, name);

            const dir = opts.feature ? 'tests/feature' : 'tests/unit';
            const filePath = path.join(ROOT, dir, `${name}.test.ts`);
            writeFile(filePath, stub);
            console.log(chalk.green(`✓ Test created: ${dir}/${name}.test.ts`));
        });

    // ── make:module ─────────────────────────────────────────
    program
        .command('make:module <name>')
        .description('Scaffold a full domain module (controller, model, migration, route, test)')
        .option('--no-migration', 'Skip migration creation')
        .option('--no-test', 'Skip test creation')
        .action((nameInput: string, opts: any) => {
            const name = toPascalCase(nameInput);
            const tableName = toTableName(name);
            const controllerName = `${name}Controller`;

            console.log(chalk.cyan(`\n⚡ Scaffolding module: ${name}\n`));

            // 1. Model
            const modelStub = readStub('model')
                .replace(/\{\{name\}\}/g, name)
                .replace(/\{\{tableName\}\}/g, tableName);
            writeFile(path.join(ROOT, 'app', 'models', `${name}.ts`), modelStub);
            console.log(chalk.green(`  ✓ Model: app/models/${name}.ts`));

            // 2. Controller (with model wired up)
            let ctrlStub = readStub('controller');
            ctrlStub = ctrlStub
                .replace(/\/\/ import \{ \{\{name\}\} \} from '\.\.\/models\/\{\{name\}\}\.js';/g, `import { ${name} } from '../models/${name}.js';`)
                .replace(/\/\/ const items = await \{\{name\}\}\.all\(\);/g, `const items = await ${name}.all();`)
                .replace(/this\.success\(res, \[\], '\{\{name\}\} index'\);/g, `this.success(res, items, '${name} index');`)
                .replace(/\/\/ const item = await \{\{name\}\}\.findOrFail\(id\);/g, `const item = await ${name}.findOrFail(id);`)
                .replace(/this\.success\(res, \{ id \}, '\{\{name\}\} show'\);/g, `this.success(res, item, '${name} show');`)
                .replace(/\/\/ const item = await \{\{name\}\}\.create\(req\.body\);/g, `const item = await ${name}.create(req.body);`)
                .replace(/this\.created\(res, req\.body, 'Resource created'\);/g, `this.created(res, item, 'Resource created');`)
                .replace(/\/\/ await item\.fill\(req\.body\)\.save\(\);/g, `await Object.assign(item, req.body).save();`)
                .replace(/this\.success\(res, \{ id, \.\.\.req\.body \}, 'Resource updated'\);/g, `this.success(res, item, 'Resource updated');`)
                .replace(/\/\/ await item\.delete\(\);/g, `await item.remove();`)
                .replace(/\{\{name\}\}/g, name);
            writeFile(path.join(ROOT, 'app', 'controllers', `${controllerName}.ts`), ctrlStub);
            console.log(chalk.green(`  ✓ Controller: app/controllers/${controllerName}.ts`));

            // 3. Route file
            const routeContent = `import { HyperZRouter } from '../../src/http/Router.js';
import { ${controllerName} } from '../controllers/${controllerName}.js';

const router = new HyperZRouter({ source: '${name.toLowerCase()}' });
const controller = new ${controllerName}();

router.resource('/${tableName}', controller);

export default router;
`;
            writeFile(path.join(ROOT, 'app', 'routes', `${name.toLowerCase()}.ts`), routeContent);
            console.log(chalk.green(`  ✓ Route: app/routes/${name.toLowerCase()}.ts`));

            // 4. Migration (unless --no-migration)
            if (opts.migration !== false) {
                const ts = timestamp();
                const migClassName = toPascalCase(`create_${tableName}_table`) + ts;
                const migStub = readStub('migration')
                    .replace(/\{\{tableName\}\}/g, tableName)
                    .replace(/\{\{className\}\}/g, migClassName);
                const migName = `${ts}_create_${tableName}_table.ts`;
                writeFile(path.join(ROOT, 'database', 'migrations', migName), migStub);
                console.log(chalk.green(`  ✓ Migration: database/migrations/${migName}`));
            }

            // 5. Test (unless --no-test)
            if (opts.test !== false) {
                const testStub = readStub('test').replace(/\{\{name\}\}/g, name);
                writeFile(path.join(ROOT, 'tests', 'unit', `${name}.test.ts`), testStub);
                console.log(chalk.green(`  ✓ Test: tests/unit/${name}.test.ts`));
            }

            console.log(chalk.cyan(`\n✨ Module "${name}" scaffolded successfully!\n`));
            console.log(chalk.gray('  Next steps:'));
            console.log(chalk.gray(`  1. Edit the model: app/models/${name}.ts`));
            console.log(chalk.gray(`  2. Run migration: npx hyperz migrate`));
            console.log(chalk.gray(`  3. Routes auto-loaded at: /api/${tableName}`));
        });

    // ═══════════════════════════════════════════════════════════
    // Plugin / Package Ecosystem Commands
    // ═══════════════════════════════════════════════════════════

    // ── make:plugin ─────────────────────────────────────────
    program
        .command('make:plugin <name>')
        .description('Scaffold a new local plugin in plugins/')
        .action((nameInput: string) => {
            const name = nameInput.toLowerCase().replace(/\s+/g, '-');
            const pascalName = toPascalCase(name);
            const pluginDir = path.join(ROOT, 'plugins', name);

            if (fs.existsSync(pluginDir)) {
                console.log(chalk.red(`✗ Plugin "${name}" already exists at plugins/${name}/`));
                return;
            }

            // index.ts — main plugin entry
            const indexContent = `import { definePlugin } from '../../src/core/PluginContract.js';
import type { Application } from '../../src/core/Application.js';

export default definePlugin({
    meta: {
        name: '${name}',
        version: '1.0.0',
        description: '${pascalName} plugin for HyperZ',
        author: '',
        license: 'MIT',
    },

    config: {
        key: '${toCamelCase(name)}',
        defaults: {
            enabled: true,
        },
    },

    resources: {
        // migrations: './database/migrations',
        // seeders: './database/seeders',
        // config: './config',
        // lang: './lang',
    },

    hooks: {
        register(app: Application) {
            // Register bindings into the container
            // app.container.singleton('${toCamelCase(name)}', () => new ${pascalName}Service());
        },

        async boot(app: Application) {
            // Runs after all providers + plugins are registered
            console.log('🔌 ${pascalName} plugin booted');
        },

        async routes(app: Application) {
            // Register routes for this plugin
            // app.express.get('/api/${name}', (req, res) => res.json({ plugin: '${name}' }));
        },

        async shutdown(app: Application) {
            // Clean up resources
        },

        healthCheck(app: Application) {
            return true;
        },
    },

    tags: ['custom'],
});
`;

            // README.md
            const readmeContent = `# ${pascalName} Plugin

A HyperZ plugin.

## Installation

This is a local plugin. It is auto-discovered from the \`plugins/\` directory.

## Configuration

Configuration is available under the \`${toCamelCase(name)}\` key:

\`\`\`typescript
// config/plugins.ts or via app.config
{
    ${toCamelCase(name)}: {
        enabled: true,
    }
}
\`\`\`

## Usage

TODO: Document plugin usage.
`;

            writeFile(path.join(pluginDir, 'index.ts'), indexContent);
            writeFile(path.join(pluginDir, 'README.md'), readmeContent);

            // Create placeholder directories
            const subDirs = ['config', 'database/migrations', 'database/seeders'];
            for (const dir of subDirs) {
                const dirPath = path.join(pluginDir, dir);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
                writeFile(path.join(dirPath, '.gitkeep'), '');
            }

            console.log(chalk.green(`\n✓ Plugin scaffolded: plugins/${name}/`));
            console.log(chalk.gray(`  → plugins/${name}/index.ts`));
            console.log(chalk.gray(`  → plugins/${name}/README.md`));
            console.log(chalk.gray(`  → plugins/${name}/config/`));
            console.log(chalk.gray(`  → plugins/${name}/database/migrations/`));
            console.log(chalk.gray(`  → plugins/${name}/database/seeders/`));
            console.log(chalk.cyan(`\n  Plugin will be auto-discovered on next boot.\n`));
        });

    // ── plugin:list ─────────────────────────────────────────
    program
        .command('plugin:list')
        .description('List all discovered plugins')
        .action(async () => {
            console.log(chalk.cyan('\n⚡ Discovering plugins...\n'));

            try {
                const { createApp } = await import('../../app.js');
                const app = createApp();
                app.config.loadEnv();
                await app.config.loadConfigFiles();
                await app.plugins.discover();

                const plugins = app.plugins.all();

                if (plugins.size === 0) {
                    console.log(chalk.yellow('  No plugins discovered.'));
                    console.log(chalk.gray('\n  Plugins are auto-discovered from:'));
                    console.log(chalk.gray('    → node_modules/ (packages with "hyperz-plugin" key)'));
                    console.log(chalk.gray('    → plugins/ (local plugins with index.ts)'));
                    return;
                }

                console.log(chalk.bold(`  Found ${plugins.size} plugin(s):\n`));

                const Table = (await import('cli-table3')).default;
                const table = new Table({
                    head: [
                        chalk.white('Name'),
                        chalk.white('Version'),
                        chalk.white('Status'),
                        chalk.white('Source'),
                        chalk.white('Tags'),
                    ],
                    style: { head: [], border: [] },
                });

                for (const [name, entry] of plugins) {
                    const statusColor = entry.status === 'booted' ? chalk.green
                        : entry.status === 'registered' ? chalk.blue
                        : entry.status === 'disabled' ? chalk.yellow
                        : chalk.red;
                    table.push([
                        name,
                        entry.plugin.meta.version,
                        statusColor(entry.status),
                        entry.source,
                        (entry.plugin.tags ?? []).join(', ') || '-',
                    ]);
                }

                console.log(table.toString());

                const failed = app.plugins.failed();
                if (failed.length > 0) {
                    console.log(chalk.red(`\n  ⚠ ${failed.length} plugin(s) failed:`));
                    for (const f of failed) {
                        console.log(chalk.red(`    → ${f.plugin.meta.name}: ${f.error}`));
                    }
                }
            } catch (err: any) {
                console.log(chalk.red(`  Failed to discover plugins: ${err.message}`));
            }

            console.log('');
        });

    // ── plugin:install ──────────────────────────────────────
    program
        .command('plugin:install <package>')
        .alias('install')
        .description('Install a HyperZ plugin package via npm')
        .option('--no-publish', 'Skip auto-publishing config files')
        .action(async (packageName: string, opts: any) => {
            console.log(chalk.cyan(`\n⚡ Installing plugin: ${packageName}\n`));

            const { execSync } = await import('node:child_process');

            try {
                // Step 1: npm install
                console.log(chalk.gray(`  → Running: npm install ${packageName}`));
                execSync(`npm install ${packageName}`, { cwd: ROOT, stdio: 'inherit' });
                console.log(chalk.green(`  ✓ Package installed`));

                // Step 2: Discover the newly installed plugin
                if (opts.publish !== false) {
                    console.log(chalk.gray(`  → Discovering plugin...`));
                    try {
                        const { createApp } = await import('../../app.js');
                        const app = createApp();
                        app.config.loadEnv();
                        await app.config.loadConfigFiles();
                        await app.plugins.discover();

                        // Check if the package is a HyperZ plugin
                        const pkgJsonPath = path.join(ROOT, 'node_modules', packageName, 'package.json');
                        if (fs.existsSync(pkgJsonPath)) {
                            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
                            if (pkgJson['hyperz-plugin']) {
                                console.log(chalk.green(`  ✓ HyperZ plugin detected`));

                                // Auto-publish config
                                const { PublishManager } = await import('../core/PublishManager.js');
                                const publisher = new PublishManager(app);
                                const pluginName = pkgJson['hyperz-plugin']?.name || pkgJson.name;

                                const results = await publisher.publish(pluginName, { tag: 'config' });
                                const published = results.filter(r => r.status === 'published');
                                if (published.length > 0) {
                                    console.log(chalk.green(`  ✓ Published ${published.length} config file(s)`));
                                }
                            }
                        }
                    } catch {
                        // Plugin discovery is best-effort during install
                    }
                }

                console.log(chalk.cyan(`\n✨ Plugin "${packageName}" installed successfully!\n`));
                console.log(chalk.gray('  Next steps:'));
                console.log(chalk.gray('  1. Check config: npx hyperz plugin:list'));
                console.log(chalk.gray('  2. Publish resources: npx hyperz vendor:publish --plugin=<name>'));
                console.log(chalk.gray('  3. Run migrations: npx hyperz migrate'));
            } catch (err: any) {
                console.log(chalk.red(`\n✗ Failed to install plugin: ${err.message}`));
            }
        });

    // ── plugin:remove ───────────────────────────────────────
    program
        .command('plugin:remove <package>')
        .alias('remove')
        .description('Uninstall a HyperZ plugin package')
        .option('--keep-config', 'Do not remove published config files')
        .action(async (packageName: string) => {
            console.log(chalk.cyan(`\n⚡ Removing plugin: ${packageName}\n`));

            const { execSync } = await import('node:child_process');

            try {
                console.log(chalk.gray(`  → Running: npm uninstall ${packageName}`));
                execSync(`npm uninstall ${packageName}`, { cwd: ROOT, stdio: 'inherit' });
                console.log(chalk.green(`  ✓ Package uninstalled`));
                console.log(chalk.cyan(`\n✨ Plugin "${packageName}" removed.\n`));
            } catch (err: any) {
                console.log(chalk.red(`\n✗ Failed to remove plugin: ${err.message}`));
            }
        });

    // ── vendor:publish ──────────────────────────────────────
    program
        .command('vendor:publish')
        .description('Publish plugin resources (config, migrations, lang, views)')
        .option('-p, --plugin <name>', 'Publish from a specific plugin')
        .option('-t, --tag <tag>', 'Publish only resources with this tag (config, migrations, seeders, lang, views)')
        .option('-f, --force', 'Overwrite existing files')
        .option('--list', 'List all publishable resources without publishing')
        .action(async (opts: any) => {
            console.log(chalk.cyan('\n⚡ Vendor Publish\n'));

            try {
                const { createApp } = await import('../../app.js');
                const app = createApp();
                app.config.loadEnv();
                await app.config.loadConfigFiles();
                await app.plugins.discover();

                const { PublishManager } = await import('../core/PublishManager.js');
                const publisher = new PublishManager(app);

                // List mode
                if (opts.list) {
                    const items = publisher.listPublishable(opts.tag);
                    if (items.length === 0) {
                        console.log(chalk.yellow('  No publishable resources found.'));
                        return;
                    }

                    const Table = (await import('cli-table3')).default;
                    const table = new Table({
                        head: [
                            chalk.white('Plugin'),
                            chalk.white('Tag'),
                            chalk.white('Source'),
                            chalk.white('Destination'),
                        ],
                        style: { head: [], border: [] },
                    });

                    for (const item of items) {
                        table.push([
                            item.plugin,
                            item.tag,
                            path.relative(ROOT, item.source),
                            path.relative(ROOT, item.destination),
                        ]);
                    }

                    console.log(table.toString());
                    return;
                }

                // Publish mode
                if (opts.plugin) {
                    const results = await publisher.publish(opts.plugin, {
                        tag: opts.tag,
                        force: opts.force,
                    });

                    for (const result of results) {
                        const icon = result.status === 'published' ? chalk.green('✓')
                            : result.status === 'skipped' ? chalk.yellow('○')
                            : chalk.red('✗');
                        const dest = path.relative(ROOT, result.destination);
                        console.log(`  ${icon} ${dest}${result.reason ? chalk.gray(` — ${result.reason}`) : ''}`);
                    }
                } else {
                    const allResults = await publisher.publishAll({
                        tag: opts.tag,
                        force: opts.force,
                    });

                    if (allResults.size === 0) {
                        console.log(chalk.yellow('  No publishable resources found.'));
                        return;
                    }

                    for (const [pluginName, results] of allResults) {
                        console.log(chalk.bold(`  ${pluginName}:`));
                        for (const result of results) {
                            const icon = result.status === 'published' ? chalk.green('✓')
                                : result.status === 'skipped' ? chalk.yellow('○')
                                : chalk.red('✗');
                            const dest = path.relative(ROOT, result.destination);
                            console.log(`    ${icon} ${dest}${result.reason ? chalk.gray(` — ${result.reason}`) : ''}`);
                        }
                    }
                }
            } catch (err: any) {
                console.log(chalk.red(`\n✗ Failed to publish: ${err.message}`));
            }

            console.log('');
        });

    // ── plugin:enable ───────────────────────────────────────
    program
        .command('plugin:enable <name>')
        .description('Enable a disabled plugin')
        .action(async (pluginName: string) => {
            const configPath = path.join(ROOT, 'config', 'plugins.ts');
            if (!fs.existsSync(configPath)) {
                console.log(chalk.yellow('  config/plugins.ts not found. Creating...'));
            }

            console.log(chalk.green(`  ✓ To enable "${pluginName}", remove it from the "disabled" array in config/plugins.ts`));
            console.log(chalk.gray(`\n  // config/plugins.ts`));
            console.log(chalk.gray(`  disabled: [], // remove '${pluginName}' from this list`));
        });

    // ── plugin:disable ──────────────────────────────────────
    program
        .command('plugin:disable <name>')
        .description('Disable a plugin without uninstalling')
        .action(async (pluginName: string) => {
            console.log(chalk.yellow(`  ✓ To disable "${pluginName}", add it to the "disabled" array in config/plugins.ts`));
            console.log(chalk.gray(`\n  // config/plugins.ts`));
            console.log(chalk.gray(`  disabled: ['${pluginName}'],`));
        });

    // ── plugin:health ───────────────────────────────────────
    program
        .command('plugin:health')
        .description('Run health checks on all plugins')
        .action(async () => {
            console.log(chalk.cyan('\n⚡ Running plugin health checks...\n'));

            try {
                const { createApp } = await import('../../app.js');
                const app = createApp();
                app.config.loadEnv();
                await app.config.loadConfigFiles();
                await app.plugins.discover();
                await app.plugins.bootAll();

                const results = await app.plugins.healthCheck();

                if (results.size === 0) {
                    console.log(chalk.yellow('  No plugins to check.'));
                    return;
                }

                for (const [name, healthy] of results) {
                    const icon = healthy ? chalk.green('✓') : chalk.red('✗');
                    const status = healthy ? chalk.green('healthy') : chalk.red('unhealthy');
                    console.log(`  ${icon} ${name}: ${status}`);
                }

                const unhealthy = [...results.values()].filter(h => !h).length;
                if (unhealthy > 0) {
                    console.log(chalk.red(`\n  ⚠ ${unhealthy} plugin(s) unhealthy`));
                } else {
                    console.log(chalk.green('\n  All plugins healthy ✓'));
                }
            } catch (err: any) {
                console.log(chalk.red(`  Failed to run health checks: ${err.message}`));
            }

            console.log('');
        });

    // ── plugin:update ───────────────────────────────────────
    program
        .command('plugin:update [package]')
        .description('Update a plugin package (or all plugin packages)')
        .option('--latest', 'Update to the latest version (ignore semver range)')
        .action(async (packageName: string | undefined, opts: { latest?: boolean }) => {
            console.log(chalk.cyan('\n⚡ Updating plugin package(s)...\n'));

            try {
                const { execSync } = await import('node:child_process');

                if (packageName) {
                    // Update specific package
                    const flag = opts.latest ? '@latest' : '';
                    console.log(chalk.gray(`  Updating ${packageName}${flag}...`));
                    execSync(`npm update ${packageName}${flag}`, { stdio: 'inherit', cwd: ROOT });
                    console.log(chalk.green(`\n  ✓ Updated ${packageName}`));
                } else {
                    // Update all hyperz-plugin packages
                    console.log(chalk.gray('  Discovering plugin packages...'));

                    const nodeModules = path.join(ROOT, 'node_modules');
                    const pkgJsonPath = path.join(ROOT, 'package.json');
                    if (!fs.existsSync(pkgJsonPath)) {
                        console.log(chalk.red('  No package.json found'));
                        return;
                    }

                    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
                    const allDeps = {
                        ...(pkgJson.dependencies ?? {}),
                        ...(pkgJson.devDependencies ?? {}),
                    };

                    const pluginPackages: string[] = [];
                    for (const depName of Object.keys(allDeps)) {
                        const depPkgJson = path.join(nodeModules, depName, 'package.json');
                        if (!fs.existsSync(depPkgJson)) continue;
                        try {
                            const depPkg = JSON.parse(fs.readFileSync(depPkgJson, 'utf-8'));
                            if (depPkg['hyperz-plugin'] || depPkg.keywords?.includes('hyperz-plugin')) {
                                pluginPackages.push(depName);
                            }
                        } catch {
                            // Skip unreadable packages
                        }
                    }

                    if (pluginPackages.length === 0) {
                        console.log(chalk.yellow('  No plugin packages found to update.'));
                        return;
                    }

                    console.log(chalk.gray(`  Found ${pluginPackages.length} plugin package(s): ${pluginPackages.join(', ')}`));
                    const flag = opts.latest ? '@latest' : '';

                    for (const pkg of pluginPackages) {
                        console.log(chalk.gray(`  Updating ${pkg}${flag}...`));
                        try {
                            execSync(`npm update ${pkg}${flag}`, { stdio: 'pipe', cwd: ROOT });
                            console.log(chalk.green(`    ✓ ${pkg} updated`));
                        } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : String(err);
                            console.log(chalk.red(`    ✗ ${pkg} failed: ${msg}`));
                        }
                    }

                    console.log(chalk.green(`\n  ✓ Plugin update complete`));
                }

                // Suggest next steps
                console.log(chalk.gray('\n  Next steps:'));
                console.log(chalk.gray('  1. Review changes: npx hyperz plugin:list'));
                console.log(chalk.gray('  2. Re-publish resources: npx hyperz vendor:publish --force'));
            } catch (err: any) {
                console.log(chalk.red(`  Update failed: ${err.message}`));
            }

            console.log('');
        });

    // ── plugin:graph ────────────────────────────────────────
    program
        .command('plugin:graph')
        .description('Display the plugin dependency graph')
        .option('--json', 'Output as JSON')
        .action(async (opts: { json?: boolean }) => {
            console.log(chalk.cyan('\n⚡ Plugin Dependency Graph\n'));

            try {
                const { createApp } = await import('../../app.js');
                const app = createApp();
                app.config.loadEnv();
                await app.config.loadConfigFiles();
                await app.plugins.discover();

                const all = app.plugins.all();

                if (all.size === 0) {
                    console.log(chalk.yellow('  No plugins discovered.'));
                    return;
                }

                // Build graph data
                const graph: Record<string, { version: string; status: string; dependencies: string[]; dependents: string[] }> = {};

                for (const [name, entry] of all) {
                    graph[name] = {
                        version: entry.plugin.meta.version,
                        status: entry.status,
                        dependencies: (entry.plugin.dependencies ?? []).map(d => d.name),
                        dependents: [],
                    };
                }

                // Fill in dependents (reverse lookup)
                for (const [name, data] of Object.entries(graph)) {
                    for (const depName of data.dependencies) {
                        if (graph[depName]) {
                            graph[depName].dependents.push(name);
                        }
                    }
                }

                if (opts.json) {
                    console.log(JSON.stringify(graph, null, 2));
                    return;
                }

                // ASCII tree display
                // First show root plugins (no dependencies)
                const roots = Object.entries(graph).filter(([, d]) => d.dependencies.length === 0);
                const dependents = Object.entries(graph).filter(([, d]) => d.dependencies.length > 0);

                if (roots.length > 0) {
                    console.log(chalk.white('  Root plugins (no dependencies):'));
                    for (const [name, data] of roots) {
                        const statusIcon = data.status === 'booted' ? chalk.green('●') :
                            data.status === 'registered' ? chalk.yellow('●') : chalk.red('●');
                        console.log(`  ${statusIcon} ${chalk.bold(name)} v${data.version}`);

                        if (data.dependents.length > 0) {
                            for (let i = 0; i < data.dependents.length; i++) {
                                const isLast = i === data.dependents.length - 1;
                                const prefix = isLast ? '  └── ' : '  ├── ';
                                const dep = data.dependents[i];
                                const depData = graph[dep];
                                const depIcon = depData?.status === 'booted' ? chalk.green('●') :
                                    depData?.status === 'registered' ? chalk.yellow('●') : chalk.red('●');
                                console.log(`    ${prefix}${depIcon} ${dep} v${depData?.version ?? '?'}`);
                            }
                        }
                    }
                }

                if (dependents.length > 0) {
                    console.log('');
                    console.log(chalk.white('  Plugins with dependencies:'));
                    for (const [name, data] of dependents) {
                        const statusIcon = data.status === 'booted' ? chalk.green('●') :
                            data.status === 'registered' ? chalk.yellow('●') : chalk.red('●');
                        console.log(`  ${statusIcon} ${chalk.bold(name)} v${data.version}`);
                        console.log(chalk.gray(`      depends on: ${data.dependencies.join(', ')}`));
                    }
                }

                // Summary
                console.log('');
                console.log(chalk.gray(`  Legend: ${chalk.green('●')} booted  ${chalk.yellow('●')} registered  ${chalk.red('●')} failed`));
                console.log(chalk.gray(`  Total: ${all.size} plugin(s)`));
            } catch (err: any) {
                console.log(chalk.red(`  Failed to build graph: ${err.message}`));
            }

            console.log('');
        });

    // ── plugin:metrics ──────────────────────────────────────
    program
        .command('plugin:metrics')
        .description('Show plugin performance metrics (boot time, registration time)')
        .action(async () => {
            console.log(chalk.cyan('\n⚡ Plugin Performance Metrics\n'));

            try {
                const { createApp } = await import('../../app.js');
                const app = createApp();
                app.config.loadEnv();
                await app.config.loadConfigFiles();
                await app.plugins.discover();
                await app.plugins.bootAll();

                const metrics = app.plugins.getAllMetrics();

                if (metrics.size === 0) {
                    console.log(chalk.yellow('  No plugins to report on.'));
                    return;
                }

                // Table header
                const nameWidth = 30;
                const colWidth = 14;
                console.log(
                    chalk.white('  ' +
                        'Plugin'.padEnd(nameWidth) +
                        'Register'.padEnd(colWidth) +
                        'Boot'.padEnd(colWidth) +
                        'Errors'.padEnd(colWidth)
                    )
                );
                console.log(chalk.gray('  ' + '─'.repeat(nameWidth + colWidth * 3)));

                for (const [name, m] of metrics) {
                    const regTime = `${m.registerTime.toFixed(1)}ms`;
                    const bootTime = `${m.bootTime.toFixed(1)}ms`;
                    const errors = m.errorCount > 0 ? chalk.red(String(m.errorCount)) : chalk.green('0');

                    // Color code by performance
                    const regColor = m.registerTime > 100 ? chalk.red : m.registerTime > 50 ? chalk.yellow : chalk.green;
                    const bootColor = m.bootTime > 500 ? chalk.red : m.bootTime > 100 ? chalk.yellow : chalk.green;

                    console.log(
                        '  ' +
                        name.padEnd(nameWidth) +
                        regColor(regTime.padEnd(colWidth)) +
                        bootColor(bootTime.padEnd(colWidth)) +
                        errors.padEnd(colWidth)
                    );
                }

                console.log(chalk.gray('  ' + '─'.repeat(nameWidth + colWidth * 3)));
                console.log(
                    chalk.white(
                        '  ' +
                        'Total'.padEnd(nameWidth) +
                        `${app.plugins.getDiscoveryTime().toFixed(1)}ms disc`.padEnd(colWidth) +
                        `${app.plugins.getBootTime().toFixed(1)}ms boot`.padEnd(colWidth)
                    )
                );
            } catch (err: any) {
                console.log(chalk.red(`  Failed to gather metrics: ${err.message}`));
            }

            console.log('');
        });
}
