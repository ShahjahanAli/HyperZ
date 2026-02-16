'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';
import {
    GitBranch,
    Route as RouteIcon,
    Search,
    ChevronRight,
    Filter,
    Network,
    Hash,
    Layers,
    Activity,
    SearchCode
} from 'lucide-react';

const API = '/api/_admin';

export default function RoutesPage() {
    const [routes, setRoutes] = useState<any[]>([]);
    const [filter, setFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('ALL');

    useEffect(() => {
        adminFetch(`${API}/routes`).then(r => r.json()).then(d => setRoutes(d.routes || [])).catch(() => { });
    }, []);

    const methods = ['ALL', ...Array.from(new Set(routes.map((r: any) => r.method)))];
    const filtered = routes.filter(r => {
        if (methodFilter !== 'ALL' && r.method !== methodFilter) return false;
        if (filter && !r.path.toLowerCase().includes(filter.toLowerCase())) return false;
        return true;
    });

    return (
        <AdminLayout>
            {/* Topbar */}
            <header className="px-10 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)] sticky top-0 z-50 backdrop-blur-3xl">
                <h1 className="font-tactical text-sm tracking-[2px] font-bold text-[var(--text)] flex items-center gap-3">
                    <RouteIcon className="text-[var(--accent)] w-5 h-5" />
                    ROUTE_MAP_RECON
                </h1>
                <span className="font-mono text-[var(--accent-secondary)] text-[11px] uppercase opacity-80 italic">
                    {routes.length}_ACTIVE_ENDPOINTS_IDENTIFIED
                </span>
            </header>

            <div className="p-10 space-y-8">
                {/* Filters */}
                <div className="flex flex-col md:flex-row items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
                        <input
                            className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] pl-11 pr-4 py-3.5 font-mono text-xs rounded-sm focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-muted)] font-bold italic"
                            placeholder="FILTER_BY_ENDPOINT_PATH…"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>

                    <div className="relative group w-full md:w-auto">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none" />
                        <select
                            className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] pl-11 pr-10 py-3.5 font-tactical text-[10px] uppercase tracking-widest rounded-sm focus:outline-none focus:border-[var(--accent)] transition-all appearance-none cursor-pointer w-full md:w-[160px] font-black"
                            value={methodFilter}
                            onChange={e => setMethodFilter(e.target.value)}
                        >
                            {methods.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] rotate-90 pointer-events-none" />
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm backdrop-blur-xl relative overflow-hidden group hover:border-[var(--border-bright)] transition-all duration-300 shadow-xl shadow-slate-200/50">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--accent)] rounded-tl-sm opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse border-hidden">
                            <thead>
                                <tr className="bg-slate-500/5 border-b border-[var(--border)]">
                                    <th className="px-8 py-5 font-tactical text-[10px] uppercase tracking-[3px] text-[var(--text-muted)] font-black w-32 border-r border-[var(--border)]">
                                        <div className="flex items-center gap-2"><Layers size={14} /> METHOD</div>
                                    </th>
                                    <th className="px-8 py-5 font-tactical text-[10px] uppercase tracking-[3px] text-[var(--text-muted)] font-black">
                                        <div className="flex items-center gap-2"><SearchCode size={14} /> ENDPOINT_PATH_SPECIFICATION</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-8 py-20 text-center text-[var(--text-muted)] animate-pulse uppercase tracking-[4px] italic opacity-40 font-bold">
                                            No_Routes_Matching_Search_Query
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-500/5 transition-all duration-150 group/row italic">
                                            <td className="px-8 py-5 border-r border-[var(--border)] bg-slate-500/5 font-bold">
                                                <MethodBadge method={r.method} />
                                            </td>
                                            <td className="px-8 py-5 font-bold tracking-tight text-[var(--text)] group-hover:text-[var(--accent)] transition-all flex items-center gap-3">
                                                <span className="text-[var(--text-muted)] opacity-30 not-italic shrink-0">//</span>
                                                <span className="break-all">{r.path || '/'}</span>
                                                <a
                                                    href={`http://localhost:7700${r.path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="opacity-0 group-hover/row:opacity-100 transition-opacity ml-auto p-1.5 hover:bg-[var(--accent)] hover:text-white rounded-sm text-[var(--text-muted)]"
                                                >
                                                    <Activity size={12} />
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="p-4 border-t border-[var(--border)] bg-slate-500/5 flex justify-between items-center">
                        <div className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> SYSTEM_ROUTE_DISCOVERY_SYNCED
                        </div>
                        <div className="font-tactical text-[9px] text-[var(--accent-secondary)] uppercase tracking-[2px] font-black">
                            Total_RESULTS: {filtered.length}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function MethodBadge({ method }: { method: string }) {
    const colors: Record<string, string> = {
        GET: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        POST: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        PUT: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        DELETE: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
        PATCH: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
        HEAD: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
        OPTIONS: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
    };

    const colorClass = colors[method] || 'bg-slate-500/10 text-slate-600 border-slate-500/30';

    return (
        <span className={`px-2.5 py-1 font-tactical text-[10px] font-black border uppercase tracking-widest rounded-sm shadow-sm ${colorClass}`}>
            {method}
        </span>
    );
}
