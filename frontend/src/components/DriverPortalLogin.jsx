import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  Car,
  MapPin,
  ArrowRight,
  AlertCircle,
  FileText,
  CreditCard,
  Calendar,
  Scan,
  Camera,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Zap,
  Briefcase,
  BarChart3,
  Wallet,
  ShieldCheck,
  Coins,
  Eye,
  ScanFace,
  Wrench,
} from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import { stopAllCameras } from '../services/cameraManager';
import BiometricLivenessVerification from './BiometricLivenessVerification';
import FaceVerifiedSuccessCard from './FaceVerifiedSuccessCard';
import FaceBiometricScanner from './FaceBiometricScanner';

export default function DriverPortalLogin({ onLoginSuccess, renderHeader }) {
  // Mode: 'login' | 'register'
  const [isSignUp, setIsSignUp] = useState(false);

  // Login Method: 'face' | 'password'
  const [loginMethod, setLoginMethod] = useState('face');

  // Registration Multi-Step State: 1 = Details, 2 = Biometric Liveness, 3 = Verified Success
  const [regStep, setRegStep] = useState(1);

  // Login Multi-Step State: 'credentials' | 'verified_success'
  const [loginStep, setLoginStep] = useState('credentials');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dlNumber, setDlNumber] = useState('MH12 20210084920');
  const [aadhaarLast4, setAadhaarLast4] = useState('4092');
  const [dob, setDob] = useState('14 Aug 1996 (Age 28)');
  const [city, setCity] = useState('Bengaluru');
  const [platform, setPlatform] = useState('Uber & Ola Fleet Partner');
  const [vehicleType, setVehicleType] = useState('Sedan (Dzire)');

  // Biometric & Authentication State
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [pendingLoginUser, setPendingLoginUser] = useState(null);
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Unconditionally stop all camera feeds if driver portal unmounts
  useEffect(() => {
    return () => {
      stopAllCameras();
    };
  }, []);

  // Switch between Sign In and Sign Up tabs
  const handleTabSwitch = (signUp) => {
    stopAllCameras();
    setShowFaceScanner(false);
    setIsSignUp(signUp);
    setRegStep(1);
    setLoginStep('credentials');
    setLoginMethod('face');
    setErrorMsg(null);
    setVerifiedUser(null);
    setCapturedPhoto(null);
  };

  // ==========================================
  // REGISTRATION FLOW
  // ==========================================

  // Step 1: Submit Details & Proceed to Step 2 (Biometric Liveness Verification)
  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full legal name as per driving license.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide a valid email and secure password.');
      return;
    }

    // Move to Step 2: Biometric Liveness Verification
    setRegStep(2);
  };

  // Step 2: Confirm Biometric Photo from Camera
  const handleBiometricConfirm = async (base64Photo) => {
    setLoading(true);
    setErrorMsg(null);
    setCapturedPhoto(base64Photo);

    try {
      const res = await api.register({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        role: 'driver',
        phone: phone || '+91 98230 44092',
        city,
        platform,
        vehicle_type: vehicleType,
        dl_number: dlNumber,
        aadhaar_last4: aadhaarLast4,
        dob: dob,
        face_image: base64Photo,
      });

      setAuthToken(res.access_token);
      setVerifiedUser({
        id: res.user_id,
        user_id: res.user_id,
        email: res.email,
        full_name: res.full_name || fullName,
        role: 'driver',
        avatar_url: res.avatar_url || base64Photo,
        token: res.access_token,
      });

      // Advance to Step 3: Verified Success Screen
      setRegStep(3);
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Biometric registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIN FLOW (Either Password OR Face ID)
  // ==========================================

  // 1. Password Login -> Direct to Dashboard!
  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.login(email.trim().toLowerCase(), password);

      setAuthToken(res.access_token);
      const userObj = {
        id: res.user_id || res.id,
        user_id: res.user_id || res.id,
        email: res.email || email,
        full_name: res.full_name || (res.role === 'admin' ? 'Vivek Menon (Senior Underwriter)' : 'Driver Partner'),
        role: res.role || 'driver',
        avatar_url: res.avatar_url,
        token: res.access_token,
      };

      if (onLoginSuccess) {
        onLoginSuccess(userObj);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Face Verification Success Handler -> Displays Verified Card
  const handleFaceVerifySuccess = async (res) => {
    // Forcefully shut off camera immediately
    stopAllCameras();
    setShowFaceScanner(false);

    const userObj = {
      id: res.user_id || pendingLoginUser?.user_id || pendingLoginUser?.id || res.id,
      user_id: res.user_id || pendingLoginUser?.user_id || res.id,
      email: res.email || pendingLoginUser?.email || email,
      full_name: res.full_name || pendingLoginUser?.full_name || 'Driver Partner',
      role: 'driver',
      avatar_url: res.avatar_url || pendingLoginUser?.avatar_url || capturedPhoto,
      token: res.access_token || pendingLoginUser?.access_token,
    };

    if (userObj.token) {
      setAuthToken(userObj.token);
    }
    setVerifiedUser(userObj);
    setLoginStep('verified_success');
  };

  // Step 3: Final proceed to workspace
  const handleProceedToDashboard = () => {
    stopAllCameras();
    if (verifiedUser && onLoginSuccess) {
      onLoginSuccess(verifiedUser);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  // Quick fill demo driver
  const handleQuickFillDriver = (demoEmail = 'khushdeep@gmail.com') => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMsg(null);
  };

  // =========================================================================
  // VIEW 1: REGISTRATION STEP 2 -> Full Page Biometric Liveness Verification
  // =========================================================================
  if (isSignUp && regStep === 2) {
    return (
      <BiometricLivenessVerification
        formData={{
          fullName,
          phone: phone || '+91 98230 ••••74',
          dlNumber,
          aadhaarLast4,
          dob,
          city,
          platform,
        }}
        isLoading={loading}
        error={errorMsg}
        onBack={() => setRegStep(1)}
        onConfirm={handleBiometricConfirm}
      />
    );
  }

  // =========================================================================
  // VIEW 2: REGISTRATION STEP 3 OR LOGIN STEP 3 -> Verified Success Screen
  // =========================================================================
  if (
    (isSignUp && regStep === 3 && verifiedUser) ||
    (!isSignUp && loginStep === 'verified_success' && verifiedUser)
  ) {
    return (
      <FaceVerifiedSuccessCard
        user={verifiedUser}
        capturedPhoto={capturedPhoto}
        onProceed={handleProceedToDashboard}
      />
    );
  }

  // =========================================================================
  // VIEW 3: PROFESSIONAL SPLIT-SCREEN SHOWCASE & AUTHENTICATION
  // =========================================================================
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-500 selection:text-white">
      {renderHeader && renderHeader()}

      <main className="flex-1 flex items-start justify-center p-4 sm:p-6 lg:p-10">
        <div className="max-w-[1340px] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ================================================================= */}
          {/* LEFT COLUMN: VISUAL DESIGN EXACTLY MATCHING USER REFERENCE IMAGE   */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-slate-700 order-2 lg:order-1">
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Trusted by gig drivers across India</span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-black text-slate-900 tracking-tight leading-[1.12]">
                Build Credit From<br />Your <span className="text-blue-600">Real Work</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                GigScore turns your verified driving activity, earnings consistency, and repayment history into a transparent credit profile for gig workers.
              </p>
            </div>

            {/* 3 Highlight Cards in 3-Column Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Card 1: Income Consistency */}
              <div className="p-4 rounded-2xl bg-[#f0f6ff] border border-blue-100/90 shadow-xs flex items-center justify-between gap-2.5 transition-all hover:border-blue-200">
                <div className="space-y-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mb-2">
                    <BarChart3 size={17} />
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">Income Consistency</div>
                  <div className="text-[11px] text-slate-500 truncate">6-month earnings trend</div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </div>

              {/* Card 2: Repayment Readiness */}
              <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-emerald-100/90 shadow-xs flex items-center justify-between gap-2.5 transition-all hover:border-emerald-200">
                <div className="space-y-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mb-2">
                    <Wallet size={17} />
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">Repayment Readiness</div>
                  <div className="text-[11px] text-slate-500 truncate">EMI affordability estimate</div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </div>

              {/* Card 3: Credit Profile */}
              <div className="p-4 rounded-2xl bg-[#f5f3ff] border border-purple-100/90 shadow-xs flex items-center justify-between gap-2.5 transition-all hover:border-purple-200">
                <div className="space-y-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mb-2">
                    <ShieldCheck size={17} />
                  </div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">Credit Profile</div>
                  <div className="text-[11px] text-slate-500 truncate">Earnings + work stability</div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </div>
            </div>

            {/* What we verify */}
            <div className="space-y-2.5">
              <div>
                <h3 className="text-base font-bold text-slate-900">What we verify</h3>
                <p className="text-xs text-slate-500 mt-0.5">We analyze key data points from your driving activity (with your consent).</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center gap-2.5 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BarChart3 size={15} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Earnings consistency</span>
                </div>
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center gap-2.5 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Calendar size={15} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Work tenure</span>
                </div>
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center gap-2.5 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Car size={15} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Trip activity</span>
                </div>
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center gap-2.5 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText size={15} />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">Existing obligations</span>
                </div>
              </div>
            </div>

            {/* What you can access */}
            <div className="space-y-2.5">
              <div>
                <h3 className="text-base font-bold text-slate-900">What you can access</h3>
                <p className="text-xs text-slate-500 mt-0.5">Use your credit profile to unlock financial products designed for gig drivers.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mb-1">
                    <Wrench size={15} />
                  </div>
                  <div className="font-bold text-xs text-slate-900 leading-tight">Vehicle repair loan</div>
                  <div className="text-[11px] text-slate-500 leading-snug">Keep you on the road</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mb-1">
                    <Zap size={15} />
                  </div>
                  <div className="font-bold text-xs text-slate-900 leading-tight">Emergency credit</div>
                  <div className="text-[11px] text-slate-500 leading-snug">For unexpected needs</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mb-1">
                    <Coins size={15} />
                  </div>
                  <div className="font-bold text-xs text-slate-900 leading-tight">Working-capital support</div>
                  <div className="text-[11px] text-slate-500 leading-snug">For your growing income</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mb-1">
                    <Shield size={15} />
                  </div>
                  <div className="font-bold text-xs text-slate-900 leading-tight">Insurance options</div>
                  <div className="text-[11px] text-slate-500 leading-snug">Drive with more security</div>
                </div>
              </div>
            </div>

            {/* Your data stays under your control */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={17} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Your data stays under your control</h4>
                  <p className="text-xs text-slate-500 mt-0.5">We follow a privacy-first approach and only access your data with your explicit consent.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3.5 border-t border-slate-200/60">
                <div className="flex items-start gap-2.5">
                  <User size={17} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Consent-based data access</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">You decide what to share</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Eye size={17} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">No raw face image retention</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Face data is used only for verification</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <FileText size={17} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Transparent decision factors</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Understand how your profile is built</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: INTERACTIVE AUTHENTICATION CARD                     */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 w-full order-1 lg:order-2">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm text-slate-900 animate-in fade-in duration-200 space-y-5">
              
              {/* Card Header */}
              <div className="text-center space-y-1.5">
                <div className="inline-flex p-2.5 rounded-full bg-blue-50 text-blue-600 shadow-xs mb-1">
                  <Car size={22} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isSignUp ? 'New Driver Partner' : 'Welcome back, Driver'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {isSignUp
                    ? 'Step 1 of 3: Enter legal profile details for e-KYC'
                    : 'Login securely to access your GigScore account'}
                </p>
              </div>

              {/* Login Method Tabs: Face ID vs Password */}
              {!isSignUp ? (
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('face');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      loginMethod === 'face'
                        ? 'bg-white text-blue-600 shadow-xs font-bold border border-slate-200/50'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <ScanFace size={16} className="text-blue-600 shrink-0" />
                    <span>Face ID Verification</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('password');
                      setShowFaceScanner(false);
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      loginMethod === 'password'
                        ? 'bg-white text-blue-600 shadow-xs font-bold border border-slate-200/50'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <Lock size={15} className="shrink-0" />
                    <span>Password Login</span>
                  </button>
                </div>
              ) : (
                /* Registration Step Progress Indicator */
                <div className="flex items-center justify-between px-2 py-1.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] font-bold text-blue-900">
                  <span className="flex items-center gap-1 text-blue-700">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Profile Info
                  </span>
                  <span className="text-blue-300">→</span>
                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">2</span>
                    Biometric Scan
                  </span>
                  <span className="text-blue-300">→</span>
                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span>
                    Ready
                  </span>
                </div>
              )}

              {/* Error Message Alert */}
              {errorMsg && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ============================================================= */}
              {/* MODE 1: SIGN IN WITH FACE ID (IN-PAGE EMBEDDED)               */}
              {/* ============================================================= */}
              {!isSignUp && loginMethod === 'face' && (
                <div className="pt-1">
                  <FaceBiometricScanner
                    isOpen={true}
                    inline={true}
                    mode="login"
                    roleHint="driver"
                    emailHint={email.trim() || undefined}
                    onSuccess={handleFaceVerifySuccess}
                    onBack={() => {
                      setLoginMethod('password');
                      setErrorMsg(null);
                    }}
                    title="Face Verification"
                    subtitle="Position your face within the frame"
                  />
                </div>
              )}

              {/* ============================================================= */}
              {/* MODE 2: SIGN IN WITH PASSWORD OR SIGN UP FORM                 */}
              {/* ============================================================= */}
              {(isSignUp || loginMethod === 'password') && (
                <form onSubmit={isSignUp ? handleDetailsSubmit : handleCredentialsLogin} className="space-y-4 pt-1">
                  {isSignUp ? (
                    <>
                      {/* Full Legal Name */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Full Legal Name (as on Driving License)
                        </label>
                        <div className="relative">
                          <User size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* DL Number & Aadhaar */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            DL Number
                          </label>
                          <div className="relative">
                            <FileText size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="MH12 20210084920"
                              value={dlNumber}
                              onChange={(e) => setDlNumber(e.target.value)}
                              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Aadhaar Last 4
                          </label>
                          <div className="relative">
                            <CreditCard size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="4092"
                              value={aadhaarLast4}
                              onChange={(e) => setAadhaarLast4(e.target.value)}
                              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mobile Number & City */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Mobile Number
                          </label>
                          <div className="relative">
                            <Phone size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                            <input
                              type="tel"
                              placeholder="+91 98230 44092"
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
                            <MapPin size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
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
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Platform & Vehicle Type */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Platform
                          </label>
                          <div className="relative">
                            <Car size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                            <select
                              value={platform}
                              onChange={(e) => setPlatform(e.target.value)}
                              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                            >
                              <option value="Uber & Ola Fleet Partner">Uber &amp; Ola</option>
                              <option value="Ola Cabs Partner">Ola Cabs</option>
                              <option value="Uber Mobility Partner">Uber Mobility</option>
                              <option value="Rapido Captain">Rapido</option>
                              <option value="Porter Fleet">Porter Fleet</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Vehicle Model
                          </label>
                          <input
                            type="text"
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            placeholder="Sedan (Dzire)"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  ) : null}

                  {/* Email Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Email Address
                      </label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => handleQuickFillDriver('khushdeep@gmail.com')}
                          className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles size={11} />
                          <span>Fill Demo: khushdeep@gmail.com</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="driver@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password Input with Show/Hide Toggle */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {loading ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : isSignUp ? (
                      <>
                        <span>Proceed to Biometric Liveness Verification</span>
                        <ArrowRight size={16} />
                      </>
                    ) : (
                      <>
                        <span>Sign In to Driver Dashboard</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Toggle between Sign In & Sign Up */}
              <div className="pt-2 text-center border-t border-slate-100">
                {isSignUp ? (
                  <button
                    type="button"
                    onClick={() => handleTabSwitch(false)}
                    className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                  >
                    Already registered? <span className="text-blue-600 font-bold">Sign in with Face ID or Password</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTabSwitch(true)}
                    className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                  >
                    New to GigScore? <span className="text-blue-600 font-bold">Register here</span>
                  </button>
                )}
              </div>
            </div>

            {/* Subtle bottom UIDAI compliance assurance */}
            <div className="mt-3 text-center text-[10px] text-slate-500">
              Encrypted 256-bit AES database • Protected under Digital Personal Data Protection (DPDP) Act
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
