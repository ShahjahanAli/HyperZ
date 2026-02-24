// ──────────────────────────────────────────────────────────────
// HyperZ — Admin Authentication Service
//
// Database-backed admin account management with JWT sessions,
// bcrypt password hashing, account lockout, and audit trail.
// ──────────────────────────────────────────────────────────────

import { AuthManager } from '../auth/AuthManager.js';
import { Logger } from '../logging/Logger.js';
import { env } from '../support/helpers.js';
import jwt from 'jsonwebtoken';
import type { DataSource } from 'typeorm';

const TABLE = 'hyperz_admins';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Login attempt tracking per IP (in-memory, for rate limiting)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

// Singleton auth manager
let authManager: AuthManager | null = null;
function getAuth(): AuthManager {
    if (!authManager) authManager = new AuthManager();
    return authManager;
}

// ── TypeORM DB helpers ─────────────────────────────────────────

async function getDS(): Promise<DataSource | null> {
    try {
        const { Database } = await import('../database/Database.js');
        if (Database.isTypeORMConnected()) return Database.getDataSource();

        // Attempt to initialize from config if not yet ready
        const { initializeDataSource } = await import('../database/DataSource.js');
        const ds = await initializeDataSource();
        Database.setDataSource(ds);
        return ds;
    } catch {
        return null;
    }
}

/** Run a parameterized SQL query, normalising ? placeholders for all drivers. */
async function rawQuery(ds: DataSource, query: string, params: any[] = []): Promise<any[]> {
    if (ds.options.type === 'postgres') {
        let i = 0;
        const pgQuery = query.replace(/\?/g, () => `$${++i}`);
        return ds.query(pgQuery, params);
    }
    return ds.query(query, params);
}

async function dbTableExists(ds: DataSource, table: string): Promise<boolean> {
    try {
        const driver = ds.options.type;
        if (driver === 'sqlite') {
            const rows = await ds.query(
                `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table]
            );
            return rows.length > 0;
        }
        if (driver === 'postgres') {
            const rows = await ds.query(
                `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
                [table]
            );
            return rows.length > 0;
        }
        const rows = await ds.query(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?`,
            [table]
        );
        return rows.length > 0;
    } catch { return false; }
}

async function dbInsert(ds: DataSource, table: string, data: Record<string, any>): Promise<number> {
    const keys = Object.keys(data);
    const vals = Object.values(data);
    const cols = keys.map(k => `"${k}"`).join(', ');

    if (ds.options.type === 'postgres') {
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const rows = await ds.query(
            `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING id`, vals
        );
        return rows[0]?.id ?? 0;
    }

    const placeholders = keys.map(() => '?').join(', ');
    const result = await ds.query(
        `INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`, vals
    );
    return result?.insertId ?? 0;
}

async function dbUpdate(ds: DataSource, table: string, where: Record<string, any>, data: Record<string, any>): Promise<void> {
    const setVals = Object.values(data);
    const whereVals = Object.values(where);
    const allVals = [...setVals, ...whereVals];

    if (ds.options.type === 'postgres') {
        let i = 0;
        const setClause = Object.keys(data).map(k => `"${k}" = $${++i}`).join(', ');
        const whereClause = Object.keys(where).map(k => `"${k}" = $${++i}`).join(' AND ');
        await ds.query(`UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`, allVals);
        return;
    }

    const setClause = Object.keys(data).map(k => `"${k}" = ?`).join(', ');
    const whereClause = Object.keys(where).map(k => `"${k}" = ?`).join(' AND ');
    await ds.query(`UPDATE "${table}" SET ${setClause} WHERE ${whereClause}`, allVals);
}

// ══════════════════════════════════════════════════════════════
// Status — Check system readiness
// ══════════════════════════════════════════════════════════════

export interface AdminStatus {
    dbConnected: boolean;
    tableExists: boolean;
    hasAdmin: boolean;
    adminCount: number;
    driver?: string;
    connectionInfo?: string;
}

export async function getAdminStatus(): Promise<AdminStatus> {
    const ds = await getDS();

    let driver = 'unknown';
    let connectionInfo = 'none';

    if (ds) {
        driver = ds.options.type as string;
        const conn = ds.options as any;
        connectionInfo = conn.database || conn.host || conn.filename || 'unknown';
    }

    if (!ds) {
        return { dbConnected: false, tableExists: false, hasAdmin: false, adminCount: 0, driver, connectionInfo };
    }

    try {
        const exists = await dbTableExists(ds, TABLE);
        if (!exists) {
            return { dbConnected: true, tableExists: false, hasAdmin: false, adminCount: 0, driver, connectionInfo };
        }

        const rows = await rawQuery(ds, `SELECT COUNT(*) as cnt FROM "${TABLE}"`);
        const adminCount = parseInt(rows[0]?.cnt ?? rows[0]?.['COUNT(*)'] ?? 0, 10);

        return { dbConnected: true, tableExists: true, hasAdmin: adminCount > 0, adminCount, driver, connectionInfo };
    } catch {
        return { dbConnected: true, tableExists: false, hasAdmin: false, adminCount: 0, driver, connectionInfo };
    }
}

// ══════════════════════════════════════════════════════════════
// Register — Create admin account
// ══════════════════════════════════════════════════════════════

interface RegisterInput {
    email: string;
    password: string;
    name: string;
}

export async function registerAdmin(input: RegisterInput, callerIsAdmin = false): Promise<{ success: boolean; error?: string; admin?: any }> {
    const ds = await getDS();
    if (!ds) return { success: false, error: 'Database not connected. Configure your database in .env first.' };

    const exists = await dbTableExists(ds, TABLE);
    if (!exists) return { success: false, error: 'Admin table does not exist. Run migrations first: npx tsx bin/hyperz.ts migrate' };

    // Validate input
    if (!input.email || !input.password || !input.name) {
        return { success: false, error: 'Email, password, and name are required.' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
        return { success: false, error: 'Invalid email address.' };
    }

    if (input.password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters.' };
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(input.password)) {
        return { success: false, error: 'Password must contain uppercase, lowercase, and a number.' };
    }

    // Check if registration is allowed
    const countRows = await rawQuery(ds, `SELECT COUNT(*) as cnt FROM "${TABLE}"`);
    const count = parseInt(countRows[0]?.cnt ?? countRows[0]?.['COUNT(*)'] ?? 0, 10);

    if (count > 0 && !callerIsAdmin) {
        return { success: false, error: 'Registration is closed. Only existing admins can create new accounts.' };
    }

    // Check duplicate email
    const existing = await rawQuery(ds, `SELECT id FROM "${TABLE}" WHERE email = ?`, [input.email.toLowerCase()]);
    if (existing.length > 0) {
        return { success: false, error: 'An admin with this email already exists.' };
    }

    // Create admin
    const auth = getAuth();
    const hashedPassword = await auth.hashPassword(input.password);
    const role = count === 0 ? 'super_admin' : 'admin';

    const id = await dbInsert(ds, TABLE, {
        email: input.email.toLowerCase(),
        password: hashedPassword,
        name: input.name.trim(),
        role,
    });

    Logger.info(`✦ Admin registered: ${input.email} (${role})`);

    return {
        success: true,
        admin: { id, email: input.email.toLowerCase(), name: input.name.trim(), role },
    };
}

// ══════════════════════════════════════════════════════════════
// Login — Authenticate admin
// ══════════════════════════════════════════════════════════════

export async function loginAdmin(
    email: string,
    password: string,
    ip: string
): Promise<{ success: boolean; error?: string; token?: string; admin?: any }> {
    // IP-based rate limiting
    const now = Date.now();
    const ipKey = `login:${ip}`;
    const attempt = loginAttempts.get(ipKey);

    if (attempt && attempt.count >= MAX_FAILED_ATTEMPTS && now < attempt.resetAt) {
        const waitSec = Math.ceil((attempt.resetAt - now) / 1000);
        return { success: false, error: `Too many login attempts. Try again in ${waitSec} seconds.` };
    }

    const ds = await getDS();
    if (!ds) return { success: false, error: 'Database not connected.' };

    const rows = await rawQuery(ds, `SELECT * FROM "${TABLE}" WHERE email = ?`, [email.toLowerCase()]);
    const admin = rows[0] ?? null;
    if (!admin) {
        trackFailedAttempt(ipKey);
        return { success: false, error: 'Invalid email or password.' };
    }

    // Check account lockout
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
        const waitSec = Math.ceil((new Date(admin.locked_until).getTime() - now) / 1000);
        return { success: false, error: `Account locked. Try again in ${waitSec} seconds.` };
    }

    // Verify password
    const auth = getAuth();
    const valid = await auth.checkPassword(password, admin.password);

    if (!valid) {
        trackFailedAttempt(ipKey);

        // Update DB failed attempts
        const newAttempts = (admin.failed_attempts || 0) + 1;
        const failUpdates: Record<string, any> = { failed_attempts: newAttempts };

        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
            failUpdates.locked_until = new Date(now + LOCKOUT_MINUTES * 60 * 1000).toISOString();
            Logger.warn(`⚠ Admin account locked: ${email} (${MAX_FAILED_ATTEMPTS} failed attempts)`);
        }

        await dbUpdate(ds, TABLE, { id: admin.id }, failUpdates);
        return { success: false, error: 'Invalid email or password.' };
    }

    // Success — reset failed attempts, update audit trail
    await dbUpdate(ds, TABLE, { id: admin.id }, {
        failed_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
        last_login_ip: ip,
    });

    // Clear IP rate limit
    loginAttempts.delete(ipKey);

    // Generate JWT with full admin payload
    const secret = env('JWT_SECRET', 'your-secret-key');
    const token = jwt.sign(
        { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
        secret,
        { expiresIn: '24h' }
    );

    Logger.info(`✦ Admin login: ${email} from ${ip}`);

    return {
        success: true,
        token,
        admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    };
}

// ══════════════════════════════════════════════════════════════
// Verify — Validate JWT and confirm admin exists
// ══════════════════════════════════════════════════════════════

export async function verifyAdminToken(token: string): Promise<{ valid: boolean; admin?: any; error?: string }> {
    try {
        const secret = env('JWT_SECRET', 'your-secret-key');
        const decoded = jwt.verify(token, secret) as any;

        // Confirm admin still exists in DB
        const ds = await getDS();
        if (!ds) return { valid: false, error: 'Database not connected.' };

        const rows = await rawQuery(ds, `SELECT id, email, name, role FROM "${TABLE}" WHERE id = ?`, [decoded.id]);
        const admin = rows[0] ?? null;

        if (!admin) return { valid: false, error: 'Admin account no longer exists.' };

        return { valid: true, admin };
    } catch {
        return { valid: false, error: 'Invalid or expired token.' };
    }
}

// ── Helpers ─────────────────────────────────────────────────

function trackFailedAttempt(key: string): void {
    const now = Date.now();
    const existing = loginAttempts.get(key);

    if (!existing || now > existing.resetAt) {
        loginAttempts.set(key, { count: 1, resetAt: now + LOCKOUT_MINUTES * 60 * 1000 });
    } else {
        existing.count++;
    }
}

// Periodic cleanup
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of loginAttempts) {
        if (now > val.resetAt) loginAttempts.delete(key);
    }
}, 60_000);
