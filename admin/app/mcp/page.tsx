'use client';

import { useEffect, useState } from 'react';
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
    Scaffolding: '#a78bfa',
    Database: '#34d399',
    Inspection: '#60a5fa',
};

const categoryIcons: Record<string, string> = {
    Scaffolding: '🏗️',
    Database: '🗄️',
    Inspection: '🔍',
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
        setActivityLog(prev => [{ time: now, tool: toolName, status: '⏳ Running...' }, ...prev]);

        try {
            // For scaffold tools, we'd need a name — use admin API scaffold endpoint
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
                // For scaffold tools, show info
                setActivityLog(prev => {
                    const updated = [...prev];
                    updated[0] = { ...updated[0], status: 'ℹ️ Use CLI or provide name via AI agent' };
                    return updated;
                });
                setExecuting('');
                return;
            }
            const data = await res.json();
            setActivityLog(prev => {
                const updated = [...prev];
                updated[0] = { ...updated[0], status: data.error ? `❌ ${data.error}` : '✅ Success' };
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

    if (error) {
        return (
            <div className="page-content">
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2>Cannot connect to HyperZ API</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Make sure the HyperZ server is running on port 7700
                    </p>
                </div>
            </div>
        );
    }

    if (!info) {
        return (
            <div className="page-content">
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" />
                    <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading MCP Server info...</p>
                </div>
            </div>
        );
    }

    // Group tools by category
    const toolGroups = info.tools.reduce((acc, tool) => {
        (acc[tool.category] ??= []).push(tool);
        return acc;
    }, {} as Record<string, Tool[]>);

    return (
        <div className="page-content">
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">🔌 MCP Server</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Model Context Protocol — AI Agent Integration Hub
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.8rem' }}>v{info.version}</span>
                    </div>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-card stat-card" style={{ borderTop: '3px solid #a78bfa' }}>
                    <div className="stat-icon">🛠️</div>
                    <div className="stat-value">{info.tools.length}</div>
                    <div className="stat-label">Tools</div>
                </div>
                <div className="glass-card stat-card" style={{ borderTop: '3px solid #60a5fa' }}>
                    <div className="stat-icon">📦</div>
                    <div className="stat-value">{info.resources.length}</div>
                    <div className="stat-label">Resources</div>
                </div>
                <div className="glass-card stat-card" style={{ borderTop: '3px solid #fbbf24' }}>
                    <div className="stat-icon">💬</div>
                    <div className="stat-value">{info.prompts.length}</div>
                    <div className="stat-label">Prompts</div>
                </div>
                <div className="glass-card stat-card" style={{ borderTop: '3px solid #34d399' }}>
                    <div className="stat-icon">🔗</div>
                    <div className="stat-value">{info.transport.length}</div>
                    <div className="stat-label">Transports</div>
                </div>
            </div>

            {/* ── Tab Bar ── */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[
                    { key: 'map', icon: '🗺️', label: 'Component Map' },
                    { key: 'tools', icon: '🛠️', label: 'Tool Tester' },
                    { key: 'automation', icon: '🤖', label: 'AI Automation' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className="glass-card"
                        style={{
                            padding: '0.6rem 1.2rem',
                            cursor: 'pointer',
                            border: activeTab === tab.key ? '1px solid var(--accent)' : '1px solid transparent',
                            background: activeTab === tab.key ? 'rgba(139,92,246,0.15)' : undefined,
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Component Map Tab ── */}
            {activeTab === 'map' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Visual Architecture Diagram */}
                    <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>⚡ MCP Architecture</h3>
                        <div style={{
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem',
                            flexWrap: 'wrap'
                        }}>
                            {/* AI Clients */}
                            <div style={{ textAlign: 'center' }}>
                                <div className="glass-card" style={{
                                    padding: '1rem 1.5rem', background: 'rgba(96,165,250,0.15)',
                                    border: '1px solid rgba(96,165,250,0.3)', minWidth: 140
                                }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🧠</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Clients</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        Claude • Cursor<br />Copilot • Windsurf
                                    </div>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>⟷</div>

                            {/* MCP Server */}
                            <div style={{ textAlign: 'center' }}>
                                <div className="glass-card" style={{
                                    padding: '1rem 1.5rem', background: 'rgba(139,92,246,0.2)',
                                    border: '2px solid rgba(139,92,246,0.5)', minWidth: 160
                                }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔌</div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>HyperZ MCP</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        stdio • HTTP
                                    </div>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>⟷</div>

                            {/* HyperZ Framework */}
                            <div style={{ textAlign: 'center' }}>
                                <div className="glass-card" style={{
                                    padding: '1rem 1.5rem', background: 'rgba(52,211,153,0.15)',
                                    border: '1px solid rgba(52,211,153,0.3)', minWidth: 140
                                }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>HyperZ Framework</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        CLI • Database<br />Routes • Config
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tools by Category */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🛠️ Tools ({info.tools.length})</h3>
                        {Object.entries(toolGroups).map(([category, tools]) => (
                            <div key={category} style={{ marginBottom: '1rem' }}>
                                <div style={{
                                    fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                                    color: categoryColors[category] || '#888', marginBottom: '0.5rem',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                                }}>
                                    {categoryIcons[category]} {category}
                                </div>
                                {tools.map(tool => (
                                    <div key={tool.name} style={{
                                        padding: '0.5rem 0.75rem', marginBottom: '0.25rem',
                                        background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        fontSize: '0.8rem'
                                    }}>
                                        <code style={{ color: categoryColors[category], fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                            {tool.name}
                                        </code>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                                            {tool.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Resources + Prompts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>📦 Resources ({info.resources.length})</h3>
                            {info.resources.map(res => (
                                <div key={res.uri} style={{
                                    padding: '0.5rem 0.75rem', marginBottom: '0.25rem',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
                                    fontSize: '0.8rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 500 }}>{res.name}</span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{res.description}</span>
                                    </div>
                                    <code style={{ color: '#60a5fa', fontSize: '0.7rem', fontFamily: 'monospace' }}>{res.uri}</code>
                                </div>
                            ))}
                        </div>

                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>💬 Prompts ({info.prompts.length})</h3>
                            {info.prompts.map(p => (
                                <div key={p.name} style={{
                                    padding: '0.5rem 0.75rem', marginBottom: '0.25rem',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
                                    fontSize: '0.8rem'
                                }}>
                                    <code style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.name}</code>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '0.15rem' }}>{p.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tool Tester Tab ── */}
            {activeTab === 'tools' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🛠️ Execute Tools</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Click a tool to execute it directly. Scaffold tools require a name parameter (use via AI agent).
                        </p>
                        {info.tools.map(tool => (
                            <button
                                key={tool.name}
                                onClick={() => executeTool(tool.name)}
                                disabled={executing === tool.name}
                                className="glass-card"
                                style={{
                                    width: '100%', padding: '0.6rem 1rem', marginBottom: '0.4rem',
                                    cursor: executing === tool.name ? 'wait' : 'pointer',
                                    border: '1px solid transparent', textAlign: 'left',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    fontSize: '0.8rem', color: 'var(--text-primary)',
                                    opacity: executing === tool.name ? 0.6 : 1,
                                }}
                            >
                                <span>
                                    {categoryIcons[tool.category]} <code>{tool.name}</code>
                                </span>
                                <span style={{ color: categoryColors[tool.category], fontSize: '0.7rem' }}>{tool.category}</span>
                            </button>
                        ))}
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>📜 Activity Log</h3>
                        {activityLog.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>
                                No activity yet. Click a tool to execute it.
                            </p>
                        ) : (
                            <div style={{ maxHeight: 400, overflow: 'auto' }}>
                                {activityLog.map((entry, i) => (
                                    <div key={i} style={{
                                        padding: '0.5rem 0.75rem', marginBottom: '0.25rem',
                                        background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
                                        fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between'
                                    }}>
                                        <span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{entry.time}</span>
                                            {' '}<code>{entry.tool}</code>
                                        </span>
                                        <span>{entry.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── AI Automation Tab ── */}
            {activeTab === 'automation' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {/* Quick Actions */}
                    {[
                        { icon: '🚀', title: 'Run Migrations', desc: 'Execute all pending database migrations', tool: 'run_migration', color: '#34d399' },
                        { icon: '🔄', title: 'Rollback Migration', desc: 'Rollback the last batch of migrations', tool: 'run_migration_rollback', color: '#f87171' },
                        { icon: '🌱', title: 'Seed Database', desc: 'Run all database seeders', tool: 'run_seed', color: '#a78bfa' },
                        { icon: '🛤️', title: 'List Routes', desc: 'Show all registered API endpoints', tool: 'list_routes', color: '#60a5fa' },
                        { icon: '📋', title: 'Read Env', desc: 'View environment configuration', tool: 'read_env', color: '#fbbf24' },
                    ].map(action => (
                        <button
                            key={action.tool}
                            onClick={() => executeTool(action.tool)}
                            className="glass-card"
                            style={{
                                padding: '1.5rem', cursor: 'pointer',
                                border: `1px solid ${action.color}33`,
                                textAlign: 'center', color: 'var(--text-primary)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = action.color)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = `${action.color}33`)}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{action.icon}</div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{action.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{action.desc}</div>
                        </button>
                    ))}

                    {/* Connection Info */}
                    <div className="glass-card" style={{
                        padding: '1.5rem', gridColumn: '1 / -1', marginTop: '0.5rem'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🔗 Connect Your AI Tool</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: '#a78bfa' }}>
                                    Claude Desktop / Cursor (stdio)
                                </div>
                                <pre style={{
                                    background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8,
                                    fontSize: '0.72rem', overflow: 'auto', lineHeight: 1.5
                                }}>
                                    {`{
  "mcpServers": {
    "hyperz": {
      "command": "npx",
      "args": ["tsx", "bin/hyperz-mcp.ts"],
      "cwd": "/path/to/your/project"
    }
  }
}`}
                                </pre>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: '#34d399' }}>
                                    Transport Details
                                </div>
                                <div style={{ fontSize: '0.8rem', lineHeight: 1.8 }}>
                                    {info.transport.map(t => (
                                        <div key={t} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                                        }}>
                                            <span style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                background: '#34d399', display: 'inline-block'
                                            }} />
                                            <code style={{ fontSize: '0.78rem' }}>{t}</code>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                {t === 'stdio' ? '(local AI tools)' : '(web agents / admin panel)'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1rem', fontSize: '0.78rem' }}>
                                    <strong>Start MCP:</strong>{' '}
                                    <code style={{ color: '#a78bfa' }}>npm run mcp</code>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    {activityLog.length > 0 && (
                        <div className="glass-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                            <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>📜 Recent Activity</h3>
                            {activityLog.slice(0, 5).map((entry, i) => (
                                <div key={i} style={{
                                    padding: '0.4rem 0.75rem', marginBottom: '0.2rem',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
                                    fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between'
                                }}>
                                    <span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{entry.time}</span>
                                        {' '}<code>{entry.tool}</code>
                                    </span>
                                    <span>{entry.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
