'use client';

import React, { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    Trash2,
    Search,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ExternalLink,
    Box,
    Layers,
    Code2,
    RefreshCw
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface PackageInfo {
    name: string;
    version: string;
    type: 'prod' | 'dev';
}

export default function PackagePage() {
    const [packages, setPackages] = useState<PackageInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);
    const [newPkgName, setNewPkgName] = useState('');
    const [isDev, setIsDev] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchPackages = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/_admin/packages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setPackages(data);
            }
        } catch (err) {
            console.error('Failed to fetch packages:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleAction = async (action: 'install' | 'remove', name: string) => {
        const token = localStorage.getItem('admin_token');
        const endpoint = `/api/_admin/packages/${action}`;

        if (action === 'install') setInstalling(true);
        setMessage(null);

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, isDev })
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: `Successfully ${action === 'install' ? 'installed' : 'removed'} ${name}` });
                fetchPackages();
                if (action === 'install') setNewPkgName('');
            } else {
                setMessage({ type: 'error', text: data.error || `Failed to ${action} package` });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error occurred' });
        } finally {
            setInstalling(false);
        }
    };

    const filteredPackages = packages.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const prodDeps = filteredPackages.filter(p => p.type === 'prod');
    const devDeps = filteredPackages.filter(p => p.type === 'dev');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Scanning package.json...</p>
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className="p-10 space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-8">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3 text-[var(--text)] font-tactical italic tracking-tighter">
                            <Box className="w-8 h-8 text-[var(--accent)]" />
                            PACKAGE_MANAGER_HQ
                        </h1>
                        <p className="text-[var(--text-muted)] mt-2 font-mono text-[11px] uppercase tracking-widest font-bold italic">Manage project dependencies via cloud orchestration.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchPackages}
                            className="p-2.5 hover:bg-slate-500/10 rounded-sm transition-colors text-[var(--text-muted)] border border-transparent hover:border-[var(--border)]"
                            title="Refresh List"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <div className="bg-[var(--accent-glow)] border border-[var(--accent)] px-5 py-2.5 rounded-sm shadow-xl shadow-slate-200/50">
                            <span className="text-[var(--accent)] font-black italic">{packages.length}</span>
                            <span className="text-[var(--text-muted)] ml-3 text-[10px] uppercase tracking-[2px] font-tactical font-black">ACTIVE_DEPENDENCIES</span>
                        </div>
                    </div>
                </header>

                {/* Notifications */}
                {message && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top ${message.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Search & Install */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-sm shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-[var(--border-bright)] transition-all">
                            <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-black mb-6 pb-3 border-b border-[var(--border)] italic flex items-center gap-2">
                                <Plus className="w-4 h-4 text-emerald-600" />
                            // INSTALL_DEPENDENCY
                            </h2>
                            <div className="space-y-6">
                                <div className="relative">
                                    <Box className="absolute left-4 top-3.5 w-4 h-4 text-[var(--text-muted)] opacity-50" />
                                    <input
                                        type="text"
                                        placeholder="DEPENDENCY_PKG_NAME"
                                        value={newPkgName}
                                        onChange={(e) => setNewPkgName(e.target.value)}
                                        className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-sm py-3 pl-12 pr-4 text-[var(--text)] font-mono text-[11px] focus:outline-none focus:border-[var(--accent-secondary)] transition-all uppercase placeholder:opacity-30 font-bold italic"
                                    />
                                </div>

                                <label className="flex items-center gap-4 cursor-pointer group/label">
                                    <div className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-all ${isDev ? 'bg-[var(--accent-secondary)] border-[var(--accent-secondary)]' : 'border-[var(--border)] bg-[var(--bg-input)] group-hover/label:border-[var(--accent-secondary)]'
                                        }`}>
                                        {isDev && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={isDev} onChange={() => setIsDev(!isDev)} />
                                    <span className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest italic group-hover/label:text-[var(--text)]">Install as devDependency</span>
                                </label>

                                <button
                                    onClick={() => handleAction('install', newPkgName)}
                                    disabled={installing || !newPkgName}
                                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-black py-4 rounded-sm transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] font-tactical"
                                >
                                    {installing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    {installing ? 'INSTALLING…' : 'DEPLOY_PKG_DATA'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 rounded-sm shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-[var(--border-bright)] transition-all">
                            <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-black mb-6 pb-3 border-b border-[var(--border)] italic flex items-center gap-2">
                                <Search className="w-4 h-4 text-indigo-600" />
                            // SEARCH_FILTER_SYNC
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 w-4 h-4 text-[var(--text-muted)] opacity-50" />
                                <input
                                    type="text"
                                    placeholder="FILTER_INSTALLED_KEYS"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-sm py-3 pl-12 pr-4 text-[var(--text)] font-mono text-[11px] focus:outline-none focus:border-[var(--accent)] transition-all uppercase placeholder:opacity-30 font-bold italic"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Package Lists */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Dependencies */}
                        <DependencySection
                            title="Dependencies"
                            icon={<Layers className="w-5 h-5 text-blue-400" />}
                            packages={prodDeps}
                            onRemove={(name) => handleAction('remove', name)}
                        />

                        {/* DevDependencies */}
                        <DependencySection
                            title="Dev Dependencies"
                            icon={<Code2 className="w-5 h-5 text-purple-400" />}
                            packages={devDeps}
                            onRemove={(name) => handleAction('remove', name)}
                        />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function DependencySection({ title, icon, packages, onRemove }: {
    title: string,
    icon: React.ReactNode,
    packages: PackageInfo[],
    onRemove: (name: string) => void
}) {
    return (
        <section className="space-y-6">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-3 italic">
                {icon}
                {title}
                <span className="ml-2 px-2.5 py-0.5 bg-[var(--accent-glow)] border border-[var(--accent)] rounded-sm text-[9px] lowercase tracking-normal text-[var(--accent)]">
                    {packages.length}_PKGS
                </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-slate-500/5 border border-dashed border-[var(--border)] rounded-sm text-[var(--text-muted)] italic font-bold uppercase tracking-widest text-[11px]">
                        NO_MATCHING_DEPENDENCY_DETECTED
                    </div>
                ) : (
                    packages.map((pkg) => (
                        <div
                            key={pkg.name}
                            className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-sm flex items-center justify-between group hover:border-[var(--border-bright)] hover:shadow-xl hover:shadow-slate-200/50 transition-all relative overflow-hidden"
                        >
                            <div className="min-w-0 pr-4">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-[var(--text)] font-black truncate group-hover:text-[var(--accent)] transition-colors italic tracking-tight">
                                        {pkg.name}
                                    </h4>
                                    <a
                                        href={`https://www.npmjs.com/package/${pkg.name}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                                    </a>
                                </div>
                                <p className="text-[var(--text-muted)] text-[10px] font-mono mt-1 select-all font-bold">
                                    {pkg.version.replace(/[\^~]/, 'v')}
                                </p>
                            </div>

                            <button
                                onClick={() => onRemove(pkg.name)}
                                className="p-3 text-[var(--red)] opacity-40 hover:opacity-100 hover:bg-rose-500/10 rounded-sm transition-all border border-transparent hover:border-rose-500/30"
                                title="Uninstall Package"
                            >
                                <Trash2 className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
