'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

interface AIStats {
    totalCost: number;
    totalTokens: number;
    providerHealth: Record<string, string>;
    usageByProvider: Record<string, number>;
    recentRequests: Array<{
        id: number;
        provider: string;
        model: string;
        tokens: number;
        cost: number;
        status: string;
        time: string;
    }>;
}

export default function AIPage() {
    const [stats, setStats] = useState<AIStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminFetch('/api/_admin/ai/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <AdminLayout>
            <div className="topbar">
                <h1>🤖 AI Gateway</h1>
                <span className="topbar-meta">Multi-provider orchestration & cost tracking</span>
            </div>

            <div className="page-content">
                {/* Stats Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <div className="card">
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Estimated Cost (MTD)</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)', marginTop: 8 }}>
                            ${stats?.totalCost?.toFixed(2) || '0.00'}
                        </div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tokens Consumed</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', marginTop: 8 }}>
                            {stats?.totalTokens?.toLocaleString() || '0'}
                        </div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg Latency</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--green)', marginTop: 8 }}>
                            1.2s
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 24 }}>
                    {/* Recent Requests */}
                    <div className="card">
                        <div className="card-header">Recent AI Actions</div>
                        <table style={{ marginTop: 12 }}>
                            <thead>
                                <tr>
                                    <th>Model</th>
                                    <th>Tokens</th>
                                    <th>Cost</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentRequests.map(req => (
                                    <tr key={req.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{req.model}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{req.provider}</div>
                                        </td>
                                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{req.tokens}</td>
                                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>${req.cost.toFixed(4)}</td>
                                        <td style={{ fontSize: 12 }}>{req.time}</td>
                                        <td><span className="badge badge-success">{req.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Providers */}
                    <div className="card">
                        <div className="card-header">Provider Health</div>
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {['openai', 'anthropic', 'google'].map(p => (
                                <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--accent-glow)', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ fontSize: 20 }}>{p === 'openai' ? '🟢' : p === 'anthropic' ? '🟣' : '🔵'}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{p}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Default: {p === 'openai' ? 'gpt-4o' : p === 'anthropic' ? 'claude-3-5' : 'gemini-pro'}</div>
                                        </div>
                                    </div>
                                    <div className="badge badge-success">Healthy</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">AI Gateway Configuration</div>
                    <div style={{ marginTop: 12 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Setting</th>
                                    <th>Value</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>AI_FALLBACK_STRATEGY</td>
                                    <td style={{ fontFamily: 'var(--mono)' }}>priority-pool</td>
                                    <td style={{ color: 'var(--text-muted)' }}>Auto-switch to next healthy provider</td>
                                </tr>
                                <tr>
                                    <td>AI_COST_LIMIT</td>
                                    <td style={{ fontFamily: 'var(--mono)' }}>$50.00/day</td>
                                    <td style={{ color: 'var(--text-muted)' }}>Safety threshold for token spend</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
