'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';

// ══════════════════════════════════════════════════════════════
// HyperZ Admin — Landing Page
// Step flow:
//   1. keys_missing  → run `npx hyperz key:generate`
//   2. db_setup      → configure DB in .env & restart server
//   3. migrate       → run `npx hyperz migrate`
//   4. register      → create first admin account
//   5. login         → sign in
// ══════════════════════════════════════════════════════════════

const FEATURES = [
    { icon: '🏗️', name: 'MVC Architecture', desc: 'Laravel-inspired project structure' },
    { icon: '🛤️', name: 'Elegant Routing', desc: 'Express routes with middleware chains' },
    { icon: '🗄️', name: 'Database ORM', desc: 'TypeORM Active Record + migrations' },
    { icon: '🔐', name: 'Auth & JWT', desc: 'bcrypt hashing, JWT tokens, RBAC' },
    { icon: '✅', name: 'Validation', desc: 'Request validation with Joi/Zod' },
    { icon: '📧', name: 'Mail Provider', desc: 'Nodemailer + multi-driver support' },
    { icon: '💾', name: 'Cache & Queue', desc: 'Redis cache + BullMQ job queues' },
    { icon: '📁', name: 'Storage', desc: 'Local filesystem + AWS S3 drivers' },
    { icon: '🌐', name: 'WebSocket', desc: 'Socket.io real-time channels' },
    { icon: '🤖', name: 'AI Gateway', desc: 'OpenAI, Anthropic, Google AI unified API' },
    { icon: '🎮', name: 'API Playground', desc: 'Built-in Postman-like testing UI' },
    { icon: '🔌', name: 'MCP Server', desc: '13 tools, 6 resources, 4 prompts' },
    { icon: '📖', name: 'Swagger/OpenAPI', desc: 'Auto-generated API docs' },
    { icon: '🛡️', name: 'Rate Limiting', desc: 'Per-user/API-key throttling tiers' },
    { icon: '📈', name: 'Monitoring', desc: 'Real-time CPU/memory/latency dashboard' },
    { icon: '🔮', name: 'GraphQL', desc: 'Auto-generated schema from models' },
    { icon: '🌍', name: 'i18n', desc: 'Multi-language localization support' },
    { icon: '🧪', name: 'Testing', desc: 'Vitest + HTTP test client' },
    { icon: '⏰', name: 'Scheduler', desc: 'Cron-like task scheduler' },
    { icon: '📝', name: 'Logging', desc: 'Pino-powered structured logging' },
    { icon: '🔁', name: 'Tinker REPL', desc: 'Interactive console with app context' },
    { icon: '🏭', name: 'Factories', desc: 'Faker-ready test data generation' },
    { icon: '🔌', name: 'Plugins', desc: 'Auto-discovery plugin manager' },
    { icon: '🐳', name: 'Docker', desc: 'Production-ready containers' },
];

const TECH_STACK = [
    { name: 'TypeScript', color: '#3178c6' },
    { name: 'Express.js', color: '#22c55e' },
    { name: 'Node.js', color: '#68a063' },
    { name: 'TypeORM', color: '#e97627' },
    { name: 'JWT', color: '#d63aff' },
    { name: 'bcrypt', color: '#ef4444' },
    { name: 'Socket.io', color: '#25c2a0' },
    { name: 'Pino', color: '#eab308' },
    { name: 'Next.js', color: '#e2e8f0' },
    { name: 'Docker', color: '#2496ed' },
];

export default function LandingPage() {
    const { status, login, register, refreshStatus } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [form, setForm] = useState({ email: '', password: '', name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [checking, setChecking] = useState(false);
    const [pollCountdown, setPollCountdown] = useState(5);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Step derivation ────────────────────────────────────────
    // Priority: loading → keys_missing → db_setup → migrate → register → login
    const step = !status
        ? 'loading'
        : !status.keysConfigured
            ? 'keys_missing'
            : !status.dbConnected
                ? 'db_setup'
                : !status.tableExists
                    ? 'migrate'
                    : !status.hasAdmin
                        ? 'register'
                        : 'login';

    // ── Auto-poll on all setup steps ──────────────────────────
    useEffect(() => {
        const shouldPoll = step === 'keys_missing' || step === 'db_setup' || step === 'migrate';

        if (shouldPoll) {
            setPollCountdown(5);

            countdownRef.current = setInterval(() => {
                setPollCountdown(prev => (prev <= 1 ? 5 : prev - 1));
            }, 1000);

            pollRef.current = setInterval(async () => {
                setPollCountdown(5);
                await refreshStatus();
            }, 5000);
        }

        return () => {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        };
    }, [step, refreshStatus]);

    const effectiveMode = step === 'register' ? 'register' : mode;

    const handleRefresh = async () => {
        setChecking(true);
        setPollCountdown(5);
        await refreshStatus();
        setChecking(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (effectiveMode === 'register') {
                const result = await register(form.email, form.password, form.name);
                if (!result.success) setError(result.error || 'Registration failed');
            } else {
                const result = await login(form.email, form.password);
                if (!result.success) setError(result.error || 'Login failed');
            }
        } catch {
            setError('An unexpected error occurred');
        }
        setLoading(false);
    };

    // ── Step progress config ──────────────────────────────────
    const STEPS = [
        { id: 'keys_missing', num: '1', label: 'Security Keys',  desc: 'npx hyperz key:generate',          icon: '🔑' },
        { id: 'db_setup',     num: '2', label: 'Database',        desc: 'Configure .env & restart server',  icon: '🗄️' },
        { id: 'migrate',      num: '3', label: 'Migrations',      desc: 'npx hyperz migrate',               icon: '🔄' },
        { id: 'register',     num: '4', label: 'Admin Account',   desc: 'Create first admin account',       icon: '🛡️' },
        { id: 'login',        num: '5', label: 'Ready',           desc: 'Access the full admin panel',      icon: '🚀' },
    ] as const;

    const stepOrder = ['loading', 'keys_missing', 'db_setup', 'migrate', 'register', 'login'] as const;
    const stepIndex = stepOrder.indexOf(step as typeof stepOrder[number]);

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '40px 20px', overflowY: 'auto',
        }}>
            {/* ── Hero ─────────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 800 }}>
                <div style={{
                    fontSize: 72, fontWeight: 900, lineHeight: 1, marginBottom: 16,
                    fontFamily: 'var(--tactical)',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary), #22c55e)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    letterSpacing: '-2px',
                }}>
                    HYPERZ
                </div>
                <div style={{
                    fontSize: 12, color: 'var(--accent-secondary)', marginBottom: 12, letterSpacing: 6,
                    textTransform: 'uppercase', fontWeight: 800, fontFamily: 'var(--tactical)',
                }}>
                    TACTICAL ORCHESTRATION INTERFACE
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.8, maxWidth: 520, margin: '0 auto' }}>
                    High-fidelity MVC architecture with autonomous AI capabilities.
                    <br />
                    <span style={{ color: 'var(--text)', opacity: 0.8 }}>Enterprise-grade framework for mission-critical API services.</span>
                </p>
            </div>

            {/* ── Main grid ────────────────────────────────── */}
            <div style={{
                display: 'grid', gridTemplateColumns: '460px 1fr', gap: 40,
                width: '100%', maxWidth: 1200, marginBottom: 64, alignItems: 'start',
            }}>

                {/* ── Left: Setup / Auth panel ─────────────── */}
                <div style={{ position: 'sticky', top: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Progress tracker */}
                    {step !== 'loading' && step !== 'login' && (
                        <div className="card" style={{ padding: '20px 24px' }}>
                            <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'var(--tactical)', marginBottom: 14 }}>
                                SETUP PROGRESS
                            </div>
                            <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                                {STEPS.map((s, i) => {
                                    const sIndex = stepOrder.indexOf(s.id as typeof stepOrder[number]);
                                    const done = sIndex < stepIndex;
                                    const active = s.id === step;
                                    return (
                                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: '50%', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: 13,
                                                    fontWeight: 700, flexShrink: 0,
                                                    background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--bg-input)',
                                                    border: `2px solid ${done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border)'}`,
                                                    color: done || active ? '#fff' : 'var(--text-muted)',
                                                    boxShadow: active ? '0 0 12px var(--accent-glow)' : 'none',
                                                    transition: 'all 0.3s',
                                                }}>
                                                    {done ? '✓' : s.num}
                                                </div>
                                                <div style={{
                                                    fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
                                                    color: active ? 'var(--accent)' : done ? 'var(--green)' : 'var(--text-muted)',
                                                    textTransform: 'uppercase', textAlign: 'center', maxWidth: 52, lineHeight: 1.2,
                                                    fontFamily: 'var(--tactical)',
                                                }}>
                                                    {s.label}
                                                </div>
                                            </div>
                                            {i < STEPS.length - 1 && (
                                                <div style={{
                                                    flex: 1, height: 2, marginBottom: 16, marginInline: 4,
                                                    background: sIndex < stepIndex ? 'var(--green)' : 'var(--border)',
                                                    transition: 'background 0.3s',
                                                }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Step panels ──────────────────────── */}
                    <div className="card" style={{ padding: 36 }}>

                        {/* LOADING */}
                        {step === 'loading' && (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }} className="loading">⚡</div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>SCANNING SYSTEM INTEGRITY…</div>
                            </div>
                        )}

                        {/* STEP 1 — KEYS MISSING */}
                        {step === 'keys_missing' && (
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                    <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginBottom: 4, fontFamily: 'var(--tactical)' }}>
                                        CRYPTOGRAPHIC KEYS REQUIRED
                                    </h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--mono)' }}>
                                        APP_KEY AND JWT_SECRET NOT CONFIGURED
                                    </p>
                                </div>

                                <div style={{
                                    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
                                    borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--red)',
                                }}>
                                    ⚠️ <strong>APP_KEY</strong> and/or <strong>JWT_SECRET</strong> are missing or set to default values in your <code>.env</code> file. These keys are required to encrypt data and sign tokens.
                                </div>

                                {/* Command */}
                                <div style={{
                                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                                    borderRadius: 8, padding: 20, marginBottom: 16,
                                }}>
                                    <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--tactical)' }}>
                                        PROTOCOL 01 — RUN IN YOUR TERMINAL
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent-secondary)',
                                        background: 'rgba(0,0,0,0.35)', borderRadius: 4, padding: '12px 16px',
                                        border: '1px solid var(--border)', letterSpacing: 0.5,
                                    }}>
                                        npx hyperz key:generate
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
                                        This writes <code style={{ color: 'var(--accent)' }}>APP_KEY</code> and <code style={{ color: 'var(--accent)' }}>JWT_SECRET</code> to your <code>.env</code> file automatically.
                                    </div>
                                </div>

                                {/* Restart note */}
                                <div style={{
                                    background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.25)',
                                    borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#eab308',
                                }}>
                                    ⟳ After running the command, <strong>restart your HyperZ server</strong> — this page will automatically advance when the keys are detected.
                                </div>

                                <button onClick={handleRefresh} disabled={checking} style={{
                                    width: '100%', padding: '12px 20px', borderRadius: 8,
                                    background: 'linear-gradient(135deg, var(--accent), #6d28d9)',
                                    color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                                    fontSize: 14, opacity: checking ? 0.6 : 1,
                                }}>
                                    {checking ? '⏳ Checking…' : '🔄 Re-check Keys'}
                                </button>
                                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                                    AUTO-SCANNING IN {pollCountdown}s…
                                </div>
                            </div>
                        )}

                        {/* STEP 2a — DB NOT CONNECTED */}
                        {step === 'db_setup' && (
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                    <div style={{ fontSize: 40, marginBottom: 8 }}>🗄️</div>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--tactical)' }}>
                                        DATABASE CONNECTION
                                    </h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--mono)' }}>
                                        CONFIGURE DATABASE CREDENTIALS IN .ENV
                                    </p>
                                </div>

                                {/* Keys confirmed */}
                                <div style={{ marginBottom: 16, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>✓</span>
                                    <span>Security keys detected — APP_KEY and JWT_SECRET are configured.</span>
                                </div>

                                <div style={{
                                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                                    borderRadius: 8, padding: 20, marginBottom: 12,
                                }}>
                                    <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--tactical)' }}>
                                        SET IN YOUR .ENV FILE
                                    </div>
                                    <pre style={{
                                        fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)',
                                        lineHeight: 1.8, whiteSpace: 'pre', margin: 0,
                                    }}>{`DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=your_database
DB_USER=root
DB_PASSWORD=secret`}</pre>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                                        Supported drivers: <strong>mysql</strong> · <strong>postgresql</strong> · <strong>sqlite</strong>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--red)',
                                }}>
                                    ⚠️ After editing <strong>.env</strong>, you must <strong>restart the HyperZ server</strong> for the new DB config to take effect.
                                </div>

                                <button onClick={handleRefresh} disabled={checking} style={{
                                    width: '100%', padding: '12px 20px', borderRadius: 8,
                                    background: 'linear-gradient(135deg, var(--accent), #6d28d9)',
                                    color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                                    fontSize: 14, opacity: checking ? 0.6 : 1,
                                }}>
                                    {checking ? '⏳ Checking…' : '🔄 Check Connection'}
                                </button>
                                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                                    AUTO-POLLING IN {pollCountdown}s…
                                </div>
                            </div>
                        )}

                        {/* STEP 2b — DB CONNECTED, TABLE MISSING */}
                        {step === 'migrate' && (
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                    <div style={{ fontSize: 40, marginBottom: 8 }}>⚔️</div>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', marginBottom: 4, fontFamily: 'var(--tactical)' }}>
                                        DATABASE CONNECTED
                                    </h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--mono)' }}>
                                        RUN MIGRATIONS TO CREATE SCHEMA
                                    </p>
                                </div>

                                {/* Keys + DB confirmed */}
                                <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[
                                        '✓  Security keys configured',
                                        `✓  Database connected · ${status?.driver || 'unknown'} · ${status?.connectionInfo || ''}`,
                                    ].map(msg => (
                                        <div key={msg} style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--green)' }}>
                                            {msg}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 12 }}>
                                    <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--tactical)' }}>
                                        RUN IN YOUR TERMINAL
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--cyan)',
                                        background: 'rgba(0,0,0,0.35)', borderRadius: 4, padding: '12px 16px',
                                        border: '1px solid var(--border)',
                                    }}>
                                        npx hyperz migrate
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
                                        Creates the <code style={{ color: 'var(--accent)' }}>hyperz_admins</code> table and all other pending migrations. This page will automatically advance once the table is detected.
                                    </div>
                                </div>

                                <button onClick={handleRefresh} disabled={checking} style={{
                                    width: '100%', padding: '12px 20px', borderRadius: 8,
                                    background: 'linear-gradient(135deg, var(--accent), #6d28d9)',
                                    color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                                    fontSize: 14, opacity: checking ? 0.6 : 1,
                                }}>
                                    {checking ? '⏳ Checking…' : '🔄 Check for Table'}
                                </button>
                                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                                    AUTO-DETECTING MIGRATION… {pollCountdown}s
                                </div>
                            </div>
                        )}

                        {/* STEP 3 — REGISTER / LOGIN */}
                        {(step === 'register' || step === 'login') && (
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                                    <div style={{ fontSize: 40, marginBottom: 8, filter: 'drop-shadow(0 0 10px var(--accent-glow))' }}>
                                        {effectiveMode === 'register' ? '🛡️' : '🔒'}
                                    </div>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--tactical)' }}>
                                        {effectiveMode === 'register' ? 'INITIALIZE ADMIN' : 'AUTHORIZED ACCESS'}
                                    </h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--mono)' }}>
                                        {effectiveMode === 'register'
                                            ? 'ESTABLISHING PRIMARY OVERLORD ACCOUNT'
                                            : 'VERIFYING SECURITY CREDENTIALS'}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {effectiveMode === 'register' && (
                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{
                                                display: 'block', fontSize: 10, textTransform: 'uppercase',
                                                letterSpacing: 2, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, fontFamily: 'var(--tactical)',
                                            }}>OPERATOR_NAME</label>
                                            <input
                                                type="text" required value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                                placeholder="John Doe"
                                                style={{
                                                    width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
                                                    borderRadius: 8, color: 'var(--text)', padding: '11px 14px',
                                                    fontSize: 14, outline: 'none', boxSizing: 'border-box',
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{
                                            display: 'block', fontSize: 11, textTransform: 'uppercase',
                                            letterSpacing: 1, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6,
                                        }}>Email Address</label>
                                        <input
                                            type="email" required value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            placeholder="admin@example.com"
                                            style={{
                                                width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
                                                borderRadius: 8, color: 'var(--text)', padding: '11px 14px',
                                                fontSize: 14, outline: 'none', boxSizing: 'border-box',
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{
                                            display: 'block', fontSize: 11, textTransform: 'uppercase',
                                            letterSpacing: 1, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6,
                                        }}>Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showPassword ? 'text' : 'password'} required
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                                placeholder={effectiveMode === 'register' ? 'Min 8 chars, uppercase + number' : '••••••••'}
                                                minLength={effectiveMode === 'register' ? 8 : undefined}
                                                style={{
                                                    width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
                                                    borderRadius: 8, color: 'var(--text)', padding: '11px 44px 11px 14px',
                                                    fontSize: 14, outline: 'none', boxSizing: 'border-box',
                                                }}
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4,
                                            }}>
                                                {showPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                        {effectiveMode === 'register' && (
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                                                Must contain uppercase, lowercase, and a number
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <div style={{
                                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                                            color: 'var(--red)', fontSize: 13,
                                        }}>
                                            ⚠️ {error}
                                        </div>
                                    )}

                                    <button type="submit" disabled={loading} style={{
                                        width: '100%', padding: '13px 20px', borderRadius: 8,
                                        background: 'linear-gradient(135deg, var(--accent), #6d28d9)',
                                        color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                                        fontSize: 15, opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
                                    }}>
                                        {loading
                                            ? '⏳ Please wait…'
                                            : effectiveMode === 'register' ? '🛡️ Create Admin Account' : '🔐 Sign In'}
                                    </button>
                                </form>

                                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                                        <span>Database: {status?.driver || 'unknown'}</span>
                                        <span>{status?.connectionInfo || ''}</span>
                                    </div>
                                </div>

                                {step === 'login' && (
                                    <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                                        Protected by bcrypt + JWT · 24h session
                                    </div>
                                )}
                                {step === 'register' && (
                                    <div style={{
                                        marginTop: 14, background: 'rgba(34,197,94,0.08)',
                                        border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8,
                                        padding: '10px 14px', fontSize: 12, color: 'var(--green)',
                                    }}>
                                        🔒 One-time setup. Registration is locked after your first admin is created.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Feature grid + Tech + Security ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Setup checklist (mirrors left panel progress for reference) */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--tactical)' }}>
                            // DEPLOYMENT_SEQUENCE
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {STEPS.map(s => {
                                const sIndex = stepOrder.indexOf(s.id as typeof stepOrder[number]);
                                const done = sIndex < stepIndex;
                                const active = s.id === step;
                                return (
                                    <div key={s.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '10px 14px', borderRadius: 8,
                                        background: active ? 'var(--accent-glow)' : done ? 'rgba(34,197,94,0.05)' : 'var(--bg-input)',
                                        border: `1px solid ${active ? 'var(--accent)' : done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                                        opacity: done || active ? 1 : 0.5,
                                        transition: 'all 0.3s',
                                    }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '50%', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            fontSize: done ? 13 : 14,
                                            background: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border)',
                                            color: '#fff',
                                        }}>
                                            {done ? '✓' : s.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--accent)' : done ? 'var(--green)' : 'var(--text)' }}>
                                                {s.num}. {s.label}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{s.desc}</div>
                                        </div>
                                        {active && (
                                            <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--tactical)', letterSpacing: 1, flexShrink: 0 }}>
                                                ← CURRENT
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feature Grid */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--tactical)' }}>
                            // SYSTEM_CAPABILITIES [24_MODULES_ONLINE]
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {FEATURES.map(f => (
                                <div key={f.name} style={{
                                    background: 'var(--bg-input)', borderRadius: 8, padding: '10px 12px',
                                    border: '1px solid var(--border)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                        <span style={{ fontSize: 14 }}>{f.icon}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{f.name}</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 22 }}>{f.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 28 }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--tactical)' }}>
                            // CORE_TECHNOLOGY_STACK
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {TECH_STACK.map(t => (
                                <span key={t.name} style={{
                                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                    background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30`,
                                }}>
                                    {t.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Security */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 28 }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: '#ff4444', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--tactical)' }}>
                            // SECURITY_PROTOCOLS [ACTIVE]
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {[
                                { label: 'Password Hashing', value: 'bcrypt (10 rounds)' },
                                { label: 'Session Tokens', value: 'JWT HS256, 24h expiry' },
                                { label: 'Rate Limiting', value: '5 attempts / 15 min' },
                                { label: 'Account Lockout', value: '15 min after 5 failures' },
                                { label: 'Registration', value: 'Locked after first admin' },
                                { label: 'Token Validation', value: 'Verified against DB' },
                            ].map(s => (
                                <div key={s.label} style={{
                                    background: 'var(--bg-input)', borderRadius: 8, padding: '10px 12px',
                                    border: '1px solid var(--border)',
                                }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 16 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>HyperZ Framework</span> — Enterprise-grade API development, redefined.
            </div>
        </div>
    );
}
