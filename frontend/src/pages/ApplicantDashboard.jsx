import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Clock, AlertCircle, FileText, Send } from 'lucide-react';
import { applicantService } from '../services/api';

const ApplicantDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [includeVideo, setIncludeVideo] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [statusRes, jobsRes] = await Promise.all([
                    applicantService.getStatus(),
                    applicantService.getJobs(),
                ]);
                setApplications(statusRes.data);
                setJobs(jobsRes.data);
                if (jobsRes.data.length > 0) {
                    setSelectedJobId(String(jobsRes.data[0].id));
                }
            } catch (err) {
                console.error("Error fetching status", err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleApply = async (e) => {
        e.preventDefault();
        if (!selectedJobId) {
            alert("Please select a job before applying.");
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append("resume", e.target.resume.files[0]);
        if (includeVideo) {
            const videoFile = e.target.video?.files?.[0];
            if (!videoFile) {
                alert("Please attach your interview video or uncheck the optional video field.");
                setUploading(false);
                return;
            }
            formData.append("video", videoFile);
        }
        
        try {
            await applicantService.apply(Number(selectedJobId), formData);
            alert("Application submitted successfully!");
            // Refresh
            const res = await applicantService.getStatus();
            setApplications(res.data);
        } catch (err) {
            console.error('Applicant upload error:', err.response || err);
            const message = err.response?.data?.detail || err.response?.data?.message || 'Application failed. Ensure backend is running.';
            alert(message);
        }
        setUploading(false);
    };

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Career Portal</h1>
                <p style={{ color: 'var(--text-muted)' }}>Apply to new roles and check your AI-driven feedback.</p>
            </header>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
                {/* Application Activity */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={20} color="var(--primary)" /> Recent Activity
                    </h3>
                    {loading ? (
                        <p>Loading applications...</p>
                    ) : applications.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {applications.map(app => (
                                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--glass)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                                    <div>
                                        <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>{app.job_title}</h4>
                                        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{new Date(app.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className={`glass-badge ${app.status}`} style={{
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                            background: app.status === 'shortlisted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: app.status === 'shortlisted' ? 'var(--success)' : 'var(--warning)',
                                            border: '1px solid currentColor'
                                        }}>
                                            {app.status.toUpperCase()}
                                        </span>
                                        <p style={{ fontSize: '14px', fontWeight: '700', marginTop: '8px', color: 'var(--accent)' }}>
                                            AI Score: {app.score != null && app.score !== '' ? `${Number(app.score).toFixed(1)}%` : '—'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                            <p>No applications yet. Start your journey today!</p>
                        </div>
                    )}
                </div>

                {/* Quick Apply / Upload Side Panel */}
                <div className="glass-card" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Send size={20} color="var(--primary)" /> Quick Apply
                    </h3>
                    <form onSubmit={handleApply}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Select Job</label>
                            <select
                                value={selectedJobId}
                                onChange={(e) => setSelectedJobId(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'white' }}
                            >
                                {jobs.length === 0 ? (
                                    <option value="">No open jobs available</option>
                                ) : (
                                    jobs.map((job) => (
                                        <option key={job.id} value={job.id}>
                                            {job.title}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Resume (PDF)</label>
                            <input type="file" name="resume" accept=".pdf" required style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px dashed var(--surface-border)', borderRadius: '8px', color: 'white' }} />
                        </div>
                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                id="includeVideo"
                                type="checkbox"
                                checked={includeVideo}
                                onChange={(e) => setIncludeVideo(e.target.checked)}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <label htmlFor="includeVideo" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                Include interview video (optional)
                            </label>
                        </div>
                        {includeVideo && (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Interview Video</label>
                                <input type="file" name="video" accept="video/*" style={{ width: '100%', padding: '10px', background: 'var(--background)', border: '1px dashed var(--surface-border)', borderRadius: '8px', color: 'white' }} />
                            </div>
                        )}
                        <button type="submit" disabled={uploading || jobs.length === 0} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {uploading ? "Analyzing..." : <><Upload size={18} /> Submit Application</>}
                        </button>
                    </form>
                    
                    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', marginBottom: '8px' }}>
                            <AlertCircle size={14} /> AI Evaluation
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                            Our AI will analyze your resume for skills and your video for communication clarity and confidence. Results are usually available within seconds.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicantDashboard;
