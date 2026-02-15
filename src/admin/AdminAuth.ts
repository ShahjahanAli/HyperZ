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

// ── Helper: get Knex instance (may not be available) ─────────

async function getKnex() {
    try {
        const { Database } = await import('../database/Database.js');
        if (Database.isSQLConnected()) return Database.getKnex();

        // Attempt to connect if environment is ready
        const { default: dbConfig } = await import('../../config/database.js');
        const driver = env('DB_DRIVER', dbConfig.driver || 'sqlite');
        const connConfig = (dbConfig.connections as any)[driver];

        if (connConfig) {
            return await Database.connectSQL(connConfig);
        }
        return null;
    } catch {
        return null;
    }
}

// ══════════════════════════════════════════════════════════════
// Status — Check system readiness
// ══════════════════════════════════════════════════════════════

export interface AdminStatus {
    dbConnected: boolean;
    tableExists: boolean;
    hasAdmin: boolean;
    adminCount: number;
}

export async function getAdminStatus(): Promise<AdminStatus> {
    const knex = await getKnex();
    if (!knex) {
        return { dbConnected: false, tableExists: false, hasAdmin: false, adminCount: 0 };
    }

    try {
        const tableExists = await knex.schema.hasTable(TABLE);
        if (!tableExists) {
            return { dbConnected: true, tableExists: false, hasAdmin: false, adminCount: 0 };
        }

        const result = await knex(TABLE).count('id as count').first();
        const adminCount = Number(result?.count || 0);

        return { dbConnected: true, tableExists: true, hasAdmin: adminCount > 0, adminCount };
    } catch {
        return { dbConnected: true, tableExists: false, hasAdmin: false, adminCount: 0 };
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
    const knex = await getKnex();
    if (!knex) return { success: false, error: 'Database not connected. Configure your database in .env first.' };

    const tableExists = await knex.schema.hasTable(TABLE);
    if (!tableExists) return { success: false, error: 'Admin table does not exist. Run migrations first: npx tsx bin/hyperz.ts migrate' };

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
    const existingCount = await knex(TABLE).count('id as count').first();
    const count = Number(existingCount?.count || 0);

    if (count > 0 && !callerIsAdmin) {
        return { success: false, error: 'Registration is closed. Only existing admins can create new accounts.' };
    }

    // Check duplicate email
    const existing = await knex(TABLE).where('email', input.email.toLowerCase()).first();
    if (existing) {
        return { success: false, error: 'An admin with this email already exists.' };
    }

    // Create admin
    const auth = getAuth();
    const hashedPassword = await auth.hashPassword(input.password);

    const [id] = await knex(TABLE).insert({
        email: input.email.toLowerCase(),
        password: hashedPassword,
        name: input.name.trim(),
        role: count === 0 ? 'super_admin' : 'admin',
    });

    Logger.info(`✦ Admin registered: ${input.email} (${count === 0 ? 'super_admin' : 'admin'})`);

    return {
        success: true,
        admin: { id, email: input.email.toLowerCase(), name: input.name.trim(), role: count === 0 ? 'super_admin' : 'admin' },
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

    const knex = await getKnex();
    if (!knex) return { success: false, error: 'Database not connected.' };

    const admin = await knex(TABLE).where('email', email.toLowerCase()).first();
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
        const updates: any = { failed_attempts: newAttempts };

        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
            updates.locked_until = new Date(now + LOCKOUT_MINUTES * 60 * 1000);
            Logger.warn(`⚠ Admin account locked: ${email} (${MAX_FAILED_ATTEMPTS} failed attempts)`);
        }

        await knex(TABLE).where('id', admin.id).update(updates);
        return { success: false, error: 'Invalid email or password.' };
    }

    // Success — reset failed attempts, update audit trail
    await knex(TABLE).where('id', admin.id).update({
        failed_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
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
        const knex = await getKnex();
        if (!knex) return { valid: false, error: 'Database not connected.' };

        const admin = await knex(TABLE)
            .select('id', 'email', 'name', 'role')
            .where('id', decoded.id)
            .first();

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
