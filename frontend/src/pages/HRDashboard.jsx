import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Users, BarChart3, Search, Filter, Plus, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { hrService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const HRDashboard = () => {
    const [applicants, setApplicants] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [searchParams] = useSearchParams();
    const { jobId } = useParams();
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [showInsight, setShowInsight] = useState(false);
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newJobDescription, setNewJobDescription] = useState('');
    const [newJobRequirements, setNewJobRequirements] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const resJobs = await hrService.getJobs();
                setJobs(resJobs.data);

                const jobParam = parseInt(jobId ?? '', 10);
                const queryJobId = parseInt(searchParams.get('jobId') ?? '', 10);
                const defaultJob = resJobs.data[0];
                const selectedJobId = (!Number.isNaN(jobParam) && resJobs.data.some((job) => job.id === jobParam))
                    ? jobParam
                    : (!Number.isNaN(queryJobId) && resJobs.data.some((job) => job.id === queryJobId))
                        ? queryJobId
                        : defaultJob?.id;

                if (selectedJobId) {
                    setSelectedJob(selectedJobId);
                    const resApps = await hrService.getApplicants(selectedJobId);
                    setApplicants(resApps.data);
                } else {
                    setSelectedJob(null);
                    setApplicants([]);
                }
            } catch (err) {
                console.error("Error fetching HR data", err);
            }
            setLoading(false);
        };
        fetchData();
    }, [searchParams, jobId]);

    const handleCreateJob = async () => {
        if (!newJobTitle || !newJobDescription || !newJobRequirements) {
            setErrorMessage('Please fill in all fields.');
            return;
        }

        try {
            setLoading(true);
            await hrService.createJob({
                title: newJobTitle,
                description: newJobDescription,
                requirements: newJobRequirements
            });
            setShowModal(false);
            setNewJobTitle('');
            setNewJobDescription('');
            setNewJobRequirements('');
            setErrorMessage('');

            const resJobs = await hrService.getJobs();
            setJobs(resJobs.data);
            if (resJobs.data.length > 0) {
                setSelectedJob(resJobs.data[0].id);
                const resApps = await hrService.getApplicants(resJobs.data[0].id);
                setApplicants(resApps.data);
            }
        } catch (err) {
            setErrorMessage('Failed to create job.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (appId, status) => {
        try {
            await hrService.updateStatus(appId, status);
            // Refresh
            if (selectedJob !== null) {
                const resApps = await hrService.getApplicants(selectedJob);
                setApplicants(resApps.data);
            }
        } catch (err) {
            alert('Status update failed.');
        }
    };

    const filteredApplicants = applicants.filter(app => {
        const name = app?.candidate_name?.toLowerCase() ?? '';
        const email = app?.email?.toLowerCase() ?? '';
        const term = searchTerm.toLowerCase();
        return name.includes(term) || email.includes(term);
    });

    const sortedApplicants = [...filteredApplicants].sort((a, b) => {
        const scoreA = Number(a?.scores?.total_score ?? 0);
        const scoreB = Number(b?.scores?.total_score ?? 0);
        return scoreB - scoreA;
    });

    const chartData = sortedApplicants.slice(0, 5).map((a) => ({
        name: (a?.candidate_name || 'Candidate').slice(0, 18) + ((a?.candidate_name || '').length > 18 ? '…' : ''),
        ai_score: Number(a?.scores?.total_score ?? 0),
    }));

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Recruitment Intelligence</h1>
                    <p style={{ color: 'var(--text-muted)' }}>AI-ranked candidates across your active job postings.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Post New Job
                </button>
            </header>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ width: '100%', maxWidth: '520px', background: 'var(--surface)', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', position: 'relative' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '18px', right: '18px', background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>×</button>
                        <h2 style={{ marginBottom: '16px' }}>Post New Job</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Create a new opening and start receiving AI-ranked applications.</p>
                        {errorMessage && <div style={{ marginBottom: '16px', color: 'var(--error)' }}>{errorMessage}</div>}
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <input
                                value={newJobTitle}
                                onChange={(e) => setNewJobTitle(e.target.value)}
                                placeholder="Job title"
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--background)', color: 'white' }}
                            />
                            <textarea
                                value={newJobDescription}
                                onChange={(e) => setNewJobDescription(e.target.value)}
                                placeholder="Job description"
                                rows={4}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--background)', color: 'white' }}
                            />
                            <input
                                value={newJobRequirements}
                                onChange={(e) => setNewJobRequirements(e.target.value)}
                                placeholder="Requirements (comma-separated)"
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--background)', color: 'white' }}
                            />
                            <button onClick={handleCreateJob} className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                                {loading ? 'Creating...' : 'Create Job'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {jobs.length === 0 && (
                <div className="glass-card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '12px' }}>No active job postings yet</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Create your first job to begin reviewing candidates and get AI-matched rankings.</p>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>Create First Job</button>
                </div>
            )}

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 3fr' }}>
                {/* Active Jobs List */}
                <div className="glass-card" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Active Jobs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {jobs.map(job => (
                            <div 
                                key={job.id} 
                                onClick={async () => {
                                    setSelectedJob(job.id);
                                    try {
                                        const res = await hrService.getApplicants(job.id);
                                        setApplicants(res.data);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }}
                                style={{
                                    padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)',
                                    background: selectedJob === job.id ? 'var(--primary)' : 'var(--glass)',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>{job.title}</span>
                                <ChevronRight size={14} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Candidates Table & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Top Performing Score Chart */}
                    <div className="glass-card" style={{ height: '300px' }}>
                        <h4 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>Candidate Score Comparison</h4>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--primary)' }}
                                />
                                <Bar dataKey="ai_score" name="AI Score" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.ai_score > 80 ? 'var(--success)' : 'var(--primary)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Ranking Table */}
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px' }}>Ranked Applicants</h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search applicants..."
                                        style={{ padding: '8px 12px 8px 32px', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'white', fontSize: '14px' }}
                                    />
                                </div>
                                <button style={{ padding: '8px', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'white' }}><Filter size={14} /></button>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '16px', fontSize: '14px' }}>Rank</th>
                                    <th style={{ padding: '16px', fontSize: '14px' }}>Candidate</th>
                                    <th style={{ padding: '16px', fontSize: '14px' }}>AI Match Score</th>
                                    <th style={{ padding: '16px', fontSize: '14px' }}>Status</th>
                                    <th style={{ padding: '16px', fontSize: '14px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedApplicants.length > 0 ? sortedApplicants.map((app, index) => (
                                    <tr key={app.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                                        <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-muted)' }}>#{index + 1}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{app.candidate_name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.email}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                                    <div style={{ width: `${app?.scores?.total_score ?? 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: '3px' }}></div>
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: '700', color: (app?.scores?.total_score ?? 0) > 80 ? 'var(--success)' : 'var(--text)' }}>
                                                    {(app?.scores?.total_score ?? 0)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span className="glass-badge" style={{
                                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                                background: app?.status === 'shortlisted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: app?.status === 'shortlisted' ? 'var(--success)' : 'var(--warning)',
                                                border: '1px solid currentColor'
                                            }}>{(app?.status ?? 'pending').toUpperCase()}</span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleStatusUpdate(app.id, 'shortlisted')} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: 'var(--success)', cursor: 'pointer' }}><CheckCircle size={16} /></button>
                                                <button onClick={() => handleStatusUpdate(app.id, 'rejected')} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><XCircle size={16} /></button>
                                                <button onClick={() => { setSelectedApplicant(app); setShowInsight(true); }} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Insight</button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Select a job to view candidates.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showInsight && selectedApplicant && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <div style={{ width: '100%', maxWidth: '520px', background: 'var(--surface)', borderRadius: '24px', padding: '28px', position: 'relative' }}>
                        <button onClick={() => setShowInsight(false)} style={{ position: 'absolute', top: '18px', right: '18px', background: 'transparent', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>×</button>
                        <h3 style={{ marginBottom: '16px' }}>Candidate Insight</h3>
                        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                            <div><strong>Name:</strong> {selectedApplicant?.candidate_name ?? '—'}</div>
                            <div><strong>Email:</strong> {selectedApplicant?.email ?? '—'}</div>
                            <div><strong>Status:</strong> {selectedApplicant?.status ?? 'pending'}</div>
                            <div><strong>Score:</strong> {(selectedApplicant?.scores?.total_score ?? 0)}%</div>
                            <div><strong>Recommendation:</strong> {selectedApplicant?.scores?.recommendation ?? 'N/A'}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{selectedApplicant?.scores?.explanation?.resume_impact ?? ''}</div>
                        </div>
                        <button onClick={() => setShowInsight(false)} className="btn-primary" style={{ width: '100%' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRDashboard;
