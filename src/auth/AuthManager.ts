// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Auth Manager
// ──────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../support/helpers.js';

export interface AuthUser {
    id: number | string;
    email: string;
    [key: string]: any;
}

export class AuthManager {
    private secret: string;
    private expiration: string;
    private saltRounds: number;

    constructor() {
        this.secret = env('JWT_SECRET', 'your-secret-key');
        this.expiration = env('JWT_EXPIRATION', '7d');
        this.saltRounds = 10;
    }

    /**
     * Generate JWT token for a user.
     */
    generateToken(user: AuthUser, expiresIn?: string): string {
        return jwt.sign(
            { id: user.id, email: user.email },
            this.secret,
            { expiresIn: (expiresIn ?? this.expiration) as any }
        );
    }

    /**
     * Verify and decode a JWT token.
     */
    verifyToken(token: string): AuthUser {
        return jwt.verify(token, this.secret) as AuthUser;
    }

    /**
     * Hash a password.
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Compare password against hash.
     */
    async checkPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Attempt login — find user, check password, return token.
     * (Pass in your own user lookup function.)
     */
    async attempt(
        credentials: { email: string; password: string },
        findUser: (email: string) => Promise<(AuthUser & { password: string }) | null>
    ): Promise<{ user: AuthUser; token: string } | null> {
        const user = await findUser(credentials.email);
        if (!user) return null;

        const valid = await this.checkPassword(credentials.password, user.password);
        if (!valid) return null;

        const { password, ...safeUser } = user;
        const token = this.generateToken(safeUser);

        return { user: safeUser, token };
    }
}
