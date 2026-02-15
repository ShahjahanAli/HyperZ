'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

const API = '/api/_admin';

interface EnvVar { key?: string; value?: string; comment?: string; }

export default function ConfigPage() {
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);
    const [configs, setConfigs] = useState<any[]>([]);
    const [selectedConfig, setSelectedConfig] = useState('');
    const [configContent, setConfigContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [tab, setTab] = useState<'env' | 'config'>('env');

    useEffect(() => {
        adminFetch(`${API}/env`).then(r => r.json()).then(d => setEnvVars(d.variables || [])).catch(() => { });
        adminFetch(`${API}/config`).then(r => r.json()).then(d => {
            setConfigs(d.files || []);
            if (d.files?.length > 0) {
                setSelectedConfig(d.files[0].name);
                setConfigContent(d.files[0].content);
            }
        }).catch(() => { });
    }, []);

    const saveEnv = async () => {
        setSaving(true);
        try {
            await adminFetch(`${API}/env`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variables: envVars }),
            });
            setToast('✅ .env saved');
            setTimeout(() => setToast(''), 3000);
        } catch {
            setToast('❌ Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const updateEnvVar = (index: number, field: 'key' | 'value', val: string) => {
        const updated = [...envVars];
        updated[index] = { ...updated[index], [field]: val };
        setEnvVars(updated);
    };

    const addEnvVar = () => setEnvVars([...envVars, { key: '', value: '' }]);
    const removeEnvVar = (i: number) => setEnvVars(envVars.filter((_, idx) => idx !== i));

    const selectConfig = (name: string) => {
        setSelectedConfig(name);
        const file = configs.find(c => c.name === name);
        setConfigContent(file?.content || '');
    };

    return (
        <AdminLayout>
            <div className="topbar">
                <h1>⚙️ Config & Environment</h1>
                <span className="topbar-meta">{envVars.filter(v => v.key).length} env vars • {configs.length} config files</span>
            </div>

            <div className="page-content">
                <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
                    <button className={`btn ${tab === 'env' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('env')} style={{ borderRadius: '8px 0 0 8px' }}>
                        Environment Variables
                    </button>
                    <button className={`btn ${tab === 'config' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('config')} style={{ borderRadius: '0 8px 8px 0' }}>
                        Config Files
                    </button>
                </div>

                {tab === 'env' && (
                    <div className="card">
                        <div className="section-header" style={{ marginBottom: 16 }}>
                            <div className="card-header" style={{ margin: 0 }}>.env File</div>
                            <div className="btn-group">
                                <button className="btn btn-secondary btn-sm" onClick={addEnvVar}>+ Add Variable</button>
                                <button className="btn btn-primary btn-sm" onClick={saveEnv} disabled={saving}>
                                    {saving ? '⏳ Saving...' : '💾 Save .env'}
                                </button>
                            </div>
                        </div>

                        {envVars.map((v, i) => {
                            if (v.comment !== undefined) {
                                return (
                                    <div key={i} style={{ padding: '4px 0', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                                        {v.comment}
                                    </div>
                                );
                            }
                            return (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 32px', gap: 6, marginBottom: 4 }}>
                                    <input className="form-input" style={{ fontSize: 12, fontFamily: 'var(--mono)', padding: '6px 10px' }} value={v.key || ''} onChange={e => updateEnvVar(i, 'key', e.target.value)} placeholder="KEY" />
                                    <input className="form-input" style={{ fontSize: 12, fontFamily: 'var(--mono)', padding: '6px 10px' }} value={v.value || ''} onChange={e => updateEnvVar(i, 'value', e.target.value)} placeholder="value" />
                                    <button onClick={() => removeEnvVar(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === 'config' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
                        <div className="card" style={{ padding: 0 }}>
                            <div className="card-header" style={{ padding: '16px 16px 8px' }}>Config Files</div>
                            {configs.map(c => (
                                <div
                                    key={c.name}
                                    onClick={() => selectConfig(c.name)}
                                    style={{
                                        padding: '8px 16px', cursor: 'pointer', fontSize: 13,
                                        fontFamily: 'var(--mono)',
                                        background: selectedConfig === c.name ? 'var(--accent-glow)' : 'transparent',
                                        borderLeft: selectedConfig === c.name ? '3px solid var(--accent)' : '3px solid transparent',
                                    }}
                                >
                                    {c.name}
                                </div>
                            ))}
                        </div>
                        <div className="card">
                            <div className="card-header">{selectedConfig}.ts</div>
                            <pre style={{
                                background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8,
                                padding: 16, fontSize: 13, fontFamily: 'var(--mono)', lineHeight: 1.6,
                                overflow: 'auto', maxHeight: 500, whiteSpace: 'pre-wrap',
                            }}>
                                {configContent || 'Select a file'}
                            </pre>
                        </div>
                    </div>
                )}

                {toast && <div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>{toast}</div>}
            </div>
        </AdminLayout>
    );
}
