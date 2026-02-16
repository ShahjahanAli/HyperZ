'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';
import {
    Settings,
    FileText,
    Plus,
    Save,
    Trash2,
    Code2,
    Info,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    Terminal
} from 'lucide-react';

const API = '/api/_admin';

interface EnvVar { key?: string; value?: string; comment?: string; }

export default function ConfigPage() {
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);
    const [configs, setConfigs] = useState<any[]>([]);
    const [selectedConfig, setSelectedConfig] = useState('');
    const [configContent, setConfigContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [tab, setTab] = useState<'env' | 'config'>('env');

    useEffect(() => {
        adminFetch(`${API}/env`).then(r => r.json()).then(d => setEnvVars(d.variables || [])).catch(() => { });
        adminFetch(`${API}/config`).then(r => r.json()).then(d => {
            setConfigs(d.files || []);
            if (d.files?.length > 0) {
                setSelectedConfig(d.files[0].name);
                setConfigContent(d.files[0].content);
            }
        }).catch(() => { });
    }, []);

    const saveEnv = async () => {
        setSaving(true);
        try {
            await adminFetch(`${API}/env`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variables: envVars }),
            });
            setToast('✅ .env saved');
            setTimeout(() => setToast(''), 3000);
        } catch {
            setToast('❌ Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const updateEnvVar = (index: number, field: 'key' | 'value', val: string) => {
        const updated = [...envVars];
        updated[index] = { ...updated[index], [field]: val };
        setEnvVars(updated);
    };

    const addEnvVar = () => setEnvVars([...envVars, { key: '', value: '' }]);
    const removeEnvVar = (i: number) => setEnvVars(envVars.filter((_, idx) => idx !== i));

    const selectConfig = (name: string) => {
        setSelectedConfig(name);
        const file = configs.find(c => c.name === name);
        setConfigContent(file?.content || '');
    };

    return (
        <AdminLayout>
            {/* Topbar */}
            <header className="px-10 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)] sticky top-0 z-50 backdrop-blur-3xl">
                <h1 className="font-tactical text-sm tracking-[2px] font-bold text-[var(--text)] flex items-center gap-3">
                    <Settings className="text-[var(--accent)] w-5 h-5 animate-[spin_4s_linear_infinite]" />
                    CONFIG_CENTER_V2
                </h1>
                <span className="font-mono text-[var(--accent-secondary)] text-[11px] uppercase opacity-80 italic">
                    {envVars.filter(v => v.key).length}_ENV_VARS_LOADED • {configs.length}_SYSTEM_CONFIGS
                </span>
            </header>

            <div className="p-10 space-y-8">
                {/* Tab Switcher */}
                <div className="flex bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-sm w-fit">
                    <TabButton active={tab === 'env'} onClick={() => setTab('env')} label="Environment" icon={<Terminal size={14} />} />
                    <TabButton active={tab === 'config'} onClick={() => setTab('config')} label="System Config" icon={<Code2 size={14} />} />
                </div>

                {tab === 'env' && (
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl relative group hover:border-[var(--border-bright)] transition-all duration-300">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--accent)] rounded-tl-sm opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-[var(--border)] pb-6">
                            <div>
                                <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--text)] font-black flex items-center gap-2">
                                    <FileText size={14} /> // .ENV_ENVIRONMENT_SPEC
                                </h2>
                                <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono uppercase italic font-medium">Critical system variables and secret keys</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-500/5 border border-[var(--border)] hover:border-[var(--accent-secondary)] hover:text-[var(--accent-secondary)] text-[10px] font-tactical uppercase tracking-widest rounded-sm transition-all font-bold" onClick={addEnvVar}>
                                    <Plus size={14} /> Add_Var
                                </button>
                                <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[10px] font-tactical uppercase tracking-widest rounded-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40 font-bold" onClick={saveEnv} disabled={saving}>
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {saving ? 'Saving…' : 'Commit_Changes'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {envVars.map((v, i) => {
                                if (v.comment !== undefined) {
                                    return (
                                        <div key={i} className="py-3 px-4 bg-white/[0.02] border-l-2 border-indigo-500/20 text-[11px] text-[var(--text-muted)] font-mono italic opacity-60 flex items-center gap-3">
                                            <Info size={12} className="shrink-0" />
                                            {v.comment}
                                        </div>
                                    );
                                }
                                return (
                                    <div key={i} className="flex items-center gap-3 group/row animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${i * 20}ms` }}>
                                        <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-3 flex-1">
                                            <input
                                                className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] px-4 py-2.5 font-mono text-[11px] rounded-sm focus:outline-none focus:border-[var(--accent-secondary)] transition-all uppercase placeholder:opacity-30 font-bold italic"
                                                value={v.key || ''}
                                                onChange={e => updateEnvVar(i, 'key', e.target.value)}
                                                placeholder="VARIABLE_KEY"
                                            />
                                            <input
                                                className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] px-4 py-2.5 font-mono text-[11px] rounded-sm focus:outline-none focus:border-[var(--accent)] transition-all placeholder:opacity-30 italic"
                                                value={v.value || ''}
                                                onChange={e => updateEnvVar(i, 'value', e.target.value)}
                                                placeholder="variable_value"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeEnvVar(i)}
                                            className="p-2.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-sm transition-all opacity-0 group-hover/row:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {tab === 'config' && (
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 h-[600px]">
                        {/* Config List */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm overflow-hidden flex flex-col group transition-all duration-300 hover:border-[var(--border-bright)]">
                            <div className="p-4 bg-slate-500/5 border-b border-[var(--border)] font-tactical text-[10px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-bold flex items-center gap-2">
                                <Code2 size={14} /> Repository_Index
                            </div>
                            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                                {configs.map(c => (
                                    <button
                                        key={c.name}
                                        onClick={() => selectConfig(c.name)}
                                        className={`
                                            w-full px-5 py-3.5 flex items-center justify-between text-[11px] font-mono transition-all duration-200 border-l-[3px]
                                            ${selectedConfig === c.name
                                                ? 'bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent)] italic font-bold'
                                                : 'border-transparent text-[var(--text-muted)] hover:bg-slate-500/5 hover:text-[var(--text)]'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <ChevronRight size={10} className={selectedConfig === c.name ? 'text-[var(--accent)] animate-pulse' : 'opacity-40'} />
                                            {c.name}
                                        </div>
                                        <span className="text-[9px] opacity-40 font-sans tracking-normal not-italic px-1.5 py-0.5 border border-[var(--border)] rounded uppercase font-bold text-[var(--text-muted)]">TS</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Config Viewer */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl flex flex-col group hover:border-[var(--border-bright)] transition-all duration-300">
                            <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-semibold mb-6 pb-3 border-b border-[var(--border)] flex items-center gap-2 text-[var(--text)] font-black italic">
                                <Terminal size={14} /> // SOURCE_RECON: {selectedConfig}.ts
                            </h2>
                            <div className="flex-1 min-h-0 bg-slate-500/5 border border-[var(--border)] rounded-sm overflow-hidden p-6 relative">
                                <pre className="h-full overflow-auto custom-scrollbar font-mono text-[12px] leading-relaxed text-indigo-700/80 font-bold whitespace-pre-wrap">
                                    {configContent || '// Select a configuration file to inspect…'}
                                </pre>
                                <div className="absolute top-4 right-4 text-[9px] font-mono text-[var(--text-muted)] opacity-50 uppercase tracking-widest pointer-events-none bg-slate-500/10 px-2 py-1 rounded font-bold">
                                    READ_ONLY_PROTOCOL
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications */}
                {toast && (
                    <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-sm border shadow-2xl animate-in slide-in-from-right-8 duration-500 font-tactical text-[10px] uppercase tracking-widest flex items-center gap-3 z-[1000] ${toast.includes('✅') ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'}`}>
                        {toast.includes('✅') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {toast}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
    return (
        <button
            className={`
                flex items-center gap-2.5 px-6 py-3 font-tactical text-[10px] uppercase tracking-widest transition-all rounded-sm font-bold
                ${active
                    ? 'bg-[var(--accent)] text-white shadow-lg shadow-violet-500/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-slate-500/5'}
            `}
            onClick={onClick}
        >
            {icon}
            {label}
        </button>
    );
}
