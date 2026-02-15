'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

const API = '/api/_admin';

interface Tool { name: string; category: string; description: string }
interface Resource { uri: string; name: string; description: string }
interface Prompt { name: string; description: string }

interface MCPInfo {
    name: string;
    version: string;
    transport: string[];
    tools: Tool[];
    resources: Resource[];
    prompts: Prompt[];
}

const categoryColors: Record<string, string> = {
    Scaffolding: 'var(--accent)',
    Database: 'var(--green)',
    Inspection: 'var(--blue)',
};

export default function MCPPage() {
    const [info, setInfo] = useState<MCPInfo | null>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'map' | 'tools' | 'automation'>('map');
    const [activityLog, setActivityLog] = useState<{ time: string; tool: string; status: string }[]>([]);
    const [executing, setExecuting] = useState('');

    useEffect(() => {
        adminFetch(`${API}/mcp`)
            .then(r => r.json())
            .then(setInfo)
            .catch(() => setError('Cannot connect to HyperZ API'));
    }, []);

    const executeTool = async (toolName: string) => {
        setExecuting(toolName);
        const now = new Date().toLocaleTimeString();
        setActivityLog(prev => [{ time: now, tool: toolName, status: '⏳ RUNNING…' }, ...prev]);

        try {
            let res;
            if (toolName === 'run_migration') {
                res = await adminFetch(`${API}/database/migrate`, { method: 'POST' });
            } else if (toolName === 'run_migration_rollback') {
                res = await adminFetch(`${API}/database/rollback`, { method: 'POST' });
            } else if (toolName === 'run_seed') {
                res = await adminFetch(`${API}/database/seed`, { method: 'POST' });
            } else if (toolName === 'list_routes') {
                res = await adminFetch(`${API}/routes`);
            } else if (toolName === 'read_env') {
                res = await adminFetch(`${API}/env`);
            } else {
                setActivityLog(prev => {
                    const updated = [...prev];
                    updated[0] = { ...updated[0], status: 'ℹ️ USE CLI OR AI AGENT' };
                    return updated;
                });
                setExecuting('');
                return;
            }
            const data = await res.json();
            setActivityLog(prev => {
                const updated = [...prev];
                updated[0] = { ...updated[0], status: data.error ? `❌ ${data.error}` : '✅ SUCCESS' };
                return updated;
            });
        } catch (e: any) {
            setActivityLog(prev => {
                const updated = [...prev];
                updated[0] = { ...updated[0], status: `❌ ${e.message}` };
                return updated;
            });
        }
        setExecuting('');
    };

    return (
        <AdminLayout>
            <div className="topbar">
                <h1 style={{ fontFamily: 'var(--tactical)', fontSize: '14px', letterSpacing: '2px' }}>🔌 MCP_COMMAND_CENTER</h1>
                <span className="topbar-meta">UPLINK: ACTIVE • v{info?.version || '?.?.?'}</span>
            </div>

            <div className="page-content">
                {error && (
                    <div className="card" style={{ borderColor: 'var(--red)', marginBottom: 24 }}>
                        <p style={{ color: 'var(--red)', fontFamily: 'var(--mono)' }}>⚠️ ERROR: UPLINK_FAILURE — CONNECTION TO HYPERZ API REFUSED</p>
                    </div>
                )}

                {!info && !error && (
                    <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
                        <div className="loading" style={{ fontSize: '40px' }}>⚡</div>
                        <p style={{ fontFamily: 'var(--mono)', marginTop: 16 }}>AUTHENTICATING MCP PROTOCOLS…</p>
                    </div>
                )}

                {info && (
                    <>
                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">MODULE_TOOLS</div>
                                <div className="stat-value">{info.tools.length}</div>
                                <div className="stat-sub">CAPABILITIES_ONLINE</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">DATA_RESOURCES</div>
                                <div className="stat-value">{info.resources.length}</div>
                                <div className="stat-sub">VIRTUAL_UPLINKS</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">AI_PROMPTS</div>
                                <div className="stat-value">{info.prompts.length}</div>
                                <div className="stat-sub">LOGIC_PATTERNS</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">TRANSPORTS</div>
                                <div className="stat-value">{info.transport.length}</div>
                                <div className="stat-sub">{info.transport.join(' / ').toUpperCase()}</div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="btn-group" style={{ marginBottom: 32 }}>
                            {[
                                { key: 'map', label: '// SYSTEM_MAP' },
                                { key: 'tools', label: '// TOOL_TESTER' },
                                { key: 'automation', label: '// AI_AUTOMATION' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ fontSize: '10px' }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="page-transition" key={activeTab}>
                            {activeTab === 'map' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div className="card">
                                        <div className="card-header">// SYSTEM_TOOLS_REGISTRY</div>
                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr><th>Name</th><th>Category</th><th>Description</th></tr>
                                                </thead>
                                                <tbody>
                                                    {info.tools.map(tool => (
                                                        <tr key={tool.name}>
                                                            <td style={{ color: 'var(--accent)' }}>{tool.name}</td>
                                                            <td><span className="badge badge-info" style={{ color: categoryColors[tool.category] }}>{tool.category}</span></td>
                                                            <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tool.description}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                        <div className="card">
                                            <div className="card-header">// SHARED_RESOURCES</div>
                                            <div className="table-container">
                                                <table>
                                                    <thead><tr><th>Name</th><th>URI</th></tr></thead>
                                                    <tbody>
                                                        {info.resources.map(res => (
                                                            <tr key={res.uri}>
                                                                <td>{res.name}</td>
                                                                <td style={{ color: 'var(--accent-secondary)' }}>{res.uri}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="card">
                                            <div className="card-header">// LOGIC_PROMPTS</div>
                                            {info.prompts.map(p => (
                                                <div key={p.name} style={{ marginBottom: 12 }}>
                                                    <div style={{ color: 'var(--yellow)', fontSize: '13px', fontWeight: 600, fontFamily: 'var(--mono)' }}>{p.name}</div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{p.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tools' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    <div className="card">
                                        <div className="card-header">// EXECUTE_COMMANDS</div>
                                        <div className="btn-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                            {info.tools.map(tool => (
                                                <button
                                                    key={tool.name}
                                                    onClick={() => executeTool(tool.name)}
                                                    disabled={!!executing}
                                                    className="btn btn-secondary"
                                                    style={{ justifyContent: 'space-between' }}
                                                >
                                                    <span>{tool.name}</span>
                                                    <span style={{ fontSize: '9px', opacity: 0.5 }}>{tool.category}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="card">
                                        <div className="card-header">// ACTIVITY_LOG</div>
                                        <div className="log-viewer">
                                            {activityLog.length === 0 && <div className="empty-state">NO_ACTIVITY_DETECTED</div>}
                                            {activityLog.map((entry, i) => (
                                                <div key={i} className="log-line">
                                                    <span style={{ color: 'var(--text-muted)' }}>[{entry.time}]</span>{' '}
                                                    <span style={{ color: 'var(--accent)' }}>{entry.tool}</span>{' '}
                                                    <span style={{ color: entry.status.includes('❌') ? 'var(--red)' : entry.status.includes('✅') ? 'var(--green)' : 'var(--yellow)' }}>
                                                        {entry.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'automation' && (
                                <div className="card">
                                    <div className="card-header">// AI_AUTOMATION_UPLINK</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                                        {[
                                            { label: 'CLAUDE DESKTOP', cmd: 'npx tsx bin/hyperz-mcp.ts', detail: 'Local bridge for Anthropic Claude' },
                                            { label: 'CURSOR AI', cmd: 'npx tsx bin/hyperz-mcp.ts', detail: 'IDE context injection' },
                                            { label: 'WEB AGENTS', cmd: 'HTTP/SSE Endpoint', detail: 'Remote execution via SSE' },
                                        ].map(bridge => (
                                            <div key={bridge.label} className="stat-card" style={{ background: 'var(--bg-input)' }}>
                                                <div className="stat-label" style={{ color: 'var(--accent)' }}>{bridge.label}</div>
                                                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', margin: '8px 0', wordBreak: 'break-all' }}>{bridge.cmd}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{bridge.detail}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
