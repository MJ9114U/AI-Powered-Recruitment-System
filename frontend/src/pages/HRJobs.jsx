import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, Trash2, Pencil } from 'lucide-react';
import { hrService } from '../services/api';

const HRJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', requirements: '' });
  const [editLoading, setEditLoading] = useState(false);

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

  const handleDeleteJob = async () => {
    try {
      setDeleteLoading(true);
      await hrService.deleteJob(jobToDelete.id);
      setJobs(jobs.filter(j => j.id !== jobToDelete.id));
      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (err) {
      console.error('Error deleting job', err);
      setError('Failed to delete job. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditJob = async (e) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      const res = await hrService.updateJob(jobToEdit.id, editFormData);
      setJobs(jobs.map(j => (j.id === jobToEdit.id ? res.data : j)));
      setShowEditModal(false);
      setJobToEdit(null);
    } catch (err) {
      console.error('Error editing job', err);
      setError('Failed to edit job. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

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
              <div key={job.id} style={{ position: 'relative', padding: '20px 20px 56px 20px', borderRadius: '16px', background: 'var(--background)', border: '1px solid var(--surface-border)', cursor: 'pointer' }} onClick={() => navigate(`/hr/jobs/${job.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{job.title}</h3>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: job.status === 'open' ? 'var(--success)' : 'var(--warning)' }}>
                    {job.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>{job.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Requirements: {job.requirements}</span>
                </div>
                <span style={{ position: 'absolute', bottom: '16px', left: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setJobToEdit(job);
                      setEditFormData({ title: job.title, description: job.description, requirements: job.requirements });
                      setShowEditModal(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      outline: '1px solid transparent',
                      transition: 'outline 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.outline = '2px solid var(--primary)'; }}
                    onBlur={(e) => { e.target.style.outline = '1px solid transparent'; }}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setJobToDelete(job);
                      setShowDeleteModal(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      outline: '1px solid transparent',
                      transition: 'outline 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.outline = '2px solid var(--error)'; }}
                    onBlur={(e) => { e.target.style.outline = '1px solid transparent'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteModal && jobToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: '400px', background: 'var(--surface)', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', color: 'var(--error)' }}>Delete Job Posting</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Are you sure you want to delete "<strong>{jobToDelete.title}</strong>"?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDeleteModal(false); setJobToDelete(null); }}
                style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--surface-border)', color: 'var(--text)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                disabled={deleteLoading}
                style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--error)', border: 'none', color: 'white', cursor: 'pointer', opacity: deleteLoading ? 0.6 : 1 }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && jobToEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: '100%', maxWidth: '500px', background: 'var(--surface)', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', fontSize: '24px' }}>Edit Job Posting</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              Updating job requirements or description will automatically recalculate matching scores for all current applications.
            </p>
            <form onSubmit={handleEditJob} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Job Title</label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--surface-border)', color: 'var(--text)' }}
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                <textarea
                  required
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--surface-border)', color: 'var(--text)', resize: 'vertical' }}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Requirements (comma-separated)</label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--surface-border)', color: 'var(--text)' }}
                  value={editFormData.requirements}
                  onChange={(e) => setEditFormData({...editFormData, requirements: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setJobToEdit(null); }}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--surface-border)', color: 'var(--text)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', opacity: editLoading ? 0.6 : 1 }}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRJobs;
