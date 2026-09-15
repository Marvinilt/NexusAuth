import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import MfaVerificationPage from './pages/MfaVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import LoginHistoryPage from './pages/LoginHistoryPage';
import { AdminLayout } from './components/AdminLayout';
import ClientsPage from './pages/admin/ClientsPage';
import StatisticsPage from './pages/admin/StatisticsPage';
import LogsPage from './pages/admin/LogsPage';
import { Shield } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Header() {
  const { isAuthenticated, user } = useAuth();

  return (
    <header style={{
      padding: '0.85rem 2rem',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <a href={user?.isSuperAdmin ? '/admin/clients' : '/dashboard'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em', textDecoration: 'none', color: '#fff' }}>
          <Shield color="var(--primary)" size={24} />
          Nexus<span style={{ color: 'var(--primary)' }}>Auth</span>
        </a>
        {user?.isSuperAdmin && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            padding: '0.2rem 0.5rem',
            borderRadius: '6px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Super Admin
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isAuthenticated && user?.isSuperAdmin && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem' }}>
            <a href="/admin/clients" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>Clientes</a>
            <a href="/admin/statistics" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>Estadísticas</a>
            <a href="/admin/logs" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>Logs Multicliente</a>
            <a href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>Mi Perfil</a>
          </nav>
        )}
        {!isAuthenticated && (
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Bienvenido al futuro de la identidad</span>
        )}
      </div>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/mfa-verify" element={<MfaVerificationPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/login-history"
                element={
                  <ProtectedRoute>
                    <LoginHistoryPage />
                  </ProtectedRoute>
                }
              />
              {/* Rutas Administrativas Multicliente */}
              <Route path="/admin" element={<Navigate to="/admin/clients" replace />} />
              <Route
                path="/admin/clients"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <ClientsPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/statistics"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <StatisticsPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <LogsPage />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
