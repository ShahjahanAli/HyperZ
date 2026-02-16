'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';
import {
    Database as DbIcon,
    Table,
    Play,
    RotateCcw,
    Sprout,
    Search,
    ChevronRight,
    FileText,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Database,
    Activity
} from 'lucide-react';

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
        adminFetch(`${API}/database/tables`).then(r => r.json()).then(d => { setTables(d.tables || []); setDriver(d.driver || ''); }).catch(() => { });
        adminFetch(`${API}/database/migrations`).then(r => r.json()).then(d => setMigrations(d.migrations || [])).catch(() => { });
    }, []);

    const loadTable = async (name: string) => {
        setSelectedTable(name);
        setTableData(null);
        const res = await adminFetch(`${API}/database/tables/${name}`);
        const data = await res.json();
        setTableData(data);
    };

    const runAction = async (action: string) => {
        setLoading(true);
        setActionResult(null);
        try {
            const res = await adminFetch(`${API}/database/${action}`, { method: 'POST' });
            const data = await res.json();
            setActionResult({ action, ...data });
            adminFetch(`${API}/database/tables`).then(r => r.json()).then(d => setTables(d.tables || []));
        } catch (err: any) {
            setActionResult({ error: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            {/* Topbar */}
            <header className="px-10 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)] sticky top-0 z-50 backdrop-blur-3xl">
                <h1 className="font-tactical text-sm tracking-[2px] font-bold text-[var(--text)] flex items-center gap-3">
                    <Database className="text-[var(--accent)] w-5 h-5" />
                    DATABASE_MANAGER_LIVE
                </h1>
                <span className="font-mono text-[var(--accent-secondary)] text-[11px] uppercase opacity-80 italic">
                    {driver ? `DRIVER: ${driver.toUpperCase()}` : 'SCANNING…'} • {tables.length} TABLES_DETECTED
                </span>
            </header>

            <div className="p-10 space-y-8">
                {/* Actions Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-sm backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-sm border border-indigo-500/20 text-indigo-600">
                            <DbIcon size={20} />
                        </div>
                        <div>
                            <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--text)] font-bold">Migration_Protocol</h2>
                            <p className="text-[var(--text-muted)] text-[10px] uppercase font-mono mt-1 italic font-medium">Execute schema synchronization tasks</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <ActionButton
                            onClick={() => runAction('migrate')}
                            loading={loading}
                            icon={<Play size={14} fill="currentColor" />}
                            label="Run Migrations"
                            variant="primary"
                        />
                        <ActionButton
                            onClick={() => runAction('rollback')}
                            loading={loading}
                            icon={<RotateCcw size={14} />}
                            label="Rollback"
                            variant="danger"
                        />
                        <ActionButton
                            onClick={() => runAction('seed')}
                            loading={loading}
                            icon={<Sprout size={14} />}
                            label="Run Seeders"
                            variant="secondary"
                        />
                    </div>
                </div>

                {actionResult && (
                    <div className={`p-6 rounded-sm border animate-in slide-in-from-top-4 duration-300 font-mono text-xs ${actionResult.error ? 'bg-rose-500/10 border-rose-500/30 text-rose-600' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'}`}>
                        <div className="flex items-start gap-3">
                            {actionResult.error ? <AlertCircle size={16} className="mt-0.5" /> : <CheckCircle2 size={16} className="mt-0.5" />}
                            <pre className="whitespace-pre-wrap flex-1 break-all overflow-x-auto max-h-[300px]">
                                {actionResult.error || JSON.stringify(actionResult, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                    {/* Tables Sidebar */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden h-fit flex flex-col group transition-all duration-300 hover:border-[var(--border-bright)]">
                        <div className="p-4 bg-slate-500/5 border-b border-[var(--border)] font-tactical text-[10px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-bold flex items-center gap-2">
                            <Table size={14} /> Inventory_Registry
                        </div>

                        <div className="max-h-[600px] overflow-y-auto py-2 custom-scrollbar">
                            {tables.length === 0 ? (
                                <div className="p-10 text-center text-[var(--text-muted)] italic text-xs font-mono uppercase tracking-widest opacity-50">
                                    No tables identified
                                </div>
                            ) : (
                                tables.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => loadTable(t)}
                                        className={`
                                            w-full px-5 py-3.5 flex items-center gap-3 text-xs font-mono transition-all duration-200 border-l-[3px]
                                            ${selectedTable === t
                                                ? 'bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent)] italic font-bold'
                                                : 'border-transparent text-[var(--text-muted)] hover:bg-slate-500/5 hover:text-[var(--text)]'}
                                        `}
                                    >
                                        <ChevronRight size={10} className={selectedTable === t ? 'text-[var(--accent)] animate-pulse' : 'opacity-40'} />
                                        {t}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Table Inspector */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--border-bright)] transition-all duration-300 min-h-[500px]">
                        {!selectedTable ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 py-32 opacity-30">
                                <Search size={48} className="text-[var(--text-muted)]" />
                                <div className="font-tactical text-[10px] uppercase tracking-[3px] text-center">
                                    AWAITING_TABLE_SELECTION…
                                    <p className="font-mono mt-2 lowercase not-italic tracking-normal">Detect current schema to browse data</p>
                                </div>
                            </div>
                        ) : !tableData ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 py-32">
                                <Activity className="text-[var(--accent)] animate-spin" size={32} />
                                <div className="font-mono text-[10px] uppercase tracking-widest italic animate-pulse">Syncing_Data…</div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
                                    <h2 className="font-tactical text-sm tracking-widest text-[var(--text)] flex items-center gap-3 uppercase font-black italic">
                                        {selectedTable}
                                        <span className="text-[10px] font-mono font-bold not-italic text-[var(--text-muted)] opacity-60 ml-2 uppercase tracking-tight">
                                            // [{tableData.pagination?.total || 0} RECORDS_LOADED]
                                        </span>
                                    </h2>
                                </div>

                                {/* Column Definitions */}
                                <div className="flex flex-wrap gap-2 uppercase font-mono">
                                    {tableData.columns?.map((col: any) => (
                                        <div key={col.name} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-sm group/col transition-colors hover:border-indigo-500/40 cursor-default">
                                            <span className="text-[10px] font-bold text-[var(--text)] shrink-0">{col.name}</span>
                                            <span className="text-[9px] text-indigo-600 opacity-70 group-hover/col:opacity-100 font-bold">{col.type}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Table Grid */}
                                <div className="overflow-x-auto border border-[var(--border)] rounded-sm bg-slate-500/5 custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="bg-slate-500/5 border-b border-[var(--border)]">
                                                {tableData.columns?.map((col: any) => (
                                                    <th key={col.name} className="px-5 py-4 font-tactical text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-black">
                                                        {col.name}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {tableData.rows?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={tableData.columns?.length || 1} className="px-5 py-12 text-center text-[var(--text-muted)] font-mono text-xs uppercase opacity-40 italic font-medium">
                                                        Empty_Record_Set
                                                    </td>
                                                </tr>
                                            ) : (
                                                tableData.rows?.map((row: any, i: number) => (
                                                    <tr key={i} className="hover:bg-slate-500/5 transition-colors group/row">
                                                        {tableData.columns?.map((col: any) => (
                                                            <td key={col.name} className="px-5 py-4 font-mono text-[11px] text-[var(--text)] group-hover/row:text-[var(--accent)] transition-colors max-w-[200px] truncate">
                                                                {row[col.name] === null ? (
                                                                    <span className="text-[var(--text-muted)] opacity-30 italic">NULL</span>
                                                                ) : String(row[col.name])}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Legacy Migrations List */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl group hover:border-[var(--border-bright)] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--accent)] rounded-tr-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-semibold mb-6 pb-3 border-b border-[var(--border)] flex items-center gap-2 text-[var(--text)]">
                        <FileText size={14} /> // MIGRATION_FILE_REPOSITORY ({migrations.length})
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {migrations.length === 0 ? (
                            <div className="col-span-full py-10 text-center text-[var(--text-muted)] opacity-40 uppercase tracking-widest text-xs font-mono italic font-medium">Void_State_Protocol_Triggered</div>
                        ) : (
                            migrations.map(m => (
                                <div key={m.name} className="p-3 bg-slate-500/5 border border-[var(--border)] hover:border-emerald-500/40 rounded-sm font-mono text-[11px] text-[var(--text-muted)] flex items-center gap-3 transition-colors cursor-default whitespace-nowrap overflow-hidden text-ellipsis group/file font-medium">
                                    <FileText size={12} className="text-emerald-600/60 group-hover/file:text-emerald-500 group-hover/file:animate-pulse" />
                                    <span className="group-hover/file:text-[var(--text)] transition-colors">{m.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function ActionButton({ onClick, loading, icon, label, variant }: { onClick: () => void, loading: boolean, icon: React.ReactNode, label: string, variant: 'primary' | 'danger' | 'secondary' }) {
    const variants = {
        primary: 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-lg shadow-violet-500/20',
        danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20',
        secondary: 'bg-slate-500/5 border border-[var(--border)] hover:bg-slate-500/10 text-[var(--text)]'
    };

    return (
        <button
            className={`
                flex items-center gap-2.5 px-6 py-3 rounded-sm font-tactical uppercase tracking-widest text-[9px] font-black transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] 
                ${variants[variant]}
            `}
            onClick={onClick}
            disabled={loading}
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
            {label}
        </button>
    );
}
