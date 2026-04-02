import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList } from 'lucide-react';
import { hrService } from '../services/api';

const HRJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await hrService.getJobs();
        setJobs(res.data);
      } catch (err) {
        console.error('Error loading jobs', err);
        setError('Unable to load job postings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <div className="animate-fade">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>My Postings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your open roles and view the active HR job listings.</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/hr')}>
          <Plus size={18} /> Dashboard
        </button>
      </header>

      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <ClipboardList size={20} />
          <h2 style={{ fontSize: '20px', margin: 0 }}>Active Job Postings</h2>
        </div>

        {loading ? (
          <p>Loading postings...</p>
        ) : error ? (
          <p style={{ color: 'var(--error)' }}>{error}</p>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <p>No postings found yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {jobs.map(job => (
              <div key={job.id} style={{ padding: '20px', borderRadius: '16px', background: 'var(--background)', border: '1px solid var(--surface-border)', cursor: 'pointer' }} onClick={() => navigate(`/hr/jobs/${job.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{job.title}</h3>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: job.status === 'open' ? 'var(--success)' : 'var(--warning)' }}>
                    {job.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>{job.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Requirements: {job.requirements}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRJobs;
