'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

const API = '/api/_admin';

const scaffoldTypes = [
    { value: 'resource', label: 'RESOURCE', icon: '🚀', description: 'Model + Migration + Controller + Route' },
    { value: 'controller', label: 'CONTROLLER', icon: '🎮', description: 'Logic Handler' },
    { value: 'model', label: 'MODEL', icon: '📦', description: 'Data Structure', hasMigration: true },
    { value: 'migration', label: 'MIGRATION', icon: '📝', description: 'DB Schema Change' },
    { value: 'seeder', label: 'SEEDER', icon: '🌱', description: 'Test Data' },
    { value: 'middleware', label: 'MIDDLEWARE', icon: '🛡️', description: 'Request Filter' },
    { value: 'route', label: 'ROUTE', icon: 'Tracks', description: 'URL Routing' },
    { value: 'job', label: 'JOB', icon: '⚡', description: 'Background Task' },
    { value: 'factory', label: 'FACTORY', icon: '🏭', description: 'Data Generator' },
];

interface Discovery {
    models: string[];
    controllers: string[];
    routes: string[];
    migrations: { name: string; path: string }[];
}

export default function ScaffoldPage() {
    const [type, setType] = useState('resource');
    const [name, setName] = useState('');
    const [withMigration, setWithMigration] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [discovery, setDiscovery] = useState<Discovery | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await adminFetch(`${API}/scaffold/discovery`);
            const data = await res.json();
            setDiscovery(data);
        } catch (err) {
            console.error('Discovery failed', err);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            if (data.success) {
                setName('');
                fetchData(); // Refresh the big picture
            }
        } catch (err: any) {
            setResult({ error: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="topbar">
                <h1 style={{ fontFamily: 'var(--tactical)', fontSize: '14px', letterSpacing: '2px' }}>🏗️ SCAFFOLD_ENGINE_V2</h1>
                <span className="topbar-meta">CORE: ACTIVE • DISCOVERY_PROTOCOL: ENABLED</span>
            </div>

            <div className="page-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }} className="responsive-grid">

                    {/* Left: Creator */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="card">
                            <div className="card-header">// SELECT_BLUEPRINT</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
                                {scaffoldTypes.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => { setType(s.value); setResult(null); }}
                                        className={`btn ${type === s.value ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{
                                            padding: '12px 8px', flexDirection: 'column', gap: 4, height: 'auto',
                                            borderColor: type === s.value ? 'var(--accent)' : 'var(--border)',
                                            background: type === s.value ? 'var(--accent-glow)' : 'transparent',
                                            fontSize: '9px'
                                        }}
                                    >
                                        <span style={{ fontSize: '18px' }}>{s.icon}</span>
                                        <span>{s.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="card-header">// EXECUTION_PARAMETERS</div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--tactical)', marginBottom: 8 }}>TARGET_NAME</div>
                                <input
                                    className="form-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={`e.g. ${type === 'resource' ? 'Order' : 'User'}`}
                                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                />
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--mono)' }}>
                                    TYPE: {selected.label} • {selected.description.toUpperCase()}
                                </div>
                            </div>

                            {selected.hasMigration && (
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--tactical)' }}>
                                        <input
                                            type="checkbox"
                                            checked={withMigration}
                                            onChange={e => setWithMigration(e.target.checked)}
                                            style={{ accentColor: 'var(--accent)' }}
                                        />
                                        AUTO_GENERATE_MIGRATION
                                    </label>
                                </div>
                            )}

                            <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !name.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                                {loading ? '⏳ INITIALIZING…' : `⚡ EXECUTE_SCAFFOLD_${selected.label}`}
                            </button>

                            {result && (
                                <div style={{ marginTop: 20, padding: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 2 }}>
                                    {result.success ? (
                                        <div style={{ color: 'var(--green)', fontSize: '12px', fontFamily: 'var(--mono)' }}>
                                            ✅ DEPLOYMENT_SUCCESSFUL:
                                            {result.created?.map((f: string) => (
                                                <div key={f} style={{ color: 'var(--accent-secondary)', marginTop: 6, fontSize: '11px' }}>
                                                    → {f}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: 'var(--red)', fontSize: '12px', fontFamily: 'var(--mono)' }}>❌ ERROR: {result.error}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Big Picture */}
                    <div className="card" style={{ height: 'fit-content' }}>
                        <div className="card-header">// SYSTEM_INVENTORY (BIG_PICTURE)</div>

                        {!discovery ? (
                            <div style={{ padding: '20px 0', textAlign: 'center', opacity: 0.5 }}>
                                <div className="loading">⚡</div>
                                <div style={{ fontSize: '10px', marginTop: 10, fontFamily: 'var(--mono)' }}>SCANNING_SYSTEM…</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--tactical)', marginBottom: 10 }}>📦 MODELS</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {discovery.models.length === 0 && <span style={{ opacity: 0.5, fontSize: '10px' }}>NONE</span>}
                                        {discovery.models.map(m => (
                                            <span key={m} style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 2, fontFamily: 'var(--mono)' }}>
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--accent-secondary)', fontFamily: 'var(--tactical)', marginBottom: 10 }}>🎮 CONTROLLERS</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {discovery.controllers.length === 0 && <span style={{ opacity: 0.5, fontSize: '10px' }}>NONE</span>}
                                        {discovery.controllers.map(c => (
                                            <span key={c} style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 2, fontFamily: 'var(--mono)' }}>
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--yellow)', fontFamily: 'var(--tactical)', marginBottom: 10 }}>🛤️ ROUTES</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {discovery.routes.length === 0 && <span style={{ opacity: 0.5, fontSize: '10px' }}>NONE</span>}
                                        {discovery.routes.map(r => (
                                            <span key={r} style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 2, fontFamily: 'var(--mono)' }}>
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '10px', color: 'var(--green)', fontFamily: 'var(--tactical)', marginBottom: 10 }}>📝 RECENT_MIGRATIONS</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {discovery.migrations.slice(-5).reverse().map(m => (
                                            <div key={m.name} style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                → {m.name}
                                            </div>
                                        ))}
                                        {discovery.migrations.length === 0 && <span style={{ opacity: 0.5, fontSize: '10px' }}>NONE</span>}
                                    </div>
                                </div>

                                <div style={{
                                    borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8,
                                    fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', textAlign: 'center'
                                }}>
                                    SYSTEM_RESOURCE_DENSITY: {discovery.total} UNITS
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
