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
                <h1>🔌 MCP_COMMAND_CENTER</h1>
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
                        <div className="btn-group mb-8">
                            {[
                                { key: 'map', label: '// SYSTEM_MAP' },
                                { key: 'tools', label: '// TOOL_TESTER' },
                                { key: 'automation', label: '// AI_AUTOMATION' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="page-transition" key={activeTab}>
                            {activeTab === 'map' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="card">
                                        <div className="card-header">// SYSTEM_TOOLS_REGISTRY</div>
                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr><th>NAME</th><th>CATEGORY</th><th>DESCRIPTION</th></tr>
                                                </thead>
                                                <tbody>
                                                    {info.tools.map(tool => (
                                                        <tr key={tool.name}>
                                                            <td className="font-bold text-[var(--accent)] italic">{tool.name}</td>
                                                            <td><span className="badge badge-info">{tool.category.toUpperCase()}</span></td>
                                                            <td className="text-[10px] text-[var(--text-muted)] italic font-medium">{tool.description}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="card">
                                            <div className="card-header">// SHARED_RESOURCES</div>
                                            <div className="table-container">
                                                <table>
                                                    <thead><tr><th>NAME</th><th>URI_HANDLE</th></tr></thead>
                                                    <tbody>
                                                        {info.resources.map(res => (
                                                            <tr key={res.uri}>
                                                                <td className="font-bold">{res.name}</td>
                                                                <td className="text-[var(--accent-secondary)] italic">{res.uri}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="card">
                                            <div className="card-header">// LOGIC_PROMPTS</div>
                                            <div className="space-y-4">
                                                {info.prompts.map(p => (
                                                    <div key={p.name} className="border-l-2 border-[var(--yellow)] pl-4">
                                                        <div className="text-[var(--yellow)] text-[12px] font-black font-mono italic">{p.name}</div>
                                                        <div className="text-[var(--text-muted)] text-[10px] uppercase font-bold mt-1">{p.description}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tools' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="card">
                                        <div className="card-header">// EXECUTE_COMMANDS</div>
                                        <div className="flex flex-col gap-3">
                                            {info.tools.map(tool => (
                                                <button
                                                    key={tool.name}
                                                    onClick={() => executeTool(tool.name)}
                                                    disabled={!!executing}
                                                    className="btn btn-secondary flex justify-between items-center group/btn"
                                                >
                                                    <span className="group-hover/btn:text-[var(--text)] transition-colors">{tool.name}</span>
                                                    <span className="badge badge-info opacity-50 group-hover/btn:opacity-100 transition-opacity">{tool.category.toUpperCase()}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="card">
                                        <div className="card-header">// ACTIVITY_LOG</div>
                                        <div className="log-viewer h-[400px]">
                                            {activityLog.length === 0 && <div className="empty-state">NO_ACTIVITY_DETECTED</div>}
                                            {activityLog.map((entry, i) => (
                                                <div key={i} className="log-line">
                                                    <span className="text-[var(--text-muted)] font-mono">[{entry.time}]</span>
                                                    <span className="text-[var(--accent)] font-black italic">{entry.tool}</span>
                                                    <span className={`badge ${entry.status.includes('❌') ? 'badge-danger' : entry.status.includes('✅') ? 'badge-success' : 'badge-warning'}`}>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[
                                            { label: 'CLAUDE DESKTOP', cmd: 'npx tsx bin/hyperz-mcp.ts', detail: 'Local bridge for Anthropic Claude' },
                                            { label: 'CURSOR AI', cmd: 'npx tsx bin/hyperz-mcp.ts', detail: 'IDE context injection' },
                                            { label: 'WEB AGENTS', cmd: 'HTTP/SSE Endpoint', detail: 'Remote execution via SSE' },
                                        ].map(bridge => (
                                            <div key={bridge.label} className="stat-card !bg-slate-500/5 hover:!border-[var(--accent)] hover:shadow-2xl transition-all">
                                                <div className="stat-label !text-[var(--accent)]">{bridge.label}</div>
                                                <div className="font-mono text-[11px] my-4 word-break break-all font-black italic bg-[var(--bg-input)] p-3 border border-[var(--border)] rounded-sm">{bridge.cmd}</div>
                                                <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">{bridge.detail}</div>
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
