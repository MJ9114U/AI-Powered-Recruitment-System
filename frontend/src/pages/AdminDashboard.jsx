import React, { useState, useEffect } from 'react';
import { ShieldCheck, Database, Activity, Terminal, Trash2, Edit3, Trash, Users } from 'lucide-react';
import { adminService } from '../services/api';

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAdminData = async () => {
            setLoading(true);
            try {
                const resM = await adminService.getMetrics();
                setMetrics(resM.data);
                const resL = await adminService.getLogs();
                setLogs(resL.data);
            } catch (err) { console.error("Admin fetch error", err); }
            setLoading(false);
        };
        fetchAdminData();
    }, []);

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>System Command</h1>
                <p style={{ color: 'var(--text-muted)' }}>Monitor system health, hiring performance, and audit trails.</p>
            </header>

            <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
                <div className="glass-card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>System Uptime</span>
                        <Activity size={18} color="var(--success)" />
                    </div>
                    <span className="stat-value">99.9%</span>
                    <span style={{ fontSize: '12px', color: 'var(--success)' }}>+0.02% from last week</span>
                </div>
                <div className="glass-card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Hiring Selection Rate</span>
                        <ShieldCheck size={18} color="var(--primary)" />
                    </div>
                    <span className="stat-value">{metrics?.selection_rate || "0"}%</span>
                </div>
                <div className="glass-card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Records</span>
                        <Database size={18} color="var(--accent)" />
                    </div>
                    <span className="stat-value">{metrics?.total_applications || 0}</span>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Audit Logs */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Terminal size={20} color="var(--primary)" /> Security Audit Logs
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {logs.length > 0 ? logs.map(log => (
                            <div key={log.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '12px' }}>
                                <span style={{ color: 'var(--accent)', fontWeight: '600' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span style={{ marginLeft: '10px', color: 'var(--text)' }}>{log.action}: {log.details}</span>
                            </div>
                        )) : <p style={{ color: 'var(--text-muted)' }}>No recent logs found.</p>}
                    </div>
                </div>

                {/* User Management Overview */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={20} color="var(--primary)" /> HR/Admin Activity
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--glass)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary)' }}></div>
                                <div>
                                    <h4 style={{ fontSize: '14px' }}>Sarah Recruiter</h4>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Posted "Senior Python Engineer"</p>
                                </div>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>2m ago</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
