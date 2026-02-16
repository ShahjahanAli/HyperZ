'use client';

import { useEffect, useState, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';
import {
    ScrollText,
    Search,
    ChevronRight,
    RefreshCcw,
    Pause,
    Play,
    FileJson,
    AlertTriangle,
    Info as InfoIcon,
    CheckCircle2,
    Terminal,
    ChevronDown,
    Clock
} from 'lucide-react';

const API = '/api/_admin';

export default function LogsPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [files, setFiles] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [filter, setFilter] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadLogs = async (file?: string) => {
        setLoading(true);
        const params = new URLSearchParams({ lines: '200' });
        if (file) params.set('file', file);

        try {
            const res = await adminFetch(`${API}/logs?${params}`);
            const data = await res.json();
            setLogs(data.logs || []);
            setFiles(data.files || []);
            if (data.file) setSelectedFile(data.file);
        } catch (err) {
            console.error('Failed to load logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLogs(); }, []);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => loadLogs(selectedFile), 3000);
        return () => clearInterval(interval);
    }, [autoRefresh, selectedFile]);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const filteredLogs = filter
        ? logs.filter(l => l.toLowerCase().includes(filter.toLowerCase()))
        : logs;

    const getLogInfo = (line: string) => {
        if (line.includes('ERROR') || line.includes('error') || line.includes('Error:')) {
            return { color: 'text-rose-600', icon: <AlertTriangle size={12} />, bg: 'bg-rose-500/5' };
        }
        if (line.includes('WARN') || line.includes('warn')) {
            return { color: 'text-amber-600', icon: <AlertTriangle size={12} />, bg: 'bg-amber-500/5' };
        }
        if (line.includes('INFO') || line.includes('info')) {
            return { color: 'text-emerald-700', icon: <InfoIcon size={12} />, bg: 'bg-emerald-500/5' };
        }
        if (line.includes('DEBUG') || line.includes('debug')) {
            return { color: 'text-cyan-700', icon: <Terminal size={12} />, bg: 'bg-cyan-500/5' };
        }
        return { color: 'text-slate-600', icon: <ChevronRight size={10} />, bg: '' };
    };

    return (
        <AdminLayout>
            {/* Topbar */}
            <header className="px-10 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)] sticky top-0 z-50 backdrop-blur-3xl">
                <h1 className="font-tactical text-sm tracking-[2px] font-bold text-[var(--text)] flex items-center gap-3">
                    <ScrollText className="text-[var(--accent)] w-5 h-5 animate-pulse" />
                    LIVE_SYSTEM_TELEMETRY
                </h1>
                <span className="font-mono text-[var(--accent-secondary)] text-[11px] uppercase opacity-80 italic flex items-center gap-3 font-bold">
                    <Clock size={12} /> {new Date().toLocaleTimeString()} • {files.length}_LOG_CHANNELS
                </span>
            </header>

            <div className="p-10 space-y-6 flex flex-col h-[calc(100vh-80px)]">
                {/* Control Panel */}
                <div className="flex flex-col lg:flex-row items-center gap-4 bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-sm shadow-xl">
                    <div className="relative group flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
                        <input
                            className="w-full bg-slate-500/5 border border-[var(--border)] text-[var(--text)] pl-11 pr-4 py-2.5 font-mono text-xs rounded-sm focus:outline-none focus:border-[var(--accent-secondary)] transition-all placeholder:text-[var(--text-muted)] font-bold italic"
                            placeholder="FILTER_STREAM_VIA_STRING…"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="relative group min-w-[200px]">
                            <FileJson className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--accent-secondary)] pointer-events-none" />
                            <select
                                className="bg-slate-500/5 border border-[var(--border)] text-[var(--text)] pl-11 pr-10 py-2.5 font-tactical text-[9px] uppercase tracking-widest rounded-sm focus:outline-none focus:border-[var(--accent)] transition-all appearance-none cursor-pointer w-full font-black"
                                value={selectedFile}
                                onChange={e => { setSelectedFile(e.target.value); loadLogs(e.target.value); }}
                            >
                                {files.map(f => <option key={f} value={f} className="bg-white text-slate-900">{f}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none" />
                        </div>

                        <button
                            className={`
                                flex items-center justify-center gap-2 px-6 py-2.5 font-tactical text-[9px] font-black uppercase tracking-widest transition-all rounded-sm min-w-[140px]
                                ${autoRefresh
                                    ? 'bg-[var(--accent)] text-white shadow-lg shadow-violet-500/20'
                                    : 'bg-slate-500/5 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}
                            `}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                        >
                            {autoRefresh ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                            {autoRefresh ? 'PAUSE_STREAM' : 'RESUME_STREAM'}
                        </button>

                        <button
                            className="bg-slate-500/5 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] p-2.5 rounded-sm transition-all flex items-center justify-center font-bold"
                            onClick={() => loadLogs(selectedFile)}
                            title="Force Refresh"
                        >
                            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Log Viewport */}
                <div className="flex-1 min-h-0 bg-slate-500/5 border border-[var(--border)] rounded-sm overflow-hidden flex flex-col group/viewport hover:border-[var(--border-bright)] transition-all duration-300">
                    <div className="bg-slate-500/5 border-b border-[var(--border)] px-4 py-2 flex items-center justify-between">
                        <div className="font-tactical text-[8px] uppercase tracking-[2px] text-[var(--text-muted)] flex items-center gap-2 font-black">
                            <div className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                            TERMINAL_OUT_01: {selectedFile || 'DEFAULT'}
                        </div>
                        {loading && <div className="font-mono text-[8px] uppercase tracking-widest text-[var(--accent)] animate-pulse font-black">Syncing…</div>}
                    </div>

                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-auto p-6 font-mono text-[11px] leading-relaxed custom-scrollbar bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-95 font-bold"
                    >
                        {filteredLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30 py-20">
                                <ScrollText size={32} />
                                <div className="font-tactical text-[9px] uppercase tracking-[3px]">Awaiting_Telemetry_Data…</div>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredLogs.map((line, i) => {
                                    const { color, icon, bg } = getLogInfo(line);
                                    return (
                                        <div key={i} className={`flex items-start gap-4 py-1 px-3 rounded-sm transition-colors hover:bg-slate-500/10 group/line ${bg}`}>
                                            <span className="text-[var(--text-muted)] opacity-30 text-[9px] w-6 shrink-0 mt-0.5 group-hover/line:opacity-50 font-bold">{i + 1}</span>
                                            <span className={`mt-1 shrink-0 ${color}`}>{icon}</span>
                                            <span className={`break-all whitespace-pre-wrap ${color}`}>{line}</span>
                                        </div>
                                    );
                                })}
                                <div className="h-4" /> {/* Spacer for bottom */}
                            </div>
                        )}
                    </div>

                    {/* Viewport Meta */}
                    <div className="px-5 py-2.5 border-t border-[var(--border)] bg-slate-500/5 flex justify-between items-center text-[9px] font-mono whitespace-nowrap overflow-hidden">
                        <div className="text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-4 font-bold">
                            <span>BUFF_CAP: 200_LINES</span>
                            <span className="opacity-40">|</span>
                            <span>FILTER_MATCH: {filteredLogs.length}</span>
                        </div>
                        <div className="text-[var(--accent-secondary)] opacity-60 uppercase flex items-center gap-2 font-bold">
                            SYSTEM_CLOCK: {new Date().toISOString()} <CheckCircle2 size={10} />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
