'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

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
        adminFetch('/api/_admin/graphql/schema')
            .then(r => r.json())
            .then(setSchema)
            .catch(() => setSchema({ models: [], typeDefs: '', queryCount: 0, mutationCount: 0 }))
            .finally(() => setLoading(false));
    }, []);

    const executeQuery = async () => {
        setExecuting(true);
        try {
            const res = await adminFetch('/api/_admin/graphql', {
                method: 'POST',
                body: JSON.stringify({ query }),
            });
            const json = await res.json();
            setResult(JSON.stringify(json, null, 2));
        } catch (err: any) {
            setResult(JSON.stringify({ error: err.message }, null, 2));
        }
        setExecuting(false);
    };

    const activeModelData = schema?.models.find(m => m.name === activeModel);

    return (
        <AdminLayout>
            <div className="topbar">
                <h1 style={{ fontFamily: 'var(--tactical)', fontSize: '14px', letterSpacing: '2px' }}>🔮 GRAPHQL_INTEGRATION_HUB</h1>
                <span className="topbar-meta">SCHEMA: DISCOVERED • {schema?.queryCount || 0} QUERIES</span>
            </div>

            <div className="page-content">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div className="loading" style={{ fontSize: '40px' }}>⚡</div>
                        <p style={{ fontFamily: 'var(--mono)', marginTop: 16, color: 'var(--text-muted)' }}>QUERYING_GRAPHQL_METADATA…</p>
                    </div>
                ) : (
                    <div className="page-transition">
                        {/* Summary Grid */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">MODELS_EXPOSED</div>
                                <div className="stat-value">{schema?.models.length || 0}</div>
                                <div className="stat-sub">DOMAIN_ENTITIES</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">QUERY_OPERATIONS</div>
                                <div className="stat-value">{schema?.queryCount || 0}</div>
                                <div className="stat-sub">READ_ACCESSORS</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">MUTATIONS</div>
                                <div className="stat-value">{schema?.mutationCount || 0}</div>
                                <div className="stat-sub">WRITE_OPERATIONS</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">API_UPLINK</div>
                                <div className="stat-value" style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>/graphql</div>
                                <div className="stat-sub">ENDPOINT_STATUS: LIVE</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }} className="responsive-grid">
                            {/* Models Column */}
                            <div className="card">
                                <div className="card-header">// SCHEMA_MODELS</div>
                                <div className="btn-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                    {schema?.models.map(model => (
                                        <button
                                            key={model.name}
                                            onClick={() => setActiveModel(model.name === activeModel ? null : model.name)}
                                            className={`btn ${activeModel === model.name ? 'btn-primary' : 'btn-secondary'}`}
                                            style={{ justifyContent: 'space-between', fontSize: '12px' }}
                                        >
                                            <span>{model.name}</span>
                                            <span style={{ fontSize: '9px', opacity: 0.5 }}>{model.tableName}</span>
                                        </button>
                                    ))}
                                    {schema?.models.length === 0 && <div className="empty-state">NO_MODELS_FOUND</div>}
                                </div>
                                <a href="http://localhost:7700/api/_admin/graphql" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: '100%', marginTop: 16, fontSize: '10px' }}>
                                    OPEN_GRAPHIQL_IDE ↗
                                </a>
                            </div>

                            {/* Center Content */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {/* Model Detail */}
                                {activeModelData && (
                                    <div className="card">
                                        <div className="card-header">// MODEL_DEFINITION: {activeModelData.name}</div>
                                        <div className="table-container">
                                            <table>
                                                <thead><tr><th>FIELD</th><th>TYPE</th><th>NULLABLE</th></tr></thead>
                                                <tbody>
                                                    {activeModelData.fields.map(field => (
                                                        <tr key={field.name}>
                                                            <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{field.name}</td>
                                                            <td><span className="badge badge-info">{field.type}</span></td>
                                                            <td style={{ color: field.nullable ? 'var(--text-muted)' : 'var(--yellow)' }}>{field.nullable ? 'YES' : 'NO'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Query Tester */}
                                <div className="card">
                                    <div className="card-header">// GRAPHQL_UPLINK_TESTER</div>
                                    <textarea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        spellCheck={false}
                                        style={{
                                            width: '100%', height: 120, background: 'var(--bg-input)', color: 'var(--text)',
                                            border: '1px solid var(--border)', borderRadius: 4, padding: 12,
                                            fontFamily: 'var(--mono)', fontSize: '12px', resize: 'vertical',
                                        }}
                                    />
                                    <button
                                        onClick={executeQuery}
                                        disabled={executing}
                                        className="btn btn-primary"
                                        style={{ marginTop: 12 }}
                                    >
                                        {executing ? 'EXECUTING…' : 'RUN_QUERY'}
                                    </button>

                                    {result && (
                                        <pre className="log-viewer" style={{ marginTop: 16, color: 'var(--green)', maxHeight: 300 }}>{result}</pre>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SDL Preview */}
                        {schema?.typeDefs && (
                            <div className="card" style={{ marginTop: 24 }}>
                                <div className="card-header">// SCHEMA_DEFINITION_LANGUAGE (SDL)</div>
                                <pre className="log-viewer" style={{ maxHeight: 400 }}>{schema.typeDefs}</pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
