import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Video, Settings, LogOut, Briefcase, BarChart3, ShieldCheck } from 'lucide-react';

// --- Page Imports ---
import Login from './pages/Login';
import Register from './pages/Register';
import ApplicantDashboard from './pages/ApplicantDashboard';
import HRDashboard from './pages/HRDashboard';
import HRJobs from './pages/HRJobs';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

// --- Auth Context ---
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      setUser({ token, role });
    }
    setLoading(false);
  }, []);

  const login = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setUser({ token, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// --- Protected Route ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

// --- Layout Components ---
const Sidebar = () => {
  const { user, logout } = useAuth();
  const role = user?.role;

  return (
    <div className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={20} />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: '700' }}>ARIS AI</h1>
      </div>

      <div style={{ flex: 1 }}>
        <Link to="/profile" className="nav-link"><Users size={20} /> Profile</Link>
        {role === 'applicant' && (
          <>
            <Link to="/applicant" className="nav-link"><LayoutDashboard size={20} /> Dashboard</Link>
          </>
        )}
        {role === 'hr' && (
          <>
            <Link to="/hr" className="nav-link"><LayoutDashboard size={20} /> Pipeline</Link>
            <Link to="/hr/jobs" className="nav-link"><FileText size={20} /> My Postings</Link>
          </>
        )}
        {role === 'admin' && (
          <>
            <Link to="/admin" className="nav-link"><ShieldCheck size={20} /> System Health</Link>
            <Link to="/admin/logs" className="nav-link"><FileText size={20} /> Audit Logs</Link>
          </>
        )}
      </div>

      <button onClick={logout} className="logout-btn">
        <LogOut size={20} /> Logout
      </button>

      <style>{`
        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          color: var(--text-muted);
          text-decoration: none;
          border-radius: 12px;
          margin-bottom: 8px;
          transition: all 0.2s;
        }
        .nav-link:hover {
          background: var(--glass);
          color: white;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          color: var(--error);
          background: rgba(239, 68, 68, 0.05);
        }
      `}</style>
    </div>
  );
};

const DashboardWrapper = ({ children }) => (
  <div style={{ display: 'flex' }}>
    <Sidebar />
    <main className="main-content" style={{ flex: 1 }}>{children}</main>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/applicant" element={
            <ProtectedRoute allowedRoles={['applicant']}><DashboardWrapper><ApplicantDashboard /></DashboardWrapper></ProtectedRoute>
          } />
          <Route path="/hr" element={
            <ProtectedRoute allowedRoles={['hr']}><DashboardWrapper><HRDashboard /></DashboardWrapper></ProtectedRoute>
          } />
          <Route path="/hr/jobs" element={
            <ProtectedRoute allowedRoles={['hr']}><DashboardWrapper><HRJobs /></DashboardWrapper></ProtectedRoute>
          } />
          <Route path="/hr/jobs/:jobId" element={
            <ProtectedRoute allowedRoles={['hr']}><DashboardWrapper><HRDashboard /></DashboardWrapper></ProtectedRoute>
          } />          <Route path="/profile" element={
            <ProtectedRoute><DashboardWrapper><Profile /></DashboardWrapper></ProtectedRoute>
          } />          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}><DashboardWrapper><AdminDashboard /></DashboardWrapper></ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute allowedRoles={['admin']}><DashboardWrapper><AdminDashboard /></DashboardWrapper></ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
