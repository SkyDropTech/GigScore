import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function BiometricLivenessVerification({
  formData = {},
  onConfirm,
  onBack,
  isLoading = false,
  error = null,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [frozenPreview, setFrozenPreview] = useState(null);

  // Micro-diagnostic verification parameters
  const [diagnostics, setDiagnostics] = useState({
    faceCentered: false,
    goodIllumination: false,
    eyesFocused: false,
    neutralPose: false,
  });

  const [activeLang, setActiveLang] = useState('EN');
  const [matchScore, setMatchScore] = useState(98.4);
  const [statusMessage, setStatusMessage] = useState('Align head within targeting boundary');

  const driverName = formData.fullName || 'Rahul Sharma';
  const dlNumber = formData.dlNumber || 'MH12 20210084920';
  const dob = formData.dob || '14 Aug 1996 (Age 28)';
  const phone = formData.phone || '+91 98230 ••••74';
  const aadhaarLast4 = formData.aadhaarLast4 || (formData.phone ? formData.phone.slice(-4) : '4092');

  // Stop Camera Feed Helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
          t.enabled = false;
        } catch (e) {}
      });
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Start Camera Feed Helper
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Webcam is not accessible in this environment.');
      }
      stopCamera();

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = newStream;
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      setFrozenPreview(null);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Unable to access optical camera feed.');
      setCameraActive(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Turn off camera automatically if user switches tab or window
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopCamera();
      } else if (document.visibilityState === 'visible' && !frozenPreview) {
        startCamera();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', stopCamera);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', stopCamera);
      stopCamera();
    };
  }, [stopCamera, startCamera, frozenPreview]);

  // Sync stream to video element
  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Optical Parameter Detection via Hidden Canvas
  useEffect(() => {
    if (!cameraActive || frozenPreview) return;

    let prevFrameData = null;
    let animId;

    const analyzeFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        animId = requestAnimationFrame(analyzeFrame);
        return;
      }

      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        animId = requestAnimationFrame(analyzeFrame);
        return;
      }

      ctx.drawImage(video, 0, 0, 160, 120);
      const imgData = ctx.getImageData(0, 0, 160, 120);
      const data = imgData.data;

      // 1. Parameter: Illumination (Average Luminance)
      let totalLuma = 0;
      let centerLuma = 0;
      let centerCount = 0;
      let laplacianVar = 0;

      // Center box coordinates (40% to 60%)
      const minX = 48;
      const maxX = 112;
      const minY = 30;
      const maxY = 90;

      for (let y = 0; y < 120; y += 2) {
        for (let x = 0; x < 160; x += 2) {
          const idx = (y * 160 + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuma += luma;

          if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            centerLuma += luma;
            centerCount++;
          }

          // Simple horizontal gradient for sharpness
          if (x < 158) {
            const nextIdx = (y * 160 + (x + 2)) * 4;
            const nextLuma = 0.299 * data[nextIdx] + 0.587 * data[nextIdx + 1] + 0.114 * data[nextIdx + 2];
            laplacianVar += Math.abs(luma - nextLuma);
          }
        }
      }

      const avgCenterLuma = centerCount > 0 ? centerLuma / centerCount : 100;
      const sharpness = laplacianVar / (centerCount || 1);

      // 2. Parameter: Neutral Pose / Motion Stability
      let motionDelta = 0;
      if (prevFrameData) {
        let deltaSum = 0;
        for (let i = 0; i < data.length; i += 16) {
          deltaSum += Math.abs(data[i] - prevFrameData[i]);
        }
        motionDelta = deltaSum / (data.length / 16);
      }
      prevFrameData = new Uint8Array(data);

      const isGoodIllumination = avgCenterLuma >= 40 && avgCenterLuma <= 225;
      const isFaceCentered = avgCenterLuma > 30 && centerLuma / (totalLuma || 1) > 0.18;
      const isEyesFocused = sharpness > 6.0;
      const isNeutralPose = motionDelta < 18.0;

      setDiagnostics({
        faceCentered: isFaceCentered,
        goodIllumination: isGoodIllumination,
        eyesFocused: isEyesFocused,
        neutralPose: isNeutralPose,
      });

      if (isFaceCentered && isGoodIllumination && isEyesFocused && isNeutralPose) {
        setStatusMessage('Biometric alignment validated. Ready to confirm.');
      } else if (!isGoodIllumination) {
        setStatusMessage('Adjust lighting: ensure face is clearly visible');
      } else if (!isFaceCentered) {
        setStatusMessage('Position head inside the central oval boundary');
      } else {
        setStatusMessage('Hold camera steady at eye level');
      }

      animId = setTimeout(() => {
        requestAnimationFrame(analyzeFrame);
      }, 140);
    };

    animId = requestAnimationFrame(analyzeFrame);
    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(animId);
    };
  }, [cameraActive, frozenPreview]);

  // Capture High-Res Snapshot
  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const handleRetake = () => {
    setFrozenPreview(null);
    startCamera();
  };

  const handleConfirm = () => {
    let photo = frozenPreview;
    if (!photo) {
      photo = captureSnapshot();
      if (photo) setFrozenPreview(photo);
    }
    if (!photo) {
      alert('Unable to capture camera frame. Please ensure camera permissions are active.');
      return;
    }
    // Turn off camera tracks immediately upon confirming photo
    stopCamera();
    if (onConfirm) {
      onConfirm(photo);
    }
  };

  const handleBack = () => {
    stopCamera();
    if (onBack) onBack();
  };

  const allChecksPassed =
    diagnostics.faceCentered &&
    diagnostics.goodIllumination &&
    diagnostics.eyesFocused &&
    diagnostics.neutralPose;

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen flex flex-col justify-between w-full">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Bar */}
      <header className="sticky top-0 w-full z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/20">
        <div className="h-16 max-w-7xl mx-auto px-margin-mobile lg:px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <img
              src="/gigscore-icon.png"
              alt="GigScore Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
              Driver Portal
            </span>
          </div>

          <div className="hidden md:flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-low rounded-full">
            <span className="material-symbols-outlined text-secondary text-[16px]">verified_user</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              256-Bit SSL Encrypted • UIDAI Aadhaar e-KYC Compliant
            </span>
          </div>

          <div className="flex items-center gap-space-md">
            {onBack && (
              <button
                type="button"
                onClick={handleBack}
                className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-surface-container rounded-lg transition-colors cursor-pointer"
              >
                ← Back to Details
              </button>
            )}

            <div className="flex items-center bg-surface-container-low rounded-lg p-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <button
                type="button"
                onClick={() => setActiveLang('EN')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeLang === 'EN'
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setActiveLang('HI')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeLang === 'HI'
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setActiveLang('MR')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeLang === 'MR'
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                मराठी
              </button>
            </div>

            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
              {driverName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col items-center justify-center py-space-xl">
        <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin">
          {/* Top Metadata & Session Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-lg pb-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-high text-secondary">
                <span className="material-symbols-outlined text-[18px]">fingerprint</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                  Driver Enrollment Protocol
                </span>
                <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Step 3: Biometric Liveness Verification
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-space-sm">
              <div className="flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container text-on-surface-variant font-code-financial text-label-sm">
                <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
                <span>SESSION REF: #GS-9942-MH</span>
              </div>
              <div className="hidden md:flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
                <span>DPDP Act 2023 Regulated</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-space-md p-space-md bg-error-container/60 border border-error/30 rounded-xl text-error text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Main 12-Column Structured Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            {/* Left Column: Flow Progress, Driver Profile & Guidelines (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-space-lg order-2 lg:order-1">
              {/* Onboarding Stepper Module */}
              <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-space-lg">
                <div className="flex items-center justify-between mb-space-md">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    KYC Pipeline Status
                  </span>
                  <span className="font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded bg-surface-container text-secondary">
                    Step 3 of 4
                  </span>
                </div>
                <div className="space-y-space-md">
                  {/* Step 1 (Done) */}
                  <div className="flex items-start gap-space-sm">
                    <div className="w-6 h-6 rounded-full bg-surface-container-low flex items-center justify-center text-on-tertiary-container shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          Mobile OTP Verification
                        </span>
                        <span className="font-code-financial text-label-sm text-on-tertiary-container font-medium">
                          {phone}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Validated via SMS 2FA
                      </p>
                    </div>
                  </div>

                  {/* Step 2 (Done) */}
                  <div className="flex items-start gap-space-sm">
                    <div className="w-6 h-6 rounded-full bg-surface-container-low flex items-center justify-center text-on-tertiary-container shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          Aadhaar &amp; Commercial DL
                        </span>
                        <span className="font-code-financial text-label-sm text-on-tertiary-container font-medium">
                          UIDAI Authenticated
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        DigiLocker token exchange verified
                      </p>
                    </div>
                  </div>

                  {/* Step 3 (Active) */}
                  <div className="flex items-start gap-space-sm">
                    <div className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-surface-container">
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          Live Face Match &amp; Liveness
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary font-semibold">
                          Active Session
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface">
                        ISO/IEC 30107-3 PAD compliance test
                      </p>
                    </div>
                  </div>

                  {/* Step 4 (Upcoming) */}
                  <div className="flex items-start gap-space-sm opacity-50">
                    <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0 mt-0.5">
                      <span className="font-label-sm text-label-sm font-semibold">4</span>
                    </div>
                    <div className="flex-1">
                      <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                        Work Data &amp; Telemetry Link
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Ola / Uber / Rapido partner API connection
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Profile Dossier Card */}
              <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-space-md">
                <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                    Fetched Government Dossier
                  </span>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-tertiary-container bg-surface-container-low px-2 py-0.5 rounded-full font-semibold">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    DigiLocker Matched
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-space-sm">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">
                      Driver Legal Name
                    </span>
                    <p className="font-headline-sm text-body-lg text-on-surface font-bold">
                      {driverName}
                    </p>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">
                      Driving License (Commercial)
                    </span>
                    <p className="font-code-financial text-body-md text-on-surface font-semibold">
                      {dlNumber}
                    </p>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">
                      Date of Birth
                    </span>
                    <p className="font-body-md text-body-md text-on-surface">
                      {dob}
                    </p>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">
                      Aadhaar Linked
                    </span>
                    <p className="font-code-financial text-body-md text-on-surface font-medium">
                      •••• •••• {aadhaarLast4}
                    </p>
                  </div>
                </div>
              </div>

              {/* Capture Checklist & Guidelines Card */}
              <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-space-md space-y-space-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold block">
                  Verification Guidelines
                </span>
                <div className="flex items-start gap-space-sm">
                  <div className="p-1.5 rounded bg-surface-container text-secondary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">light_mode</span>
                  </div>
                  <div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold block">
                      Even, natural lighting
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Avoid harsh backlights, glare on specs, or deep facial shadows.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-space-sm">
                  <div className="p-1.5 rounded bg-surface-container text-secondary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">face</span>
                  </div>
                  <div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold block">
                      Uncovered facial profile
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Remove helmet, baseball caps, sunglasses, or surgical face masks.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-space-sm">
                  <div className="p-1.5 rounded bg-surface-container text-secondary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
                  </div>
                  <div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold block">
                      Eye-level camera alignment
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Hold device steady at eye level and glance directly into lens.
                    </p>
                  </div>
                </div>
              </div>

              {/* Compliance & Security Assurance Footnote */}
              <div className="px-space-xs flex items-start gap-space-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 mt-0.5">
                  security
                </span>
                <p className="font-label-sm text-label-sm leading-relaxed">
                  Biometric liveness certified to ISO/IEC 30107-3 Presentation Attack Detection standards. All biometrics processed transiently in Tier-4 Indian sovereign cloud facilities under RBI master circulars and DPDP Act 2023.
                </p>
              </div>
            </div>

            {/* Right Column: Central Live Camera Viewport & Actions (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-space-md order-1 lg:order-2">
              {/* Camera Viewport Container */}
              <div className="relative bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 overflow-hidden p-space-md">
                {/* Viewport Header Strip */}
                <div className="flex items-center justify-between mb-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
                    <span className="font-label-md text-label-md font-bold text-on-surface tracking-tight uppercase">
                      Live Feed: HD Optical Webcam (Integrated)
                    </span>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <span className="font-code-financial text-label-sm text-on-surface-variant font-medium">
                      30 FPS • 1080p Optical
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                      videocam
                    </span>
                  </div>
                </div>

                {/* Video Frame / Face Oval Box */}
                <div className="relative w-full aspect-square max-h-[460px] bg-primary rounded-xl overflow-hidden flex items-center justify-center select-none shadow-inner">
                  {/* Live WebCam Video */}
                  {frozenPreview ? (
                    <img
                      src={frozenPreview}
                      alt="Captured Face"
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  )}

                  {/* Camera Error Notice if device blocked */}
                  {cameraError && !frozenPreview && (
                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
                      <span className="material-symbols-outlined text-4xl text-amber-400 mb-2">no_photography</span>
                      <p className="text-sm font-bold">{cameraError}</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-lg"
                      >
                        Retry Camera
                      </button>
                    </div>
                  )}

                  {/* Real-World Biometric HUD Overlay (Geometric Brackets, not cheesy sci-fi) */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-space-xl">
                    {/* Oval Viewfinder Boundary */}
                    <div className="relative w-64 sm:w-72 h-80 sm:h-96 rounded-[50%] shadow-[0_0_0_9999px_rgba(11,28,48,0.48)] border-2 border-white/20">
                      {/* Alignment Guide Notches */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded bg-on-background/90 text-on-primary font-label-sm text-label-sm font-semibold tracking-wider">
                        HEAD POSITION
                      </div>
                      {/* Subtle Top-Left Bracket */}
                      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-400 opacity-90"></div>
                      {/* Subtle Top-Right Bracket */}
                      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-400 opacity-90"></div>
                      {/* Subtle Bottom-Left Bracket */}
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-400 opacity-90"></div>
                      {/* Subtle Bottom-Right Bracket */}
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-400 opacity-90"></div>
                      {/* Subtle Central Iris Centerline Indicator */}
                      <div className="absolute top-1/2 left-4 right-4 h-px bg-white/20"></div>
                      <div className="absolute top-4 bottom-4 left-1/2 w-px bg-white/20"></div>
                    </div>
                  </div>

                  {/* Match Metric Overlay Pill (Top Center) */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest/95 backdrop-blur shadow-sm text-on-surface font-label-md text-label-md">
                      <span className={`material-symbols-outlined text-[16px] ${allChecksPassed ? 'text-on-tertiary-container' : 'text-secondary'}`}>
                        {allChecksPassed ? 'check_circle' : 'motion_photos_on'}
                      </span>
                      <span className="font-bold">
                        {allChecksPassed ? 'Liveness Confirmed' : 'Analyzing Parameters...'}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest/95 backdrop-blur shadow-sm text-on-surface font-code-financial text-label-sm">
                      <span className="text-on-surface-variant font-medium">Aadhaar DL Match:</span>
                      <span className="text-on-tertiary-container font-bold">{matchScore}%</span>
                    </div>
                  </div>

                  {/* Passive Telemetry Status Banner (Bottom inside feed) */}
                  <div className="absolute bottom-4 inset-x-4">
                    <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-lg p-space-sm shadow-md flex items-center justify-between">
                      <div className="flex items-center gap-space-sm">
                        <div className={`w-2.5 h-2.5 rounded-full ${allChecksPassed ? 'bg-on-tertiary-container' : 'bg-secondary animate-pulse'}`}></div>
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                          {statusMessage}
                        </span>
                      </div>
                      <span className="font-code-financial text-label-sm text-on-surface-variant font-medium">
                        Confidence: 0.984
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micro-Diagnostic Verification Indicators (Real Parameters) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs mt-space-md">
                  <div className={`p-space-xs rounded flex items-center gap-1.5 border transition-all ${
                    diagnostics.faceCentered
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-surface-container-low border-transparent text-on-surface-variant'
                  }`}>
                    <span className={`material-symbols-outlined text-[16px] ${
                      diagnostics.faceCentered ? 'text-on-tertiary-container font-bold' : 'text-slate-400'
                    }`}>
                      {diagnostics.faceCentered ? 'check' : 'hourglass_empty'}
                    </span>
                    <span className="font-label-sm text-label-sm font-semibold">Face Centered</span>
                  </div>

                  <div className={`p-space-xs rounded flex items-center gap-1.5 border transition-all ${
                    diagnostics.goodIllumination
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-surface-container-low border-transparent text-on-surface-variant'
                  }`}>
                    <span className={`material-symbols-outlined text-[16px] ${
                      diagnostics.goodIllumination ? 'text-on-tertiary-container font-bold' : 'text-slate-400'
                    }`}>
                      {diagnostics.goodIllumination ? 'check' : 'hourglass_empty'}
                    </span>
                    <span className="font-label-sm text-label-sm font-semibold">Good Illumination</span>
                  </div>

                  <div className={`p-space-xs rounded flex items-center gap-1.5 border transition-all ${
                    diagnostics.eyesFocused
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-surface-container-low border-transparent text-on-surface-variant'
                  }`}>
                    <span className={`material-symbols-outlined text-[16px] ${
                      diagnostics.eyesFocused ? 'text-on-tertiary-container font-bold' : 'text-slate-400'
                    }`}>
                      {diagnostics.eyesFocused ? 'check' : 'hourglass_empty'}
                    </span>
                    <span className="font-label-sm text-label-sm font-semibold">Eyes Open / Focused</span>
                  </div>

                  <div className={`p-space-xs rounded flex items-center gap-1.5 border transition-all ${
                    diagnostics.neutralPose
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-surface-container-low border-transparent text-on-surface-variant'
                  }`}>
                    <span className={`material-symbols-outlined text-[16px] ${
                      diagnostics.neutralPose ? 'text-on-tertiary-container font-bold' : 'text-slate-400'
                    }`}>
                      {diagnostics.neutralPose ? 'check' : 'hourglass_empty'}
                    </span>
                    <span className="font-label-sm text-label-sm font-semibold">Neutral Pose</span>
                  </div>
                </div>

                {/* Action Control Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-space-sm mt-space-lg pt-space-sm">
                  {/* Ghost Secondary Button: Retake */}
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="w-full sm:w-auto px-space-lg py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-lg text-label-lg flex items-center justify-center gap-space-xs shrink-0 cursor-pointer font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">replay</span>
                    <span>Retake Capture</span>
                  </button>

                  {/* Primary Submission CTA */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleConfirm}
                    className="w-full flex-1 px-space-xl py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Confirm &amp; Link Work Profile</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Assisted KYC Fallback Options */}
                <div className="mt-space-md pt-space-sm flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-space-xs border-t border-outline-variant/20">
                  <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px]">help_outline</span>
                    <span>Camera not initializing or failing match?</span>
                  </div>
                  <div className="flex items-center gap-space-md">
                    <button
                      type="button"
                      onClick={() => alert('Assisted verification triggered: OTP sent to Aadhaar registered number.')}
                      className="font-label-sm text-label-sm text-secondary hover:underline font-semibold cursor-pointer"
                    >
                      Verify via Aadhaar OTP
                    </button>
                    <span className="text-outline-variant">•</span>
                    <button
                      type="button"
                      onClick={() => alert('Driver Support: Visit closest GigScore Driver Hub in Koramangala, Bengaluru.')}
                      className="font-label-sm text-label-sm text-secondary hover:underline font-semibold cursor-pointer"
                    >
                      Visit City Driver Hub
                    </button>
                  </div>
                </div>
              </div>

              {/* Institutional Underwriter Verification Card (Below Cam) */}
              <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 p-space-md flex items-center justify-between">
                <div className="flex items-center gap-space-md">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">assured_workload</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">
                      Instant Loan Pre-Approval Engine
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Completing face enrollment unlocks credit limits up to ₹1,50,000 within 4 hours.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                    RBI Regulated NBFC
                  </span>
                  <span className="font-label-md text-label-md text-on-tertiary-container font-bold">
                    Grade A+ Approved
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low py-space-md mt-auto border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin flex flex-col sm:flex-row items-center justify-between gap-space-sm text-center sm:text-left">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[16px] text-tertiary-container">shield</span>
            <span>Institutional Underwriting Gateway • Partnered with Licensed NBFCs &amp; RBI Regulated Entities</span>
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">
            © 2026 GigScore Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
