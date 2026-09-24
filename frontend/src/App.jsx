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
    // If authenticated user is admin or lender, redirect to Admin Ops Console
    if (userObj.role === 'admin' || userObj.role === 'lender') {
      setAdminUser(userObj);
      setAuthToken(userObj.token);
      const targetPath = location.state?.from?.pathname?.startsWith('/admin')
        ? location.state.from.pathname
        : '/admin/overview';
      navigate(targetPath, { replace: true });
      return;
    }
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
    navigate('/login/driver', { replace: true });
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

  // Header for unauthenticated login screen: seamless brand presentation matching reference image
  const renderLoginHeader = () => (
    <header className="max-w-[1340px] w-full mx-auto px-4 sm:px-8 lg:px-10 pt-6 sm:pt-8 pb-2 flex items-center justify-between bg-transparent">
      <div className="flex items-center gap-3">
        <img src="/gigscore-icon.png" alt="GigScore" className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-xs shrink-0" />
        <div>
          <div className="font-black text-xl sm:text-2xl tracking-tight text-slate-900 leading-none">
            GigScore
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
            Drive Today. Build Tomorrow.
          </div>
        </div>
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
            <DriverPortalLogin
              renderHeader={() => renderLoginHeader('driver')}
              onLoginSuccess={handleDriverLoginSuccess}
            />
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
            <AdminPortalLogin
              renderHeader={() => renderLoginHeader('admin')}
              onLoginSuccess={handleAdminLoginSuccess}
            />
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
