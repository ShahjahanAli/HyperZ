'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

const API = '/api/_admin';

export default function DatabasePage() {
    const [tables, setTables] = useState<string[]>([]);
    const [driver, setDriver] = useState('');
    const [selectedTable, setSelectedTable] = useState('');
    const [tableData, setTableData] = useState<any>(null);
    const [migrations, setMigrations] = useState<any[]>([]);
    const [actionResult, setActionResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${API}/database/tables`).then(r => r.json()).then(d => { setTables(d.tables || []); setDriver(d.driver || ''); }).catch(() => { });
        fetch(`${API}/database/migrations`).then(r => r.json()).then(d => setMigrations(d.migrations || [])).catch(() => { });
    }, []);

    const loadTable = async (name: string) => {
        setSelectedTable(name);
        setTableData(null);
        const res = await fetch(`${API}/database/tables/${name}`);
        const data = await res.json();
        setTableData(data);
    };

    const runAction = async (action: string) => {
        setLoading(true);
        setActionResult(null);
        try {
            const res = await fetch(`${API}/database/${action}`, { method: 'POST' });
            const data = await res.json();
            setActionResult({ action, ...data });
            // Refresh tables
            fetch(`${API}/database/tables`).then(r => r.json()).then(d => setTables(d.tables || []));
        } catch (err: any) {
            setActionResult({ error: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="topbar">
                <h1>🗄️ Database</h1>
                <span className="topbar-meta">{driver ? `Driver: ${driver}` : ''} • {tables.length} tables</span>
            </div>

            <div className="page-content">
                {/* Actions */}
                <div className="section-header">
                    <h2>Migration Actions</h2>
                    <div className="btn-group">
                        <button className="btn btn-primary btn-sm" onClick={() => runAction('migrate')} disabled={loading}>
                            ▶️ Run Migrations
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => runAction('rollback')} disabled={loading}>
                            ↩️ Rollback
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => runAction('seed')} disabled={loading}>
                            🌱 Run Seeders
                        </button>
                    </div>
                </div>

                {actionResult && (
                    <div className="card" style={{ marginBottom: 16, borderColor: actionResult.error ? 'var(--red)' : 'var(--green)' }}>
                        <pre style={{ fontSize: 13, fontFamily: 'var(--mono)', color: actionResult.error ? 'var(--red)' : 'var(--green)' }}>
                            {actionResult.error || JSON.stringify(actionResult, null, 2)}
                        </pre>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
                    {/* Tables list */}
                    <div className="card" style={{ padding: 0 }}>
                        <div className="card-header" style={{ padding: '16px 16px 8px' }}>Tables</div>
                        {tables.length === 0 ? (
                            <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No tables found</div>
                        ) : (
                            tables.map(t => (
                                <div
                                    key={t}
                                    onClick={() => loadTable(t)}
                                    style={{
                                        padding: '8px 16px', cursor: 'pointer', fontSize: 13,
                                        fontFamily: 'var(--mono)',
                                        background: selectedTable === t ? 'var(--accent-glow)' : 'transparent',
                                        borderLeft: selectedTable === t ? '3px solid var(--accent)' : '3px solid transparent',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseOver={e => (e.currentTarget.style.background = selectedTable === t ? 'var(--accent-glow)' : 'var(--bg-hover)')}
                                    onMouseOut={e => (e.currentTarget.style.background = selectedTable === t ? 'var(--accent-glow)' : 'transparent')}
                                >
                                    {t}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Table data */}
                    <div className="card">
                        {!selectedTable ? (
                            <div className="empty-state">
                                <div className="icon">📋</div>
                                <p>Select a table to view its data</p>
                            </div>
                        ) : !tableData ? (
                            <div className="loading" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                        ) : (
                            <>
                                <div className="section-header" style={{ marginBottom: 12 }}>
                                    <h2 style={{ fontSize: 16 }}>
                                        {selectedTable}
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                                            ({tableData.pagination?.total || 0} rows)
                                        </span>
                                    </h2>
                                </div>

                                {/* Columns */}
                                <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {tableData.columns?.map((col: any) => (
                                        <span key={col.name} className="badge badge-info" style={{ fontSize: 10 }}>
                                            {col.name}: {col.type}
                                        </span>
                                    ))}
                                </div>

                                {/* Data table */}
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                {tableData.columns?.map((col: any) => (
                                                    <th key={col.name}>{col.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.rows?.length === 0 ? (
                                                <tr><td colSpan={tableData.columns?.length || 1} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data</td></tr>
                                            ) : (
                                                tableData.rows?.map((row: any, i: number) => (
                                                    <tr key={i}>
                                                        {tableData.columns?.map((col: any) => (
                                                            <td key={col.name} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {row[col.name] === null ? <span style={{ color: 'var(--text-muted)' }}>NULL</span> : String(row[col.name])}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Migrations */}
                <div className="card" style={{ marginTop: 16 }}>
                    <div className="card-header">Migration Files ({migrations.length})</div>
                    {migrations.map(m => (
                        <div key={m.name} style={{ padding: '6px 0', fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                            📄 {m.name}
                        </div>
                    ))}
                    {migrations.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No migrations</div>}
                </div>
            </div>
        </AdminLayout>
    );
}
