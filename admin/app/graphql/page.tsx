'use client';

import { useState, useEffect } from 'react';

interface SchemaInfo {
    models: Array<{ name: string; tableName: string; fields: Array<{ name: string; type: string; nullable: boolean }> }>;
    typeDefs: string;
    queryCount: number;
    mutationCount: number;
}

export default function GraphQLPage() {
    const [schema, setSchema] = useState<SchemaInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeModel, setActiveModel] = useState<string | null>(null);
    const [query, setQuery] = useState('{\n  _health {\n    status\n    timestamp\n    framework\n  }\n}');
    const [result, setResult] = useState<string>('');
    const [executing, setExecuting] = useState(false);

    useEffect(() => {
        fetch('/graphql/schema')
            .then(r => r.json())
            .then(setSchema)
            .catch(() => setSchema({ models: [], typeDefs: '', queryCount: 1, mutationCount: 0 }))
            .finally(() => setLoading(false));
    }, []);

    const executeQuery = async () => {
        setExecuting(true);
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });
            const json = await res.json();
            setResult(JSON.stringify(json, null, 2));
        } catch (err: any) {
            setResult(JSON.stringify({ error: err.message }, null, 2));
        }
        setExecuting(false);
    };

    if (loading) {
        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔮</div>
                    <div>Loading GraphQL schema…</div>
                </div>
            </div>
        );
    }

    const activeModelData = schema?.models.find(m => m.name === activeModel);

    return (
        <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0, marginBottom: 4 }}>
                    🔮 GraphQL Integration
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    Auto-generated schema from HyperZ models · {schema?.queryCount || 0} queries · {schema?.mutationCount || 0} mutations
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Models', value: schema?.models.length || 0, icon: '📦', color: '#6366f1' },
                    { label: 'Queries', value: schema?.queryCount || 0, icon: '🔍', color: '#3b82f6' },
                    { label: 'Mutations', value: schema?.mutationCount || 0, icon: '✏️', color: '#22c55e' },
                    { label: 'Total Fields', value: schema?.models.reduce((a, m) => a + m.fields.length, 0) || 0, icon: '📐', color: '#f59e0b' },
                ].map(item => (
                    <div key={item.label} style={{
                        background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '14px 16px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</span>
                            <span>{item.icon}</span>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginBottom: 20 }}>
                {/* Models List */}
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>Models</h3>
                    {schema?.models.length === 0 ? (
                        <p style={{ color: '#475569', fontSize: '0.8rem' }}>
                            No models found. Create models in <code style={{ color: '#a78bfa' }}>app/models/</code>
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {schema?.models.map(model => (
                                <button key={model.name} onClick={() => setActiveModel(model.name === activeModel ? null : model.name)}
                                    style={{
                                        padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                                        background: activeModel === model.name ? '#6366f122' : '#1e293b',
                                        color: activeModel === model.name ? '#a78bfa' : '#e2e8f0',
                                    }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{model.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                                        {model.tableName} · {model.fields.length} fields
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Quick links */}
                    <div style={{ borderTop: '1px solid #1e293b', marginTop: 16, paddingTop: 12 }}>
                        <a href="/graphql" target="_blank" rel="noreferrer" style={{
                            display: 'block', padding: '8px 12px', background: '#6366f122', borderRadius: 6,
                            color: '#a78bfa', textDecoration: 'none', fontSize: '0.8rem', textAlign: 'center', fontWeight: 600,
                        }}>
                            🚀 Open GraphiQL IDE
                        </a>
                    </div>
                </div>

                {/* Query Tester + Model Detail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Model Detail */}
                    {activeModelData && (
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
                            <h3 style={{ fontSize: '0.95rem', color: '#a78bfa', marginBottom: 12, fontWeight: 700 }}>
                                {activeModelData.name} <span style={{ color: '#475569', fontWeight: 400, fontSize: '0.8rem' }}>({activeModelData.tableName})</span>
                            </h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #1e293b' }}>Field</th>
                                        <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #1e293b' }}>Type</th>
                                        <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: '0.72rem', color: '#64748b', borderBottom: '1px solid #1e293b' }}>Nullable</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeModelData.fields.map(field => (
                                        <tr key={field.name}>
                                            <td style={{ padding: '6px 10px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.82rem' }}>{field.name}</td>
                                            <td style={{ padding: '6px 10px' }}>
                                                <span style={{
                                                    fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                                                    background: field.type === 'ID' ? '#6366f122' : field.type === 'Boolean' ? '#22c55e22' : field.type === 'Float' ? '#f59e0b22' : '#3b82f622',
                                                    color: field.type === 'ID' ? '#a78bfa' : field.type === 'Boolean' ? '#22c55e' : field.type === 'Float' ? '#f59e0b' : '#60a5fa',
                                                }}>{field.type}</span>
                                            </td>
                                            <td style={{ padding: '6px 10px', color: field.nullable ? '#64748b' : '#f59e0b', fontSize: '0.82rem' }}>{field.nullable ? 'Yes' : 'No'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Query Tester */}
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
                        <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>Query Tester</h3>
                        <textarea value={query} onChange={(e) => setQuery(e.target.value)}
                            spellCheck={false}
                            style={{
                                width: '100%', height: 120, background: '#0d1117', color: '#e2e8f0', border: '1px solid #1e293b',
                                borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical',
                            }} />
                        <button onClick={executeQuery} disabled={executing} style={{
                            marginTop: 8, padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: '0.82rem',
                            opacity: executing ? 0.6 : 1,
                        }}>
                            {executing ? '⏳ Executing…' : '▶ Execute Query'}
                        </button>

                        {result && (
                            <pre style={{
                                marginTop: 12, background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8,
                                padding: 12, color: '#22c55e', fontFamily: 'monospace', fontSize: '0.78rem',
                                maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap',
                            }}>{result}</pre>
                        )}
                    </div>
                </div>
            </div>

            {/* Schema SDL Preview */}
            {schema?.typeDefs && (
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>Generated Schema (SDL)</h3>
                    <pre style={{
                        background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, padding: 12,
                        color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.78rem', maxHeight: 400,
                        overflow: 'auto', whiteSpace: 'pre-wrap',
                    }}>{schema.typeDefs}</pre>
                </div>
            )}
        </div>
    );
}
