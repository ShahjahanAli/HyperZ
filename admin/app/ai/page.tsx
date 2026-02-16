'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';
import {
    Bot,
    Coins,
    Zap,
    Clock,
    CheckCircle2,
    Activity,
    BarChart3,
    Server,
    ShieldCheck,
    AlertCircle,
    ChevronRight,
    ArrowUpRight,
    Globe,
    Cpu
} from 'lucide-react';

interface AIStats {
    totalCost: number;
    totalTokens: number;
    providerHealth: Record<string, string>;
    usageByProvider: Record<string, number>;
    recentRequests: Array<{
        id: number;
        provider: string;
        model: string;
        tokens: number;
        cost: number;
        status: string;
        time: string;
    }>;
}

export default function AIPage() {
    const [stats, setStats] = useState<AIStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminFetch('/api/_admin/ai/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <AdminLayout>
            {/* Topbar */}
            <header className="px-10 py-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card)] sticky top-0 z-50 backdrop-blur-3xl">
                <h1 className="font-tactical text-sm tracking-[2px] font-bold text-[var(--text)] flex items-center gap-3">
                    <Bot className="text-[var(--accent)] w-5 h-5 animate-bounce" />
                    AI_GATEWAY_HQ
                </h1>
                <span className="font-mono text-[var(--accent-secondary)] text-[11px] uppercase opacity-80 italic font-bold">
                    MULTI_PROVIDER_ORCHESTRATION • COST_TRACKING: ENABLED
                </span>
            </header>

            <div className="p-10 space-y-10">
                {/* Metrics Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Estimated Cost (MTD)"
                        value={`$${stats?.totalCost?.toFixed(2) || '0.00'}`}
                        icon={<Coins className="text-amber-500" />}
                        trend="+12% from last cycle"
                    />
                    <MetricCard
                        title="Tokens Consumed"
                        value={stats?.totalTokens?.toLocaleString() || '0'}
                        icon={<Zap className="text-cyan-600" />}
                        trend="Avg 24k/request"
                    />
                    <MetricCard
                        title="Gateway Latency"
                        value="1.2s"
                        icon={<Clock className="text-emerald-600" />}
                        trend="Optimized via RAG-Cache"
                    />
                    <MetricCard
                        title="Active Agents"
                        value="4"
                        icon={<Activity className="text-indigo-600" />}
                        trend="Scale: NORMAL"
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-8">
                    {/* Recent Actions */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--border-bright)] transition-all duration-300 shadow-xl shadow-slate-200/50">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--accent)] rounded-tl-sm opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-center mb-6 pb-3 border-b border-[var(--border)]">
                            <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-black flex items-center gap-2 text-[var(--text)] italic">
                                <BarChart3 size={14} /> // RECENT_AI_OPERATIONS
                            </h2>
                            <button className="text-[9px] font-tactical uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text)] transition-colors font-bold">View_All_Logs</button>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left font-mono text-xs">
                                <thead>
                                    <tr className="text-[var(--text-muted)] opacity-70 uppercase tracking-widest font-black">
                                        <th className="py-4 pb-6 font-black">Model_Spec</th>
                                        <th className="py-4 pb-6 font-black">Tokens</th>
                                        <th className="py-4 pb-6 font-black">Cost_USD</th>
                                        <th className="py-4 pb-6 font-black text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {stats?.recentRequests.map(req => (
                                        <tr key={req.id} className="group/row hover:bg-slate-500/5 transition-colors">
                                            <td className="py-4">
                                                <div className="font-bold text-[var(--text)] group-hover/row:text-[var(--accent)] transition-colors">{req.model}</div>
                                                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-tight flex items-center gap-1 mt-0.5 font-bold italic">
                                                    <Globe size={10} /> {req.provider}
                                                </div>
                                            </td>
                                            <td className="py-4 text-indigo-700 font-bold italic">{req.tokens.toLocaleString()}</td>
                                            <td className="py-4 text-emerald-700 font-black italic">${req.cost.toFixed(4)}</td>
                                            <td className="py-4 text-right">
                                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded-sm text-[9px] font-black uppercase tracking-widest">
                                                    {req.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {!stats && !loading && (
                                        <tr><td colSpan={4} className="py-12 text-center opacity-30 italic font-bold">No historical data found in cache</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Provider Health */}
                    <div className="space-y-6">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--border-bright)] transition-all duration-300 shadow-xl shadow-slate-200/50">
                            <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-black mb-6 pb-3 border-b border-[var(--border)] flex items-center gap-2 text-[var(--text)] italic">
                                <ShieldCheck size={14} /> // PROVIDER_HEALTH_SYNC
                            </h2>

                            <div className="space-y-3 mt-6">
                                <ProviderRow name="OpenAI" model="GPT-4o" color="text-emerald-600" icon="🟢" status="Healthy" />
                                <ProviderRow name="Anthropic" model="Claude 3.5 Sonnet" color="text-purple-600" icon="🟣" status="Healthy" />
                                <ProviderRow name="Google" model="Gemini 1.5 Pro" color="text-blue-600" icon="🔵" status="Degraded" pulse />
                            </div>
                        </div>

                        {/* Config Matrix */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-8 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--border-bright)] transition-all duration-300 shadow-xl shadow-slate-200/50">
                            <h2 className="font-tactical text-[11px] uppercase tracking-[2px] text-[var(--accent-secondary)] font-black mb-6 pb-3 border-b border-[var(--border)] flex items-center gap-2 text-[var(--text)] italic">
                                <Cpu size={14} /> // GATEWAY_MATRIX_PARAM
                            </h2>

                            <div className="space-y-4 font-mono text-[10px] mt-6">
                                <MatrixRow label="AI_FALLBACK_STRATEGY" value="priority-pool" desc="Auto-failover to secondary cluster" />
                                <MatrixRow label="AI_COST_THRESHOLD" value="$50.00/DAY" desc="Hard-limit for safety" />
                                <MatrixRow label="AI_CONTEXT_CACHE" value="ENABLED" desc="Redis-backed prompt compression" color="text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function MetricCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-6 backdrop-blur-xl relative overflow-hidden group hover:border-[var(--border-bright)] transition-all duration-300 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-start mb-4">
                <span className="font-tactical text-[9px] uppercase tracking-[2px] text-[var(--text-muted)] font-black">{title}</span>
                <div className="p-2 bg-slate-500/5 rounded-sm opacity-60 group-hover:opacity-100 transition-opacity font-bold">{icon}</div>
            </div>
            <div className="text-2xl font-black text-[var(--text)] mb-2 tracking-tighter group-hover:text-[var(--accent)] transition-colors italic">{value}</div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 uppercase italic font-bold">
                <ArrowUpRight size={10} className="text-emerald-600" /> {trend}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

function ProviderRow({ name, model, color, icon, status, pulse }: { name: string, model: string, color: string, icon: string, status: string, pulse?: boolean }) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-500/5 border border-[var(--border)] rounded-sm hover:bg-slate-500/10 transition-all group/row cursor-default">
            <div className="flex items-center gap-4">
                <div className={`text-xl ${pulse ? 'animate-pulse' : ''}`}>{icon}</div>
                <div>
                    <div className="text-[11px] font-tactical uppercase tracking-widest text-[var(--text)] group-hover/row:text-[var(--accent)] transition-colors font-black italic">{name}</div>
                    <div className="text-[9px] font-mono text-[var(--text-muted)] italic font-bold">Active: {model}</div>
                </div>
            </div>
            <div className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-rose-500/10 text-rose-700 border-rose-500/30'}`}>
                {status}
            </div>
        </div>
    );
}

function MatrixRow({ label, value, desc, color }: { label: string, value: string, desc: string, color?: string }) {
    return (
        <div className="pb-3 border-b border-slate-500/5 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[var(--text-muted)] uppercase tracking-wider font-bold italic">{label}</span>
                <span className={`font-black italic ${color || 'text-indigo-700'}`}>{value}</span>
            </div>
            <div className="text-[8px] text-[var(--text-muted)] opacity-60 flex items-center gap-1.5 italic font-black">
                <ChevronRight size={8} /> {desc.toUpperCase()}
            </div>
        </div>
    );
}
