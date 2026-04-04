import React, { useState, useEffect } from 'react';
import { Terminal, Calendar, User, FileText, Search } from 'lucide-react';
import { adminService } from '../services/api';

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await adminService.getLogs();
                setLogs(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Audit log fetch error', err);
                const msg = err.response?.data?.detail || err.message || 'Failed to load audit logs.';
                setError(typeof msg === 'string' ? msg : 'Failed to load audit logs.');
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter((log) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            log.action.toLowerCase().includes(searchLower) ||
            (log.details && log.details.toLowerCase().includes(searchLower)) ||
            (log.timestamp && new Date(log.timestamp).toLocaleString().toLowerCase().includes(searchLower)) ||
            log.user_id.toString().includes(searchLower)
        );
    });

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Audit Logs</h1>
                <p style={{ color: 'var(--text-muted)' }}>Track all system actions and user activities for security and compliance.</p>
            </header>

            {error && (
                <div className="glass-card" style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--error)', color: 'var(--error)' }}>
                    {error}
                </div>
            )}

            <div className="glass-card" style={{ marginBottom: '24px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px' }}>
                    <Search size={18} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search logs by action, details, user ID, or timestamp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text)',
                            outline: 'none',
                            fontSize: '14px'
                        }}
                    />
                </div>
            </div>

            <div className="glass-card">
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '600' }}>
                    <Terminal size={20} color="var(--primary)" /> System Activity Log
                </h3>

                {loading && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Loading logs...</p>
                )}

                {!loading && filteredLogs.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                        {logs.length === 0 ? 'No audit logs found.' : 'No logs match your search.'}
                    </p>
                )}

                {!loading && filteredLogs.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '14px'
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600' }}>Timestamp</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600' }}>User ID</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600' }}>Action</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log, index) => (
                                    <tr key={log.id || index} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '12px', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={16} />
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', color: 'var(--text)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <User size={16} />
                                                {log.user_id}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', color: 'var(--text)', fontWeight: '500' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FileText size={16} style={{ color: 'var(--primary)' }} />
                                                {log.action}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: '400px', wordBreak: 'break-word' }}>
                                            {log.details || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredLogs.length > 0 && (
                    <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        Showing {filteredLogs.length} of {logs.length} logs
                    </p>
                )}
            </div>
        </div>
    );
};

export default AuditLog;
