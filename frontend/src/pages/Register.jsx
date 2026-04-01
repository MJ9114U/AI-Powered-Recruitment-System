import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, Briefcase, Users, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ 
        username: '', 
        email: '', 
        password: '', 
        role: 'applicant' 
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Real registration call
            await authService.register(userData);
            alert("Registration successful! You can now login.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Try a different username.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--background)', padding: '20px' }}>
            <div className="glass-card animate-fade" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '12px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={28} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Join ARIS</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Create an account to start your journey.</p>
                </div>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Role</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div 
                                onClick={() => setUserData({ ...userData, role: 'applicant' })}
                                style={{ 
                                    padding: '12px', borderRadius: '12px', border: '1px solid',
                                    borderColor: userData.role === 'applicant' ? 'var(--primary)' : 'var(--surface-border)',
                                    background: userData.role === 'applicant' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    cursor: 'pointer', textAlign: 'center'
                                }}
                            >
                                <Users size={18} style={{ marginBottom: '4px' }} />
                                <div style={{ fontSize: '10px' }}>Applicant</div>
                            </div>
                            <div 
                                onClick={() => setUserData({ ...userData, role: 'hr' })}
                                style={{ 
                                    padding: '12px', borderRadius: '12px', border: '1px solid',
                                    borderColor: userData.role === 'hr' ? 'var(--primary)' : 'var(--surface-border)',
                                    background: userData.role === 'hr' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    cursor: 'pointer', textAlign: 'center'
                                }}
                            >
                                <Briefcase size={18} style={{ marginBottom: '4px' }} />
                                <div style={{ fontSize: '10px' }}>Recruiter</div>
                            </div>
                            <div 
                                onClick={() => setUserData({ ...userData, role: 'admin' })}
                                style={{ 
                                    padding: '12px', borderRadius: '12px', border: '1px solid',
                                    borderColor: userData.role === 'admin' ? 'var(--primary)' : 'var(--surface-border)',
                                    background: userData.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    cursor: 'pointer', textAlign: 'center'
                                }}
                            >
                                <ShieldCheck size={18} style={{ marginBottom: '4px' }} />
                                <div style={{ fontSize: '10px' }}>Admin</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                required 
                                value={userData.username}
                                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '12px', color: 'white' }}
                                placeholder="Choose a username"
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="email" 
                                required 
                                value={userData.email}
                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '12px', color: 'white' }}
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required 
                                value={userData.password}
                                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                                style={{ width: '100%', padding: '12px 40px', background: 'var(--background)', border: '1px solid var(--surface-border)', borderRadius: '12px', color: 'white' }}
                                placeholder="••••••••"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {loading ? 'Creating Account...' : 'Get Started'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
