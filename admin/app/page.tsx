'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';
import {
    Activity,
    Cpu,
    HardDrive,
    Route,
    Layers,
    ExternalLink,
    Boxes,
    Wrench,
    Database as DbIcon,
    GitBranch,
    Settings,
    Play
} from 'lucide-react';

const API = '/api/_admin';

interface Overview {
    framework: string;
    version: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
    uptimeFormatted: string;
    memory: { rss: string; heapUsed: string; heapTotal: string };
    cpu: string;
    pid: number;
    env: string;
    port: string;
}

export default function DashboardPage() {
    const [overview, setOverview] = useState<Overview | null>(null);
    const [routes, setRoutes] = useState<any[]>([]);
    const [tables, setTables] = useState<string[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        adminFetch(`${API}/overview`).then(r => r.json()).then(setOverview).catch(() => setError('Cannot reach HyperZ API'));
        adminFetch(`${API}/routes`).then(r => r.json()).then(d => setRoutes(d.routes || [])).catch(() => { });
        adminFetch(`${API}/database/tables`).then(r => r.json()).then(d => setTables(d.tables || [])).catch(() => { });
    }, []);

    return (
        <AdminLayout>
            {/* Topbar */}
            <header className="px-10 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)] sticky top-0 z-50 backdrop-blur-3xl">
                <h1 className="font-tactical text-sm tracking-[2px] font-bold text-[var(--text)] flex items-center gap-3">
                    <Activity className="text-[var(--accent)] w-5 h-5 animate-pulse" />
                    SYSTEM_DASHBOARD_LIVE
                </h1>
                <span className="font-mono text-[var(--accent-secondary)] text-[11px] uppercase opacity-80">
                    {overview ? `${overview.framework} v${overview.version} • ${overview.env}` : 'Connecting...'}
                </span>
            </header>

            <div className="p-10 space-y-10">
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-sm p-6 animate-in slide-in-from-top-4 duration-500">
                        <p className="text-rose-500 font-medium flex items-center gap-2 italic">
                            ⚠️ {error} — Make sure HyperZ is running on port 7700
                        </p>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <StatCard
                        label="Uptime"
                        value={overview?.uptimeFormatted || '—'}
                        sub={`PID: ${overview?.pid || '—'}`}
                        icon={<Activity className="text-indigo-500" size={16} />}
                    />
                    <StatCard
                        label="Memory (Heap)"
                        value={overview?.memory?.heapUsed || '—'}
                        sub={`of ${overview?.memory?.heapTotal || '—'}`}
                        icon={<HardDrive className="text-emerald-500" size={16} />}
                    />
                    <StatCard
                        label="Endpoints"
                        value={routes.length.toString()}
                        sub="Registered routes"
                        icon={<Route className="text-blue-500" size={16} />}
                    />
                    <StatCard
                        label="Database"
                        value={tables.length.toString()}
                        sub="Active tables"
                        icon={<DbIcon className="text-amber-500" size={16} />}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* System Info Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--border-bright)] transition-all duration-300">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--accent)] rounded-tl-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-semibold mb-6 pb-3 border-b border-[var(--border)] flex items-center gap-2">
                            <Boxes size={14} /> // SYSTEM_ENVIRONMENT_INFO
                        </h2>

                        <div className="space-y-4 font-mono text-xs">
                            <InfoRow label="Node.js" value={overview?.nodeVersion || '—'} />
                            <InfoRow label="Platform" value={overview?.platform || '—'} />
                            <InfoRow label="Architecture" value={overview?.arch || '—'} />
                            <InfoRow label="CPU" value={overview?.cpu || '—'} />
                            <InfoRow label="Port" value={overview?.port || '—'} />
                            <InfoRow label="Env" value={<span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded-sm font-bold">{overview?.env || '—'}</span>} />
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--border-bright)] transition-all duration-300">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--accent)] rounded-tl-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-semibold mb-6 pb-3 border-b border-[var(--border)] flex items-center gap-2">
                            <Wrench size={14} /> // OPERATIONAL_QUICK_ACTIONS
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <ActionLink href="/scaffold" label="Scaffold Engine" icon={<Hammer size={16} />} />
                            <ActionLink href="/database" label="Database Manager" icon={<DbIcon size={16} />} />
                            <ActionLink href="/packages" label="Package Hub" icon={<Boxes size={16} />} />
                            <ActionLink href="/routes" label="Route Map" icon={<Route size={16} />} />
                            <ActionLink href="/config" label="Environment" icon={<Settings size={16} />} />
                            <a href="http://localhost:7700/api/playground" target="_blank" rel="noreferrer"
                                className="flex items-center gap-3 px-5 py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-tactical uppercase tracking-widest rounded-sm transition-all shadow-lg shadow-violet-500/20 group/btn relative overflow-hidden">
                                <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                                <Play size={16} fill="currentColor" /> Open Playground
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function StatCard({ label, value, sub, icon }: { label: string, value: string, sub: string, icon: React.ReactNode }) {
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-6 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--border-bright)] transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <span className="font-tactical text-[10px] uppercase tracking-[1.5px] text-[var(--text-muted)]">{label}</span>
                {icon}
            </div>
            <div className="font-mono text-3xl font-bold text-[var(--text)] mb-2 tracking-tight group-hover:text-[var(--accent)] transition-colors italic">{value}</div>
            <div className="font-mono text-[11px] text-[var(--accent-secondary)] opacity-80 font-bold">{sub}</div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </div>
    );
}

function InfoRow({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between border-b border-slate-500/5 pb-2 last:border-0">
            <span className="text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
            <span className="text-[var(--text)] font-bold italic">{value}</span>
        </div>
    );
}

function ActionLink({ href, label, icon }: { href: string, label: string, icon: React.ReactNode }) {
    return (
        <a href={href} className="flex items-center gap-3 px-5 py-3.5 bg-white/5 border border-[var(--border)] hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/5 text-[var(--text)] text-[11px] font-tactical uppercase tracking-widest rounded-sm transition-all group">
            <span className="opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
            {label}
        </a>
    );
}

function Hammer(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
            <path d="M17.64 15 22 10.64" />
            <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a2.3 2.3 0 0 0-3.37 0l-2.01 2.01c-.6.6-1.4.93-2.25.93h-.86L4.78 10.6c-.6.6-.93 1.4-.93 2.25v.86L6.5 16.36c.6.6 1.4.93 2.25.93h.86l2.12 2.12" />
            <path d="m13.5 13.5 3 3" />
        </svg>
    )
}
