import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Database,
  RefreshCw,
  Users,
  BarChart3,
} from 'lucide-react';
import { resolveMediaUrl } from '../services/api';
import { stopAllCameras } from '../services/cameraManager';

export default function FaceVerifiedSuccessCard({
  user = {},
  capturedPhoto = null,
  onProceed,
}) {
  const [countdown, setCountdown] = useState(5);
  const [progress, setProgress] = useState(0);

  // Ensure camera is stopped and start 5-second auto-redirect countdown
  useEffect(() => {
    stopAllCameras();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onProceed) onProceed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Smooth progress bar update over 5 seconds (5000ms)
    const startTime = Date.now();
    const duration = 5000;
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progressTimer);
      }
    }, 40);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [onProceed]);

  const fullName = user.full_name || 'Rishikesh Shedge';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'RS';

  const avatarSrc = capturedPhoto || (user.avatar_url ? resolveMediaUrl(user.avatar_url) : null);
  const fleetId = user.id ? `GS-${user.id.slice(-6).toUpperCase()}` : 'GS-4ED852';
  const platformName = user.platform || 'Uber & Ola Fleet Partner';

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 select-none">
      {/* Top Header Bar */}
      <header className="max-w-[1340px] w-full mx-auto px-4 sm:px-8 lg:px-10 pt-6 sm:pt-7 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/gigscore-icon.png"
            alt="GigScore"
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-xs shrink-0"
          />
          <div>
            <div className="font-black text-xl sm:text-2xl tracking-tight text-slate-900 leading-none">
              GigScore
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
              Drive Today. Build Tomorrow.
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Underwriting Engine Online</span>
        </div>
      </header>

      {/* Main 3-Column Content Container */}
      <main className="flex-1 max-w-[1340px] w-full mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: VERIFYING IDENTITY TIMELINE & DATA SAFETY            */}
          {/* ================================================================= */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Verifying<br />Your <span className="text-blue-600">Identity</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs">
                Just a quick check to keep your account safe and secure.
              </p>
            </div>

            {/* 4-Step Checklist */}
            <div className="space-y-4 pt-1">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Check size={14} className="stroke-[3]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">Detecting face</div>
                  <div className="text-xs text-slate-500 mt-0.5">Face found</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Check size={14} className="stroke-[3]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">Checking liveness</div>
                  <div className="text-xs text-slate-500 mt-0.5">Real person confirmed</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Check size={14} className="stroke-[3]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">Matching with records</div>
                  <div className="text-xs text-slate-500 mt-0.5">Identity matched</div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">Verification complete</div>
                  <div className="text-xs text-slate-500 mt-0.5">Redirecting to dashboard...</div>
                </div>
              </div>
            </div>

            {/* Bottom Trust Card */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 shadow-xs flex items-start gap-3 max-w-sm mt-6">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <ShieldCheck size={17} />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-xs font-bold text-slate-900">Your data is safe with us</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  We use encrypted, privacy-first verification. Your face data is not stored permanently.
                </p>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* CENTER COLUMN: MAIN VERIFIED CARD & 5-SEC REDIRECTION PROGRESS    */}
          {/* ================================================================= */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="w-full max-w-md mx-auto bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm text-center relative animate-in fade-in zoom-in-95 duration-200">
              
              {/* Floating Confetti Dots & Center Checkmark Badge */}
              <div className="relative inline-block mx-auto mb-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md mx-auto">
                  <Check size={24} className="stroke-[3]" />
                </div>
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-1 -left-4 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-teal-400 absolute -bottom-1 -left-3" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute top-2 -right-5" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-2 right-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 absolute -bottom-2 right-2" />
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome back, Driver Partner
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 mb-5">
                You're verified and all set!
              </p>

              {/* Verified Portrait with Ring & Verified Checkmark */}
              <div className="relative w-36 h-36 mx-auto my-3">
                <div className="w-full h-full rounded-full ring-4 ring-emerald-400 ring-offset-2 overflow-hidden bg-slate-900 shadow-md flex items-center justify-center">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-3xl flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white border-2 border-white flex items-center justify-center absolute bottom-0.5 right-0.5 shadow-md">
                  <Check size={15} className="stroke-[3]" />
                </div>
              </div>

              {/* Face Verified Successfully Banner */}
              <div className="my-4 inline-flex items-center gap-2.5 px-4 py-2 bg-[#ecfdf5] border border-emerald-200/80 rounded-2xl shadow-xs">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-xs font-bold text-slate-900">Face Verified Successfully</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Matched in 0.64s</div>
                </div>
              </div>

              {/* 3 Metrics Row */}
              <div className="grid grid-cols-3 gap-2 py-2 text-left">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">99.82%</div>
                    <div className="text-[10px] text-slate-500">Confidence Index</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Liveness</div>
                    <div className="text-[10px] text-slate-500">Confirmed</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Identity</div>
                    <div className="text-[10px] text-slate-500">Matched</div>
                  </div>
                </div>
              </div>

              {/* Driver Dossier Pill Card */}
              <div className="p-3.5 rounded-2xl bg-[#f0f7ff] border border-blue-100 flex items-center gap-3 text-left my-4 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 truncate">{fullName}</span>
                    <CheckCircle2 size={15} className="text-blue-600 fill-blue-600 text-white shrink-0" />
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    Fleet ID: {fleetId} • {platformName}
                  </div>
                </div>
              </div>

              {/* 5-Second Countdown & Animated Progress Bar */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2">
                <button
                  type="button"
                  onClick={onProceed}
                  className="text-xs font-semibold text-blue-700 flex items-center justify-center gap-2 mx-auto cursor-pointer hover:underline"
                >
                  <RefreshCw size={13} className="animate-spin text-blue-600" />
                  <span>Redirecting you to your dashboard in {countdown} seconds...</span>
                </button>
                <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden relative">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: DRIVE WITH CONFIDENCE & VALUE ICONS                 */}
          {/* ================================================================= */}
          <div className="lg:col-span-3 space-y-6 flex flex-col items-center text-center order-3">
            {/* Illustrated Shield with Checkmark */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-blue-50/80 absolute inset-2 -z-10 animate-pulse" />
              <div className="w-20 h-24 bg-gradient-to-b from-blue-500 to-blue-600 rounded-t-3xl rounded-b-[40px] shadow-lg shadow-blue-500/25 flex items-center justify-center text-white">
                <Check size={36} className="stroke-[3]" />
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-3 right-5" />
              <span className="w-2 h-2 rounded-full bg-blue-400 absolute bottom-4 left-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 absolute top-5 left-7" />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 absolute bottom-6 right-4" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-xl font-bold text-slate-900">Drive with Confidence</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your verified identity helps us create a safer and fairer platform for everyone.
              </p>
            </div>

            {/* 3 Circular Value Badges */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                  <Users size={18} />
                </div>
                <div className="text-xs font-medium text-slate-600">Safer Rides</div>
              </div>

              <div className="space-y-1.5 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                  <ShieldCheck size={18} />
                </div>
                <div className="text-xs font-medium text-slate-600">Trusted Community</div>
              </div>

              <div className="space-y-1.5 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                  <BarChart3 size={18} />
                </div>
                <div className="text-xs font-medium text-slate-600">More Opportunities</div>
              </div>
            </div>
          </div>

        </div>

        {/* Centered Bottom Tagline */}
        <div className="mt-12 text-center text-xs text-slate-400 font-medium">
          ─── "Verified today. A better tomorrow." ───
        </div>
      </main>
    </div>
  );
}
