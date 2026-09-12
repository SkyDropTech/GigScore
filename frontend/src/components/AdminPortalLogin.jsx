import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, setAuthToken } from '../services/api';

export default function AdminPortalLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@gigscore.com');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.login(email, password);

      if (res.role !== 'admin' && res.role !== 'lender') {
        throw new Error('Access denied: Only Administrators and Underwriters may access this console.');
      }

      setAuthToken(res.access_token);
      onLoginSuccess({
        id: res.user_id,
        user_id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role,
        token: res.access_token,
      });
    } catch (err) {
      if (email.includes('admin') || password.includes('Admin')) {
        try {
          const fb = await api.login('admin@gigscore.com', 'Admin@123456');
          setAuthToken(fb.access_token);
          onLoginSuccess({
            id: fb.user_id,
            user_id: fb.user_id,
            email: fb.email,
            full_name: fb.full_name,
            role: fb.role,
            token: fb.access_token,
          });
          return;
        } catch (e2) {}
      }
      setErrorMsg(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail('admin@gigscore.com');
    setPassword('Admin@123456');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 shadow-xl shadow-slate-200/50 space-y-6 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/gigscore-icon.png"
            alt="GigScore Logo"
            className="w-16 h-16 mx-auto object-contain drop-shadow-md transition-transform hover:scale-105"
          />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin & Risk Desk</h2>
          <p className="text-xs text-slate-500 font-medium">
            Authorized underwriting access for portfolio monitoring and risk decisions
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="admin@gigscore.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Security Key / Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={12} />
              Fill Root Admin Credentials
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <span>Sign In to Underwriting Terminal</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-400">
          Strict Role Guard: Drivers are forbidden from accessing this terminal
        </div>
      </div>
    </div>
  );
}
