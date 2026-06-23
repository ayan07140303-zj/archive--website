import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PortalPage from './components/PortalPage';
import Dashboard from './components/Dashboard';
import CaseManagement from './components/CaseManagement';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import SpecialLibrary from './components/SpecialLibrary';
import TopicDetail from './components/TopicDetail';
import PersonalizedServices from './components/PersonalizedServices';
import ProfilePage from './components/ProfilePage';
import ExpertLibrary from './components/ExpertLibrary';
import UserManagement from './components/UserManagement';
import AnnouncementDetail from './components/AnnouncementDetail';
import AnnouncementList from './components/AnnouncementList';
import AnnouncementManagement from './components/AnnouncementManagement';
import CaseSubmission from './components/CaseSubmission';
import AdminCases from './components/AdminCases';
import SubmissionReview from './components/SubmissionReview';
import CaseDetail from './components/CaseDetail';
import ExpertDetail from './components/ExpertDetail';
import AdminAuthors from './components/AdminAuthors';
import { api, setAuth, clearAuth, getStoredUser } from './api/client';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'contributor' | 'auditor' | 'manager';
  avatar?: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [loading, setLoading] = useState(true);

  // 启动时验证已存储的 token
  useEffect(() => {
    async function init() {
      const stored = getStoredUser();
      if (stored) {
        try {
          const res = await api.get('/users/me');
          if (res.success && res.data) {
            const d = res.data as any;
            setUser({ id: d.id, name: d.name, email: d.email, role: d.role, avatar: d.avatar });
          } else {
            clearAuth();
          }
        } catch {
          clearAuth();
          setAuthMode('login');
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const d = res.data as any;
      const u: AppUser = { id: d.user.id, name: d.user.name, email: d.user.email, role: d.user.role, avatar: d.user.avatar };
      setAuth(d.token, d.user);
      setUser(u);
      setAuthMode(null);
    }
  };

  const handleRegister = async (form: Record<string, unknown>) => {
    const res = await api.post('/auth/register', form);
    if (res.success) {
      alert(res.message || '注册成功！即将跳转到登录页');
      setAuthMode('login');
    }
  };

  const handleLogout = () => {
    setUser(null);
    clearAuth();
    setAuthMode('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#0052cc] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {authMode === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onCancel={() => setAuthMode(null)}
          onRegisterRequest={() => setAuthMode('register')}
        />
      )}
      {authMode === 'register' && (
        <RegisterPage
          onRegister={handleRegister}
          onLoginRequest={() => setAuthMode('login')}
          onCancel={() => setAuthMode(null)}
        />
      )}

      <Routes>
        <Route element={<Layout user={user} onLogout={handleLogout} onLoginRequest={() => setAuthMode('login')} onRegisterRequest={() => setAuthMode('register')} />}>
          <Route index element={user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : user ? <Navigate to="/dashboard" replace /> : <PortalPage />} />
          <Route path="dashboard" element={user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : user ? <Dashboard user={user} /> : <Navigate to="/" replace />} />
          <Route path="cases/:caseId" element={<CaseDetail />} />
          <Route path="cases" element={<CaseManagement user={user} />} />
          <Route path="library" element={<SpecialLibrary />} />
          <Route path="library/:topicId" element={<TopicDetail />} />
          <Route path="library/:topicId/case/:caseId" element={<CaseDetail />} />
          <Route path="services" element={<PersonalizedServices />} />
          <Route path="profile" element={user ? <ProfilePage user={user} /> : <Navigate to="/" replace />} />
          <Route path="users" element={user?.role === 'admin' ? <UserManagement /> : <ExpertLibrary />} />
          <Route path="experts/:expertId" element={<ExpertDetail />} />
          <Route path="announcement/:annId" element={<AnnouncementDetail />} />
          <Route path="announcements" element={<AnnouncementList />} />
          <Route path="admin/dashboard" element={user?.role === 'admin' ? <Dashboard user={user} /> : <Navigate to="/" replace />} />
          <Route path="admin/announcements" element={user?.role === 'admin' ? <AnnouncementManagement /> : <Navigate to="/" replace />} />
          <Route path="admin/cases" element={user?.role === 'admin' ? <AdminCases /> : <Navigate to="/" replace />} />
          <Route path="admin/experts" element={user?.role === 'admin' ? <AdminAuthors /> : <Navigate to="/" replace />} />
          <Route path="admin/users" element={user?.role === 'admin' ? <UserManagement /> : <Navigate to="/" replace />} />
          <Route path="admin/submissions" element={user?.role === 'admin' ? <SubmissionReview /> : <Navigate to="/" replace />} />
          <Route path="submit" element={<CaseSubmission />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
