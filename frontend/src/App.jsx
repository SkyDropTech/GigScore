import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import DriverDataIngestView from './components/DriverDataIngestView';
import AdminOpsConsoleView from './components/AdminOpsConsoleView';
import DriverPortalLogin from './components/DriverPortalLogin';
import AdminPortalLogin from './components/AdminPortalLogin';
import { api, setAuthToken, removeAuthToken, getAuthToken } from './services/api';
import { Shield, Car } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [driverUser, setDriverUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Restore authenticated session on startup if token exists
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoadingInitial(false);
        return;
      }
      try {
        const me = await api.getMe();
        if (me.role === 'admin' || me.role === 'lender') {
          setAdminUser(me);
        } else if (me.role === 'driver') {
          setDriverUser(me);
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        removeAuthToken();
      } finally {
        setLoadingInitial(false);
      }
    };

    restoreSession();
  }, []);

  const handleDriverLoginSuccess = (userObj) => {
    setDriverUser(userObj);
    setAuthToken(userObj.token);
    const targetPath = location.state?.from?.pathname?.startsWith('/driver')
      ? location.state.from.pathname
      : '/driver/overview';
    navigate(targetPath, { replace: true });
  };

  const handleAdminLoginSuccess = (userObj) => {
    setAdminUser(userObj);
    setAuthToken(userObj.token);
    const targetPath = location.state?.from?.pathname?.startsWith('/admin')
      ? location.state.from.pathname
      : '/admin/overview';
    navigate(targetPath, { replace: true });
  };

  const handleDriverLogout = () => {
    removeAuthToken();
    setDriverUser(null);
    navigate('/login/driver', { replace: true });
  };

  const handleAdminLogout = () => {
    removeAuthToken();
    setAdminUser(null);
    navigate('/login/admin', { replace: true });
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xs font-bold text-slate-500">Connecting to GigScore Engine...</div>
        </div>
      </div>
    );
  }

  // Header for unauthenticated login screens
  const renderLoginHeader = (activePortal) => (
    <header className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/gigscore-icon.png" alt="GigScore" className="w-7 h-7 object-contain" />
        <span className="font-extrabold text-slate-900 text-sm tracking-tight">GigScore</span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ml-1 border ${
            activePortal === 'admin'
              ? 'text-indigo-600 bg-indigo-50 border-indigo-200'
              : 'text-blue-600 bg-blue-50 border-blue-200'
          }`}
        >
          {activePortal === 'admin' ? 'Admin & Risk Desk' : 'Driver Portal'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/login/driver')}
          className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
            activePortal === 'driver'
              ? 'font-bold bg-blue-50 text-blue-700 border border-blue-200'
              : 'font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Car size={13} /> Driver Portal
        </button>
        <button
          onClick={() => navigate('/login/admin')}
          className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
            activePortal === 'admin'
              ? 'font-bold bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Shield size={13} /> Admin & Risk Desk
        </button>
      </div>
    </header>
  );

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          adminUser ? (
            <Navigate to="/admin/overview" replace />
          ) : driverUser ? (
            <Navigate to="/driver/overview" replace />
          ) : (
            <Navigate to="/login/driver" replace />
          )
        }
      />

      {/* Driver Login */}
      <Route path="/login" element={<Navigate to="/login/driver" replace />} />
      <Route
        path="/login/driver"
        element={
          driverUser ? (
            <Navigate to="/driver/overview" replace />
          ) : (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col">
              {renderLoginHeader('driver')}
              <main className="flex-1 flex items-center justify-center">
                <DriverPortalLogin onLoginSuccess={handleDriverLoginSuccess} />
              </main>
            </div>
          )
        }
      />

      {/* Admin Login */}
      <Route
        path="/login/admin"
        element={
          adminUser ? (
            <Navigate to="/admin/overview" replace />
          ) : (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col">
              {renderLoginHeader('admin')}
              <main className="flex-1 flex items-center justify-center">
                <AdminPortalLogin onLoginSuccess={handleAdminLoginSuccess} />
              </main>
            </div>
          )
        }
      />

      {/* Admin Operations Console (Protected) */}
      <Route
        path="/admin/*"
        element={
          adminUser ? (
            <div className="min-h-screen bg-[#f8fafc]">
              <AdminOpsConsoleView currentUser={adminUser} onLogout={handleAdminLogout} />
            </div>
          ) : (
            <Navigate to="/login/admin" replace state={{ from: location }} />
          )
        }
      />

      {/* Driver Workspace (Protected) */}
      <Route
        path="/driver/*"
        element={
          driverUser ? (
            <div className="min-h-screen bg-[#f8fafc]">
              <DriverDataIngestView
                currentPersona={driverUser}
                onLogout={handleDriverLogout}
                onSwitchToAdmin={() => navigate('/login/admin')}
              />
            </div>
          ) : (
            <Navigate to="/login/driver" replace state={{ from: location }} />
          )
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
