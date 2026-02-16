'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';
import {
    Rocket,
    Gamepad2,
    Box,
    FileText,
    Sprout,
    ShieldCheck,
    GitMerge,
    Zap,
    Factory,
    Activity,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Search,
    ChevronRight,
    SearchCode
} from 'lucide-react';

const API = '/api/_admin';

const scaffoldTypes = [
    { value: 'resource', label: 'RESOURCE', icon: <Rocket size={20} />, description: 'Model + Migration + Controller + Route' },
    { value: 'controller', label: 'CONTROLLER', icon: <Gamepad2 size={20} />, description: 'Logic Handler' },
    { value: 'model', label: 'MODEL', icon: <Box size={20} />, description: 'Data Structure', hasMigration: true },
    { value: 'migration', label: 'MIGRATION', icon: <FileText size={20} />, description: 'DB Schema Change' },
    { value: 'seeder', label: 'SEEDER', icon: <Sprout size={20} />, description: 'Test Data' },
    { value: 'middleware', label: 'MIDDLEWARE', icon: <ShieldCheck size={20} />, description: 'Request Filter' },
    { value: 'route', label: 'ROUTE', icon: <GitMerge size={20} />, description: 'URL Routing' },
    { value: 'job', label: 'JOB', icon: <Zap size={20} />, description: 'Background Task' },
    { value: 'factory', label: 'FACTORY', icon: <Factory size={20} />, description: 'Data Generator' },
];

interface Discovery {
    models: string[];
    controllers: string[];
    routes: string[];
    migrations: { name: string; path: string }[];
    total: number;
}

export default function ScaffoldPage() {
    const [type, setType] = useState('resource');
    const [name, setName] = useState('');
    const [withMigration, setWithMigration] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [discovery, setDiscovery] = useState<Discovery | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await adminFetch(`${API}/scaffold/discovery`);
            const data = await res.json();
            setDiscovery(data);
        } catch (err) {
            console.error('Discovery failed', err);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const selected = scaffoldTypes.find(s => s.value === type)!;

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await adminFetch(`${API}/scaffold/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), withMigration }),
            });
            const data = await res.json();
            setResult(data);
            if (data.success) {
                setName('');
                fetchData();
            }
        } catch (err: any) {
            setResult({ error: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            {/* Topbar */}
            <header className="px-10 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)] sticky top-0 z-50 backdrop-blur-3xl">
                <h1 className="font-tactical text-sm tracking-[2px] font-bold text-[var(--text)] flex items-center gap-3">
                    <Rocket className="text-[var(--accent)] w-5 h-5" />
                    SCAFFOLD_ENGINE_V2
                </h1>
                <span className="font-mono text-[var(--accent-secondary)] text-[11px] uppercase opacity-80 italic">
                    CORE: ACTIVE • DISCOVERY_PROTOCOL: ENABLED
                </span>
            </header>

            <div className="p-10 space-y-10">
                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-8">

                    {/* Left: Creator */}
                    <div className="space-y-6">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--border-bright)] transition-all duration-300">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--accent)] rounded-tl-sm opacity-0 group-hover:opacity-100 transition-opacity" />

                            <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-semibold mb-6 pb-3 border-b border-[var(--border)] flex items-center gap-2 text-[var(--text)]">
                                 // SELECT_BLUEPRINT
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                                {scaffoldTypes.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => { setType(s.value); setResult(null); }}
                                        className={`
                                            flex flex-col items-center gap-3 p-5 rounded-sm border transition-all duration-300 relative overflow-hidden
                                            ${type === s.value
                                                ? 'bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_15px_var(--accent-glow)]'
                                                : 'bg-white/5 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-secondary)] hover:text-[var(--text)] hover:bg-slate-500/5'}
                                        `}
                                    >
                                        <div className={`transition-transform duration-300 ${type === s.value ? 'scale-110 text-[var(--accent)]' : ''}`}>
                                            {s.icon}
                                        </div>
                                        <span className="font-tactical text-[9px] tracking-wider uppercase font-bold">{s.label}</span>
                                        {type === s.value && <div className="absolute top-1 right-1"><CheckCircle2 size={10} className="text-[var(--accent)]" /></div>}
                                    </button>
                                ))}
                            </div>

                            <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-semibold mb-6 pb-3 border-b border-[var(--border)] flex items-center gap-2 text-[var(--text)]">
                                // EXECUTION_PARAMETERS
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <div className="text-[10px] text-[var(--accent)] font-tactical uppercase tracking-widest mb-2 font-bold opacity-80">Target_Name</div>
                                    <input
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] px-4 py-3 font-mono text-sm rounded-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-glow)] transition-all placeholder:text-[var(--text-muted)] opacity-80"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder={`e.g. ${type === 'resource' ? 'Order' : 'User'}`}
                                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                    />
                                    <div className="text-[10px] text-[var(--text-muted)] mt-2 font-mono flex items-center gap-2 italic font-medium">
                                        <ChevronRight size={10} /> TYPE: {selected.label} • {selected.description.toUpperCase()}
                                    </div>
                                </div>

                                {selected.hasMigration && (
                                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${withMigration ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-transparent border-[var(--border)] group-hover:border-[var(--accent-secondary)]'}`}>
                                            {withMigration && <CheckCircle2 size={10} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={withMigration}
                                            onChange={e => setWithMigration(e.target.checked)}
                                        />
                                        <span className="text-[11px] font-tactical uppercase tracking-widest text-[var(--text)] opacity-80 group-hover:opacity-100 transition-opacity font-bold">Auto_Generate_Migration</span>
                                    </label>
                                )}

                                <button
                                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-tactical uppercase tracking-[2px] text-xs py-4 rounded-sm transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-3"
                                    onClick={handleCreate}
                                    disabled={loading || !name.trim()}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap size={16} fill="currentColor" />}
                                    {loading ? 'INITIALIZING_SCAFFOLD…' : `EXECUTE_SCAFFOLD_${selected.label}`}
                                </button>

                                {result && (
                                    <div className={`animate-in slide-in-from-bottom-2 duration-300 p-5 rounded-sm border font-mono text-xs ${result.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-rose-500/10 border-rose-500/30 text-rose-600'}`}>
                                        {result.success ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 font-bold uppercase"><CheckCircle2 size={14} /> Deployment_Successful:</div>
                                                <div className="space-y-1 pl-6 opacity-90 font-medium">
                                                    {result.created?.map((f: string) => (
                                                        <div key={f} className="flex items-center gap-2 text-[11px]"><ChevronRight size={10} /> {f}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 uppercase tracking-wide font-bold"><AlertCircle size={14} /> Error: {result.error}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Big Picture */}
                    <div className="space-y-6">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl h-fit relative group hover:border-[var(--border-bright)] transition-all duration-300">
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--accent)] rounded-tr-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-semibold mb-6 pb-3 border-b border-[var(--border)] flex items-center gap-2 text-[var(--text)]">
                                <SearchCode size={14} /> // SYSTEM_INVENTORY (BIG_PICTURE)
                            </h2>

                            {!discovery ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
                                    <Activity className="text-[var(--accent)] animate-spin" size={32} />
                                    <div className="font-mono text-[10px] uppercase tracking-widest italic animate-pulse whitespace-nowrap">Scanning_System_Resources…</div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <InventorySection title="Models" color="text-indigo-600" items={discovery.models} icon={<Box size={14} />} />
                                    <InventorySection title="Controllers" color="text-cyan-600" items={discovery.controllers} icon={<Gamepad2 size={14} />} />
                                    <InventorySection title="Routes" color="text-amber-600" items={discovery.routes} icon={<GitMerge size={14} />} />

                                    <div className="space-y-3">
                                        <div className="font-tactical text-[10px] uppercase tracking-widest text-emerald-600 flex items-center gap-2 font-bold">
                                            <Sprout size={14} /> Recent_Migrations
                                        </div>
                                        <div className="space-y-2 border-l border-[var(--border)] ml-1.5 pl-4">
                                            {discovery.migrations.length === 0 && <span className="text-[10px] opacity-40 italic">No records found</span>}
                                            {discovery.migrations.slice(-5).reverse().map(m => (
                                                <div key={m.name} className="font-mono text-[10px] text-[var(--text-muted)] flex items-center gap-2 hover:text-emerald-600 transition-colors cursor-default whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                                                    <ChevronRight size={10} className="shrink-0" /> {m.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-8 mt-10 border-t border-[var(--border)] flex flex-col items-center gap-2 opacity-50">
                                        <div className="font-mono text-[10px] uppercase tracking-[2px]">System_Resource_Density</div>
                                        <div className="font-tactical text-xl font-black text-[var(--text)]">{discovery.total} <span className="text-[var(--accent-secondary)]">UNITS</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function InventorySection({ title, color, items, icon }: { title: string, color: string, items: string[], icon: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className={`font-tactical text-[10px] uppercase tracking-widest ${color} flex items-center gap-2 font-bold`}>
                {icon} {title}
            </div>
            <div className="flex flex-wrap gap-2">
                {items.length === 0 && <span className="text-[10px] opacity-40 italic">None registered</span>}
                {items.map(item => (
                    <span key={item} className="bg-slate-500/5 border border-[var(--border)] rounded-sm px-2.5 py-1 font-mono text-[10px] text-[var(--text)] hover:bg-[var(--accent-glow)] hover:border-[var(--accent)] transition-all cursor-default font-bold">
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}
