import React, { useState, useEffect } from 'react';
import { authService, hrService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { User, Mail, BadgeCheck, Calendar, Briefcase, Users, ClipboardList, BarChart3 } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [hrSummary, setHrSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        setProfile(res.data);
        if (String(res.data.role ?? '').toLowerCase() === 'hr') {
          try {
            const s = await hrService.getSummary();
            setHrSummary(s.data);
          } catch (e) {
            console.error('HR summary', e);
          }
        }
      } catch (err) {
        console.error('Error fetching profile', err);
        setError('Unable to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const renderRoleDetails = () => {
    if (!profile) return null;
    const roleKey = String(profile.role ?? '').toLowerCase();

    if (roleKey === 'applicant') {
      return (
        <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
          <div>Total applications: <strong>{profile.applications_submitted ?? 0}</strong></div>
          <div>Pending: <strong>{profile.application_status_breakdown?.pending ?? 0}</strong></div>
          <div>Shortlisted: <strong>{profile.application_status_breakdown?.shortlisted ?? 0}</strong></div>
          <div>Rejected: <strong>{profile.application_status_breakdown?.rejected ?? 0}</strong></div>
          <div>Hired: <strong>{profile.application_status_breakdown?.hired ?? 0}</strong></div>
        </div>
      );
    }

    if (roleKey === 'hr') {
      const br = hrSummary?.status_breakdown || {};
      const breakdownRows = Object.entries(br).sort((a, b) => b[1] - a[1]);
      return (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Your job postings</span>
                <Briefcase size={18} color="var(--primary)" />
              </div>
              <span className="stat-value">{hrSummary?.jobs_posted ?? profile.jobs_created ?? 0}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Requisitions you own</span>
            </div>
            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Total applicants</span>
                <Users size={18} color="var(--accent)" />
              </div>
              <span className="stat-value">{hrSummary?.total_applications ?? profile.candidates_reviewed ?? 0}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Across your roles</span>
            </div>
            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Pending review</span>
                <ClipboardList size={18} color="var(--warning)" />
              </div>
              <span className="stat-value">{hrSummary?.pending_review ?? 0}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awaiting decision</span>
            </div>
            <div className="glass-card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Shortlisted</span>
                <BarChart3 size={18} color="var(--success)" />
              </div>
              <span className="stat-value">{hrSummary?.shortlisted ?? 0}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Flagged candidates</span>
            </div>
          </div>
          {breakdownRows.length > 0 && (
            <div style={{ fontSize: '14px' }}>
              <div style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Pipeline by status</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {breakdownRows.map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--glass)', borderRadius: '10px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{status}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (roleKey === 'admin') {
      return (
        <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
          <div>Total users: <strong>{profile.total_users ?? 0}</strong></div>
          <div>Total jobs: <strong>{profile.total_jobs ?? 0}</strong></div>
          <div>Total applications: <strong>{profile.total_applications ?? 0}</strong></div>
        </div>
      );
    }

    return null;
  };

  const roleKey = profile ? String(profile.role ?? '').toLowerCase() : '';

  return (
    <div className="animate-fade">
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Profile</h1>
          <p style={{ color: 'var(--text-muted)' }}>View and manage your account details.</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </header>

      <div className="glass-card" style={{ padding: '24px', maxWidth: roleKey === 'hr' ? '1040px' : '700px' }}>
        {loading ? (
          <p>Loading profile...</p>
        ) : error ? (
          <p style={{ color: 'var(--error)' }}>{error}</p>
        ) : profile ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><User size={20} /> <strong>{profile.username}</strong></div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><Mail size={20} /> <span>{profile.email}</span></div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><BadgeCheck size={20} /> <span>{profile.role}</span></div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><Calendar size={20} /> <span>{profile.joined_at ? new Date(profile.joined_at).toLocaleDateString() : 'N/A'}</span></div>
            <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              {renderRoleDetails()}
            </div>
          </div>
        ) : (
          <p>No profile data available.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
