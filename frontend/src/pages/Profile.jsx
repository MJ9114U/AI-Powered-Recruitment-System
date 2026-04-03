import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { User, Mail, BadgeCheck, Calendar } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        setProfile(res.data);
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

    if (profile.role === 'applicant') {
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

    if (profile.role === 'hr') {
      return (
        <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
          <div>Jobs posted: <strong>{profile.jobs_created ?? 0}</strong></div>
          <div>Candidates reviewed: <strong>{profile.candidates_reviewed ?? 0}</strong></div>
        </div>
      );
    }

    if (profile.role === 'admin') {
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

  return (
    <div className="animate-fade">
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>Profile</h1>
          <p style={{ color: 'var(--text-muted)' }}>View and manage your account details.</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </header>

      <div className="glass-card" style={{ padding: '24px', maxWidth: '700px' }}>
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
