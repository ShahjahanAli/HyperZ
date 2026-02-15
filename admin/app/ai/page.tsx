'use client';

import AdminLayout from '@/components/AdminLayout';

export default function AIPage() {
    return (
        <AdminLayout>
            <div className="topbar">
                <h1>🤖 AI Gateway</h1>
                <span className="topbar-meta">Multi-provider AI integration</span>
            </div>

            <div className="page-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                    {/* OpenAI */}
                    <div className="card">
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🟢</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>OpenAI</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>GPT-4o, GPT-4, GPT-3.5</div>
                        <div style={{ marginTop: 12 }}>
                            <table>
                                <tbody>
                                    <tr><td style={{ color: 'var(--text-muted)', fontSize: 12 }}>API Key</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{process.env.OPENAI_API_KEY ? '••••••••' : 'Not set'}</td></tr>
                                    <tr><td style={{ color: 'var(--text-muted)', fontSize: 12 }}>Default Model</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>gpt-4o</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Anthropic */}
                    <div className="card">
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🟣</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>Anthropic</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Claude 3.5, Claude 3</div>
                        <div style={{ marginTop: 12 }}>
                            <table>
                                <tbody>
                                    <tr><td style={{ color: 'var(--text-muted)', fontSize: 12 }}>API Key</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{process.env.ANTHROPIC_API_KEY ? '••••••••' : 'Not set'}</td></tr>
                                    <tr><td style={{ color: 'var(--text-muted)', fontSize: 12 }}>Default Model</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>claude-3-5-sonnet</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Google AI */}
                    <div className="card">
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🔵</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>Google AI</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Gemini Pro, Gemini Flash</div>
                        <div style={{ marginTop: 12 }}>
                            <table>
                                <tbody>
                                    <tr><td style={{ color: 'var(--text-muted)', fontSize: 12 }}>API Key</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{process.env.GOOGLE_AI_KEY ? '••••••••' : 'Not set'}</td></tr>
                                    <tr><td style={{ color: 'var(--text-muted)', fontSize: 12 }}>Default Model</td><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>gemini-pro</td></tr>
                                </tbody>
                            </table>
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
                                    <td>AI_PROVIDER</td>
                                    <td style={{ fontFamily: 'var(--mono)' }}>{process.env.AI_PROVIDER || 'openai'}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>Default AI provider</td>
                                </tr>
                                <tr>
                                    <td>Rate Limiting</td>
                                    <td style={{ fontFamily: 'var(--mono)' }}>Built-in</td>
                                    <td style={{ color: 'var(--text-muted)' }}>Per-provider rate limiting</td>
                                </tr>
                                <tr>
                                    <td>Token Tracking</td>
                                    <td style={{ fontFamily: 'var(--mono)' }}>Enabled</td>
                                    <td style={{ color: 'var(--text-muted)' }}>Tracks usage per request</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card" style={{ marginTop: 16 }}>
                    <div className="card-header">CLI Commands</div>
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <span className="badge badge-info" style={{ fontFamily: 'var(--mono)' }}>npx hyperz make:ai-action ActionName</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Create a new AI action class</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
