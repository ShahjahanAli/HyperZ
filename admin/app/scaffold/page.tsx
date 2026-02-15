'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

const API = '/api/_admin';

const scaffoldTypes = [
    { value: 'resource', label: 'Full Resource', icon: '🚀', dir: 'Multiple', example: 'Post', hasMigration: false, description: 'Creates Model, Migration, Controller, and Route File.' },
    { value: 'controller', label: 'Controller', icon: '🎮', dir: 'app/controllers/', example: 'UserController' },
    { value: 'model', label: 'Model', icon: '📦', dir: 'app/models/', example: 'User', hasMigration: true },
    { value: 'migration', label: 'Migration', icon: '📝', dir: 'database/migrations/', example: 'create_posts_table' },
    { value: 'seeder', label: 'Seeder', icon: '🌱', dir: 'database/seeders/', example: 'UserSeeder' },
    { value: 'middleware', label: 'Middleware', icon: '🛡️', dir: 'app/middleware/', example: 'RateLimiter' },
    { value: 'route', label: 'Route File', icon: '🛤️', dir: 'app/routes/', example: 'admin' },
    { value: 'job', label: 'Queue Job', icon: '⚡', dir: 'app/jobs/', example: 'SendWelcomeEmail' },
    { value: 'factory', label: 'Factory', icon: '🏭', dir: 'database/factories/', example: 'UserFactory' },
];

export default function ScaffoldPage() {
    const [type, setType] = useState('controller');
    const [name, setName] = useState('');
    const [withMigration, setWithMigration] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const selected = scaffoldTypes.find(s => s.value === type)!;

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await adminFetch(`${API}/scaffold/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), withMigration }),
            });
            const data = await res.json();
            setResult(data);
            if (data.success) setName('');
        } catch (err: any) {
            setResult({ error: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="topbar">
                <h1>🏗️ Scaffolding</h1>
                <span className="topbar-meta">Create resources via the HyperZ CLI engine</span>
            </div>

            <div className="page-content">
                {/* Type selector grid */}
                <div className="card-grid" style={{ marginBottom: 24 }}>
                    {scaffoldTypes.map(s => (
                        <div
                            key={s.value}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                borderColor: type === s.value ? 'var(--accent)' : undefined,
                                background: type === s.value ? 'var(--accent-glow)' : undefined,
                            }}
                            onClick={() => { setType(s.value); setResult(null); }}
                        >
                            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                            <div style={{ fontWeight: 600 }}>{s.label}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.dir}</div>
                        </div>
                    ))}
                </div>

                {/* Create form */}
                <div className="card" style={{ maxWidth: 600 }}>
                    <div className="card-header">Create {selected.label}</div>

                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            className="form-input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={`e.g. ${selected.example}`}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        />
                    </div>

                    {selected.hasMigration && (
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                                <input type="checkbox" checked={withMigration} onChange={e => setWithMigration(e.target.checked)} />
                                Also create migration
                            </label>
                        </div>
                    )}

                    <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !name.trim()}>
                        {loading ? '⏳ Creating...' : `✨ Create ${selected.label}`}
                    </button>

                    {result && (
                        <div style={{ marginTop: 16 }}>
                            {result.success ? (
                                <div style={{ color: 'var(--green)', fontSize: 14 }}>
                                    ✅ Created successfully:
                                    {result.created?.map((f: string) => (
                                        <div key={f} style={{ fontFamily: 'var(--mono)', fontSize: 13, marginTop: 4, paddingLeft: 16 }}>
                                            → {f}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: 'var(--red)', fontSize: 14 }}>❌ {result.error}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
