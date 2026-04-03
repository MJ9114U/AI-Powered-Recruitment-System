import React, { useState, useEffect } from 'react';
import { ShieldCheck, Database, Activity, Terminal, Users, Briefcase, Mail, Calendar } from 'lucide-react';
import { adminService } from '../services/api';

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [logs, setLogs] = useState([]);
    const [hrRecruiters, setHrRecruiters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAdminData = async () => {
            setLoading(true);
            setError('');
            try {
                const [resM, resL, resH] = await Promise.all([
                    adminService.getMetrics(),
                    adminService.getLogs(),
                    adminService.getHrRecruiters(),
                ]);
                setMetrics(resM.data);
                setLogs(Array.isArray(resL.data) ? resL.data : []);
                setHrRecruiters(Array.isArray(resH.data) ? resH.data : []);
            } catch (err) {
                console.error('Admin fetch error', err);
                const msg = err.response?.data?.detail || err.message || 'Failed to load admin data.';
                setError(typeof msg === 'string' ? msg : 'Failed to load admin data. Ensure you are logged in as admin.');
                setMetrics(null);
                setLogs([]);
                setHrRecruiters([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>System Command</h1>
                <p style={{ color: 'var(--text-muted)' }}>Monitor system health, hiring performance, and audit trails.</p>
            </header>

            {loading && <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Loading...</p>}
            {error && (
                <div className="glass-card" style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--error)', color: 'var(--error)' }}>
                    {error}
                </div>
            )}

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
                    <span className="stat-value">{metrics != null ? `${metrics.selection_rate}%` : (loading ? '…' : '0')}</span>
                </div>
                <div className="glass-card stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Records</span>
                        <Database size={18} color="var(--accent)" />
                    </div>
                    <span className="stat-value">{metrics?.total_applications ?? 0}</span>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="glass-card">
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Terminal size={20} color="var(--primary)" /> Security Audit Logs
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                        {logs.length > 0 ? logs.map((log) => (
                            <div key={log.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '12px' }}>
                                <span style={{ color: 'var(--accent)', fontWeight: '600' }}>[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}]</span>
                                <span style={{ marginLeft: '10px', color: 'var(--text)' }}>{log.action}{log.details ? `: ${log.details}` : ''}</span>
                            </div>
                        )) : (
                            <p style={{ color: 'var(--text-muted)' }}>{loading ? '…' : 'No recent logs found.'}</p>
                        )}
                    </div>
                </div>

                <div className="glass-card">
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={20} color="var(--primary)" /> HR / Recruiter activity
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                        {hrRecruiters.length > 0 ? hrRecruiters.map((hr) => (
                            <div
                                key={hr.id}
                                style={{
                                    padding: '14px 16px',
                                    background: 'var(--glass)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--surface-border)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                                            {(hr.username || '?').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '15px', margin: '0 0 4px 0', fontWeight: '600' }}>{hr.username}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                <Mail size={12} /> {hr.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Briefcase size={14} /> {hr.jobs_posted} job{hr.jobs_posted === 1 ? '' : 's'} posted
                                    </div>
                                    <div>{hr.candidates_in_pipeline} applicant{hr.candidates_in_pipeline === 1 ? '' : 's'} in pipeline</div>
                                </div>
                                {hr.latest_job_title && (
                                    <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: 'var(--text)' }}>
                                        Latest role: <strong>{hr.latest_job_title}</strong>
                                        {hr.last_posted_at && (
                                            <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                                                ({new Date(hr.last_posted_at).toLocaleDateString()})
                                            </span>
                                        )}
                                    </p>
                                )}
                                {hr.member_since && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        <Calendar size={12} /> Member since {new Date(hr.member_since).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <p style={{ color: 'var(--text-muted)' }}>{loading ? '…' : 'No recruiter (HR) accounts in the system yet.'}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
