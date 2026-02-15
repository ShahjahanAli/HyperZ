'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

const API = '/api/_admin';

export default function LogsPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [files, setFiles] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [filter, setFilter] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(false);

    const loadLogs = async (file?: string) => {
        const params = new URLSearchParams({ lines: '200' });
        if (file) params.set('file', file);

        const res = await adminFetch(`${API}/logs?${params}`);
        const data = await res.json();
        setLogs(data.logs || []);
        setFiles(data.files || []);
        if (data.file) setSelectedFile(data.file);
    };

    useEffect(() => { loadLogs(); }, []);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => loadLogs(selectedFile), 3000);
        return () => clearInterval(interval);
    }, [autoRefresh, selectedFile]);

    const filteredLogs = filter
        ? logs.filter(l => l.toLowerCase().includes(filter.toLowerCase()))
        : logs;

    const getLogColor = (line: string) => {
        if (line.includes('ERROR') || line.includes('error')) return 'var(--red)';
        if (line.includes('WARN') || line.includes('warn')) return 'var(--yellow)';
        if (line.includes('INFO') || line.includes('info')) return 'var(--green)';
        if (line.includes('DEBUG') || line.includes('debug')) return 'var(--cyan)';
        return 'var(--text)';
    };

    return (
        <AdminLayout>
            <div className="topbar">
                <h1>📋 Logs</h1>
                <span className="topbar-meta">{logs.length} lines • {files.length} log files</span>
            </div>

            <div className="page-content">
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                    <input
                        className="form-input"
                        style={{ maxWidth: 300 }}
                        placeholder="Filter logs..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                    <select
                        className="form-select"
                        style={{ maxWidth: 200 }}
                        value={selectedFile}
                        onChange={e => { setSelectedFile(e.target.value); loadLogs(e.target.value); }}
                    >
                        {files.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <button className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAutoRefresh(!autoRefresh)}>
                        {autoRefresh ? '⏸️ Pause' : '▶️ Auto-refresh'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => loadLogs(selectedFile)}>
                        🔄 Refresh
                    </button>
                </div>

                <div className="log-viewer">
                    {filteredLogs.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>No logs found</div>
                    ) : (
                        filteredLogs.map((line, i) => (
                            <div key={i} className="log-line" style={{ color: getLogColor(line) }}>
                                {line}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
