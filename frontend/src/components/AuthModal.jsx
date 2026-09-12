import React, { useState } from 'react';
import {
  Shield,
  X,
  Lock,
  Mail,
  User,
  Phone,
  Car,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { api, setAuthToken } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, demoPersonas = [] }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState('driver'); // 'driver' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [platform, setPlatform] = useState('Ola & Uber');
  const [vehicleType, setVehicleType] = useState('Sedan (Dzire)');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      let res;
      if (isSignUp) {
        res = await api.register({
          email,
          password,
          full_name: fullName,
          role,
          phone: phone || '+91 98450 00000',
          city,
          platform: role === 'driver' ? platform : undefined,
          vehicle_type: role === 'driver' ? vehicleType : undefined,
        });
      } else {
        res = await api.login(email, password);
      }

      setAuthToken(res.access_token);
      onAuthSuccess({
        id: res.user_id,
        user_id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role,
        token: res.access_token,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (p) => {
    setAuthToken(p.token);
    onAuthSuccess(p);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md shadow-blue-500/20">
              GS
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-sm tracking-tight">GigScore Account</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {isSignUp ? 'New Account Registration' : 'Secure Login'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
            className={`py-2 rounded-lg transition-all ${
              !isSignUp ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
            className={`py-2 rounded-lg transition-all ${
              isSignUp ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up (New Driver)
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isSignUp && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      role === 'driver'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    🚗 Gig Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      role === 'admin'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    🛡️ Underwriter / Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Full Legal Name</label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              {role === 'driver' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option>Bengaluru</option>
                      <option>Mumbai</option>
                      <option>Delhi-NCR</option>
                      <option>Chennai</option>
                      <option>Hyderabad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option>Ola & Uber</option>
                      <option>Uber Pro</option>
                      <option>Ola Fleet</option>
                      <option>Rapido / Bike Taxi</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all mt-2"
          >
            {loading ? (
              <span>Processing...</span>
            ) : isSignUp ? (
              <>
                <span>Create Account & Start Ingestion</span>
                <ArrowRight size={13} />
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Instant Demo Logins:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demoPersonas.slice(0, 4).map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => handleQuickDemoLogin(p)}
                className="p-2 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all text-[11px]"
              >
                <div className="font-extrabold text-slate-800 truncate">{p.full_name}</div>
                <div className="text-[10px] text-slate-400 font-mono capitalize">
                  {p.role} {p.driver_meta?.score ? `• ${p.driver_meta.score} pts` : ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
