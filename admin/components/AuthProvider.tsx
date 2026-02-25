'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────

interface Admin {
    id: number;
    email: string;
    name: string;
    role: string;
}

interface AdminStatus {
    keysConfigured: boolean;
    dbConnected: boolean;
    tableExists: boolean;
    hasAdmin: boolean;
    adminCount: number;
    driver?: string;
    connectionInfo?: string;
}

interface AuthContextType {
    token: string | null;
    admin: Admin | null;
    status: AdminStatus | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API = '/api/_admin';
const TOKEN_KEY = 'hyperz_admin_token';

// ── Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [status, setStatus] = useState<AdminStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch system status
    const refreshStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API}/auth/status`);
            if (res.ok) {
                setStatus(await res.json());
            }
        } catch {
            setStatus({ keysConfigured: false, dbConnected: false, tableExists: false, hasAdmin: false, adminCount: 0 });
        }
    }, []);

    // Validate existing token on mount
    useEffect(() => {
        async function init() {
            await refreshStatus();

            const stored = localStorage.getItem(TOKEN_KEY);
            if (stored) {
                try {
                    const res = await fetch(`${API}/auth/me`, {
                        headers: { Authorization: `Bearer ${stored}` },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setToken(stored);
                        setAdmin(data.admin);
                    } else {
                        localStorage.removeItem(TOKEN_KEY);
                    }
                } catch {
                    localStorage.removeItem(TOKEN_KEY);
                }
            }

            setIsLoading(false);
        }
        init();
    }, [refreshStatus]);

    // Login
    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Login failed' };
            }

            localStorage.setItem(TOKEN_KEY, data.token);
            setToken(data.token);
            setAdmin(data.admin);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: 'Network error. Is HyperZ running?' };
        }
    }, []);

    // Register
    const register = useCallback(async (email: string, password: string, name: string) => {
        try {
            const res = await fetch(`${API}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Registration failed' };
            }

            if (data.token) {
                localStorage.setItem(TOKEN_KEY, data.token);
                setToken(data.token);
                setAdmin(data.admin);
            }

            await refreshStatus();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: 'Network error. Is HyperZ running?' };
        }
    }, [refreshStatus]);

    // Logout
    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setAdmin(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            token, admin, status,
            isAuthenticated: !!token && !!admin,
            isLoading,
            login, register, logout, refreshStatus,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// ── Hook ──────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
