'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

// ══════════════════════════════════════════════════════════════
// HyperZ Admin — Landing Page
// Shows features, tech stack, setup guide, and auth forms
// based on system readiness status.
// ══════════════════════════════════════════════════════════════

const FEATURES = [
    { icon: '🏗️', name: 'MVC Architecture', desc: 'Laravel-inspired project structure' },
    { icon: '🛤️', name: 'Elegant Routing', desc: 'Express routes with middleware chains' },
    { icon: '🗄️', name: 'Database ORM', desc: 'Knex query builder + migrations' },
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
    { name: 'Knex.js', color: '#e97627' },
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

    // Determine which step to show
    const step = !status
        ? 'loading'
        : !status.dbConnected
            ? 'db_setup'
            : !status.tableExists
                ? 'migrate'
                : !status.hasAdmin
                    ? 'register'
                    : 'login';

    // Auto-set mode based on step
    const effectiveMode = step === 'register' ? 'register' : mode;

    const handleCheckConnection = async () => {
        setChecking(true);
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

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '40px 20px', overflowY: 'auto',
        }}>
            {/* ── Hero ───────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 700 }}>
                <div style={{
                    fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginBottom: 8,
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4, #22c55e)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    ⚡ HyperZ
                </div>
                <div style={{
                    fontSize: 16, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 3,
                    textTransform: 'uppercase', fontWeight: 600,
                }}>
                    Admin Panel
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
                    A modern, Laravel-inspired, enterprise-grade API framework built on Express.js & TypeScript.
                    Full MVC architecture with 27+ built-in features.
                </p>
            </div>

            {/* ── Main Grid: Auth Panel + Setup Guide ─── */}
            <div style={{
                display: 'grid', gridTemplateColumns: '420px 1fr', gap: 32,
                width: '100%', maxWidth: 1100, marginBottom: 48, alignItems: 'start',
            }}>
                {/* Auth Panel */}
                <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 16, padding: 32, position: 'sticky', top: 40,
                }}>
                    {step === 'loading' && (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }} className="loading">⚡</div>
                            <div>Checking system status…</div>
                        </div>
                    )}

                    {step === 'db_setup' && (
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>🗄️</div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                                    Getting Started
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                    Complete these steps to set up your admin panel
                                </p>
                            </div>

                            {/* Step 1: Generate Keys */}
                            <div style={{
                                background: 'var(--bg-input)', border: '1px solid var(--border)',
                                borderRadius: 10, padding: 16, marginBottom: 12,
                            }}>
                                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Step 1 — Generate Security Keys
                                </div>
                                <div style={{
                                    fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--cyan)',
                                    background: 'var(--bg)', borderRadius: 6, padding: '10px 14px',
                                    border: '1px solid var(--border)',
                                }}>
                                    npx tsx bin/hyperz.ts key:generate
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                                    Generates <strong style={{ color: 'var(--accent)' }}>APP_KEY</strong> and <strong style={{ color: 'var(--accent)' }}>JWT_SECRET</strong> in your .env file
                                </div>
                            </div>

                            {/* Step 2: Configure DB */}
                            <div style={{
                                background: 'var(--bg-input)', border: '1px solid var(--border)',
                                borderRadius: 10, padding: 16, marginBottom: 12,
                            }}>
                                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Step 2 — Configure Database in .env
                                </div>
                                <pre style={{
                                    fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)',
                                    lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0,
                                }}>
                                    {`DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=your_database
DB_USER=root
DB_PASSWORD=secret`}
                                </pre>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                                    Supported: <strong>mysql</strong>, <strong>postgresql</strong>, <strong>sqlite</strong>
                                </div>
                            </div>

                            {/* Restart Warning */}
                            <div style={{
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12, color: 'var(--red)',
                            }}>
                                ⚠️ After editing <strong>.env</strong>, you must <strong>restart the HyperZ server</strong> for changes to take effect.
                            </div>

                            <button onClick={handleCheckConnection} disabled={checking} style={{
                                width: '100%', padding: '12px 20px', borderRadius: 10,
                                background: 'linear-gradient(135deg, var(--accent), #6d28d9)',
                                color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                                fontSize: 14, opacity: checking ? 0.6 : 1,
                            }}>
                                {checking ? '⏳ Checking…' : '🔄 Check Connection'}
                            </button>
                        </div>
                    )}

                    {step === 'migrate' && (
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>
                                    Database Connected!
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                    Now run migrations to create the admin table
                                </p>
                            </div>

                            <div style={{
                                background: 'var(--bg-input)', border: '1px solid var(--border)',
                                borderRadius: 10, padding: 16, marginBottom: 16,
                            }}>
                                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Step 2 — Run Migrations
                                </div>
                                <div style={{
                                    fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--cyan)',
                                    background: 'var(--bg)', borderRadius: 6, padding: '10px 14px',
                                    border: '1px solid var(--border)',
                                }}>
                                    npx tsx bin/hyperz.ts migrate
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                                borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--blue)',
                                marginBottom: 12
                            }}>
                                ℹ️ This creates the <code style={{ color: 'var(--accent)' }}>hyperz_admins</code> table and all other pending migrations.
                            </div>

                            <div style={{
                                background: 'var(--bg-input)', border: '1px solid var(--border)',
                                borderRadius: 8, padding: 12, fontSize: 11, color: 'var(--text-muted)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span>Driver:</span>
                                    <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{status?.driver || 'unknown'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Connection:</span>
                                    <span style={{ color: 'var(--cyan)', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={status?.connectionInfo}>
                                        {status?.connectionInfo || 'none'}
                                    </span>
                                </div>
                            </div>

                            <button onClick={handleCheckConnection} disabled={checking} style={{
                                width: '100%', marginTop: 16, padding: '12px 20px', borderRadius: 10,
                                background: 'linear-gradient(135deg, var(--accent), #6d28d9)',
                                color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                                fontSize: 14, opacity: checking ? 0.6 : 1,
                            }}>
                                {checking ? '⏳ Checking…' : '🔄 Check Again'}
                            </button>
                        </div>
                    )}

                    {(step === 'register' || step === 'login') && (
                        <div>
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>
                                    {effectiveMode === 'register' ? '🛡️' : '🔐'}
                                </div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                                    {effectiveMode === 'register' ? 'Create Admin Account' : 'Admin Login'}
                                </h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                    {effectiveMode === 'register'
                                        ? 'Set up your first admin account to secure the panel'
                                        : 'Sign in to access the admin dashboard'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {effectiveMode === 'register' && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{
                                            display: 'block', fontSize: 11, textTransform: 'uppercase',
                                            letterSpacing: 1, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6,
                                        }}>Full Name</label>
                                        <input
                                            type="text" required value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            placeholder="John Doe"
                                            style={{
                                                width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
                                                borderRadius: 8, color: 'var(--text)', padding: '11px 14px',
                                                fontSize: 14, outline: 'none', fontFamily: 'var(--font)',
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
                                            fontSize: 14, outline: 'none', fontFamily: 'var(--font)',
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
                                                borderRadius: 8, color: 'var(--text)', padding: '11px 14px',
                                                fontSize: 14, outline: 'none', fontFamily: 'var(--font)',
                                                paddingRight: 44,
                                            }}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                                cursor: 'pointer', fontSize: 16, padding: 4,
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
                                    width: '100%', padding: '13px 20px', borderRadius: 10,
                                    background: 'linear-gradient(135deg, var(--accent), #6d28d9)',
                                    color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                                    fontSize: 15, opacity: loading ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                }}>
                                    {loading
                                        ? '⏳ Please wait…'
                                        : effectiveMode === 'register' ? '🛡️ Create Admin Account' : '🔐 Sign In'}
                                </button>
                            </form>

                            {/* Toggle login/register only if admin exists */}
                            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                                    <span>Database: {status?.driver || 'unknown'}</span>
                                    <span>Pool: SQL Connected</span>
                                </div>
                            </div>

                            {step === 'login' && (
                                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                                    Protected by bcrypt + JWT · 24h session
                                </div>
                            )}
                            {step === 'register' && (
                                <div style={{
                                    marginTop: 16, background: 'rgba(34,197,94,0.08)',
                                    border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8,
                                    padding: 12, fontSize: 12, color: 'var(--green)',
                                }}>
                                    🔒 This is a one-time setup. Registration will be locked after your first admin account is created.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Features + Tech + Guide */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Quick Start Guide */}
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 24,
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                            ⚡ Quick Start
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                                { step: '1', title: 'Generate Keys', desc: 'npx tsx bin/hyperz.ts key:generate', icon: '🔑', active: step === 'db_setup' },
                                { step: '2', title: 'Configure Database', desc: 'Set DB credentials in .env & restart', icon: '🗄️', active: step === 'db_setup' },
                                { step: '3', title: 'Run Migrations', desc: 'npx tsx bin/hyperz.ts migrate', icon: '🔄', active: step === 'migrate' },
                                { step: '4', title: 'Create Admin', desc: 'Register your first admin account', icon: '🛡️', active: step === 'register' },
                                { step: '5', title: 'Start Building', desc: 'Access the full admin panel', icon: '🚀', active: step === 'login' },
                            ].map(s => (
                                <div key={s.step} style={{
                                    background: s.active ? 'var(--accent-glow)' : 'var(--bg-input)',
                                    border: `1px solid ${s.active ? 'var(--accent)' : 'var(--border)'}`,
                                    borderRadius: 10, padding: 14,
                                    opacity: s.active ? 1 : 0.6,
                                    transition: 'all 0.3s',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <span style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: s.active ? 'var(--accent)' : 'var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 700, color: '#fff',
                                        }}>{s.step}</span>
                                        <span style={{ fontWeight: 600, fontSize: 13, color: s.active ? 'var(--accent)' : 'var(--text)' }}>
                                            {s.title}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 30 }}>
                                        {s.desc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feature Grid */}
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 24,
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                            🧩 27+ Built-in Features
                        </h3>
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                        }}>
                            {FEATURES.map(f => (
                                <div key={f.name} style={{
                                    background: 'var(--bg-input)', borderRadius: 8, padding: '10px 12px',
                                    border: '1px solid var(--border)', transition: 'border-color 0.2s',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                        <span style={{ fontSize: 14 }}>{f.icon}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{f.name}</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 22 }}>
                                        {f.desc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 24,
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                            🛠️ Technology Stack
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {TECH_STACK.map(t => (
                                <span key={t.name} style={{
                                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                    background: `${t.color}18`, color: t.color,
                                    border: `1px solid ${t.color}30`,
                                }}>
                                    {t.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Security Info */}
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 24,
                    }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                            🔒 Security Measures
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
