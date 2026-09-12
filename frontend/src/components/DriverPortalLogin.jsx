import React, { useState } from 'react';
import { Shield, Lock, Mail, User, Phone, Car, MapPin, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, setAuthToken } from '../services/api';

export default function DriverPortalLogin({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [platform, setPlatform] = useState('Ola & Uber');
  const [vehicleType, setVehicleType] = useState('Sedan (Dzire)');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

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
          role: 'driver',
          phone: phone || '+91 98450 12345',
          city,
          platform,
          vehicle_type: vehicleType,
        });
      } else {
        res = await api.login(email, password);
      }

      if (res.role !== 'driver') {
        throw new Error('Access denied: This account is not registered as a Driver. Please use the Admin Portal.');
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
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Driver Workspace</h2>
          <p className="text-xs text-slate-500 font-medium">
            {isSignUp ? 'Create your new driver profile to unlock alternative credit' : 'Sign in to access your credit scoring and loan demand desk'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
            className={`py-2 rounded-lg transition-all ${
              !isSignUp ? 'bg-white text-blue-600 shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Driver Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
            className={`py-2 rounded-lg transition-all ${
              isSignUp ? 'bg-white text-blue-600 shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Driver Registration
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Legal Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+91 98450 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Operating City
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                    >
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi-NCR">Delhi-NCR</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Pune">Pune</option>
                      <option value="Chennai">Chennai</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Primary Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                  >
                    <option value="Ola & Uber">Ola & Uber (Dual)</option>
                    <option value="Ola Fleet">Ola Cabs</option>
                    <option value="Uber Pro">Uber Fleet</option>
                    <option value="Rapido Captain">Rapido Captain</option>
                    <option value="Swiggy / Zomato">Delivery (Swiggy/Zomato)</option>
                    <option value="Porter">Porter Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Vehicle Type
                  </label>
                  <div className="relative">
                    <Car size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                    >
                      <option value="Sedan (Dzire)">Sedan (Dzire / Etios)</option>
                      <option value="Hatchback (WagonR)">Hatchback (WagonR)</option>
                      <option value="Auto Rickshaw (Bajaj)">Auto Rickshaw</option>
                      <option value="Two Wheeler (EV Bike)">EV Two Wheeler</option>
                      <option value="Commercial Mini Truck">Mini Truck / Van</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="driver@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <span>{isSignUp ? 'Complete Registration & Enter Workspace' : 'Sign In to Driver Workspace'}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-400">
          Encrypted 256-bit AES storage on local MongoDB instance
        </div>
      </div>
    </div>
  );
}
