import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  Camera,
} from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import { stopAllCameras } from '../services/cameraManager';

/**
 * Generate 52 radial tick marks around a 300x300 circle for Apple Face ID / KYC style framing
 */
const TOTAL_TICKS = 52;
const CENTER = 150;
const INNER_R = 118;
const OUTER_R = 136;

const RADIAL_TICKS = Array.from({ length: TOTAL_TICKS }, (_, i) => {
  const angle = (i * 360) / TOTAL_TICKS - 90; // start at top
  const rad = (angle * Math.PI) / 180;
  return {
    id: i,
    x1: CENTER + INNER_R * Math.cos(rad),
    y1: CENTER + INNER_R * Math.sin(rad),
    x2: CENTER + OUTER_R * Math.cos(rad),
    y2: CENTER + OUTER_R * Math.sin(rad),
  };
});

export default function FaceBiometricScanner({
  isOpen = true,
  onClose,
  onBack,
  mode = 'login', // 'login' | 'capture' | 'enroll'
  roleHint = 'driver',
  emailHint = null,
  onSuccess,
  onCapture,
  inline = false,
  title = 'Face Verification',
  subtitle = 'Position your face within the frame',
}) {
  const videoRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapshotPreview, setSnapshotPreview] = useState(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const streamRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  const autoLockTimerRef = useRef(null);
  const lockStartTimeRef = useRef(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    stopAllCameras();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {}
      });
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsFaceDetected(false);
    lockStartTimeRef.current = null;
  }, []);

  // Start camera helper
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setVerificationError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser.');
      }

      stopCamera();

      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280, min: 480 },
            height: { ideal: 720, min: 480 },
          },
          audio: false,
        });
      } catch (err1) {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = newStream;
      setStream(newStream);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera sensor hardware detected. Please connect a camera.');
      } else {
        setCameraError(err.message || 'Unable to connect to camera device.');
      }
    }
  }, [facingMode, stopCamera]);

  // Lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  // Sync stream to <video>
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    const handleVideoPlaying = () => {
      setCameraActive(true);
    };

    video.addEventListener('loadedmetadata', handleVideoPlaying);
    video.addEventListener('canplay', handleVideoPlaying);
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('loadedmetadata', handleVideoPlaying);
      video.removeEventListener('canplay', handleVideoPlaying);
    };
  }, [stream]);

  // Capture frame
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.92);
  }, [facingMode]);

  // Verify / Perform Scan
  const handlePerformScan = useCallback(async () => {
    if (isProcessing) return;

    let base64Image = snapshotPreview;
    if (!base64Image) {
      base64Image = captureFrame();
    }

    if (!base64Image) {
      setVerificationError('Unable to capture camera image. Please ensure your face is clearly visible.');
      return;
    }

    setSnapshotPreview(base64Image);
    setIsProcessing(true);
    setVerificationError(null);

    if (mode === 'capture') {
      setIsProcessing(false);
      if (onCapture) {
        onCapture(base64Image);
      }
      return;
    }

    // Login authentication
    try {
      let res;
      try {
        res = await api.faceLogin(base64Image, roleHint, emailHint);
      } catch (faceErr) {
        const errMsg = faceErr.message || '';
        // If user already authenticated via password but face is not enrolled yet, enroll seamlessly
        if (
          emailHint &&
          (errMsg.includes('not enrolled') ||
            errMsg.includes('not found') ||
            errMsg.includes('Not Found') ||
            errMsg.includes('404'))
        ) {
          await api.enrollFace(base64Image);
          res = await api.faceLogin(base64Image, roleHint, emailHint);
        } else {
          throw faceErr;
        }
      }

      setVerificationSuccess(true);
      setAuthToken(res.access_token);
      stopCamera();

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(res);
        }
      }, 700);
    } catch (err) {
      console.error('Face verification failed:', err);
      setVerificationError(
        err.message || 'Face verification did not match. Please ensure bright lighting and position your face directly in the frame.'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, snapshotPreview, captureFrame, mode, roleHint, emailHint, stopCamera, onSuccess, onCapture]);

  // Face alignment detection check loop (clean & unobtrusive)
  useEffect(() => {
    if (!cameraActive || snapshotPreview || isProcessing) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0 || isAnalyzingRef.current) {
        return;
      }

      isAnalyzingRef.current = true;

      try {
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = 240;
        sampleCanvas.height = 180;
        const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          isAnalyzingRef.current = false;
          return;
        }

        ctx.drawImage(video, 0, 0, 240, 180);
        const sampleB64 = sampleCanvas.toDataURL('image/jpeg', 0.65);

        const res = await api.detectFace(sampleB64);
        if (!isMounted) return;

        if (res.detected && res.quality >= 55) {
          setIsFaceDetected(true);
          const now = Date.now();
          if (!lockStartTimeRef.current) {
            lockStartTimeRef.current = now;
          }

          // Auto-verify after 1.8s of stable face alignment
          if (now - lockStartTimeRef.current >= 1800) {
            lockStartTimeRef.current = null;
            handlePerformScan();
          }
        } else {
          setIsFaceDetected(false);
          lockStartTimeRef.current = null;
        }
      } catch (err) {
        // Fallback local brightness/presence check
        const v = videoRef.current;
        if (v && v.videoWidth > 0) {
          const c = document.createElement('canvas');
          c.width = 48;
          c.height = 48;
          const ctx = c.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(v, 0, 0, 48, 48);
            const data = ctx.getImageData(0, 0, 48, 48).data;
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
              sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            }
            const mean = sum / (data.length / 4);
            setIsFaceDetected(mean > 35 && mean < 230);
          }
        }
      } finally {
        isAnalyzingRef.current = false;
      }
    }, 400);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [cameraActive, snapshotPreview, isProcessing, handlePerformScan]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleRetake = () => {
    setSnapshotPreview(null);
    setVerificationSuccess(false);
    setVerificationError(null);
    lockStartTimeRef.current = null;
    if (!cameraActive) {
      startCamera();
    }
  };

  const handleGoBack = () => {
    stopCamera();
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // The formal, professional Face Verifier content
  const content = (
    <div className="w-full flex flex-col items-center text-center space-y-4 animate-in fade-in duration-200">
      {/* Top Bar: Back Button */}
      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          onClick={handleGoBack}
          aria-label="Go back"
          className="p-1.5 -ml-1.5 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={22} />
        </button>

        {/* Subtle camera switcher icon on top right */}
        <button
          type="button"
          onClick={toggleCameraFacing}
          disabled={!cameraActive || !!snapshotPreview}
          title="Switch Camera"
          className="p-1.5 -mr-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {/* Header Titles */}
      <div className="w-full text-left space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {subtitle}
        </p>
      </div>

      {/* Center Biometric Portrait with Radial Ticks */}
      <div className="relative w-full max-w-[280px] aspect-square mx-auto my-2 flex items-center justify-center">
        {/* Radial Tick Ring SVG (Exact match with reference image) */}
        <svg
          viewBox="0 0 300 300"
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        >
          {RADIAL_TICKS.map((tick) => {
            let strokeColor = '#cbd5e1';
            let strokeWidth = 2.5;
            let strokeOpacity = 0.55;

            if (verificationSuccess) {
              strokeColor = '#10b981';
              strokeWidth = 3;
              strokeOpacity = 0.95;
            } else if (isFaceDetected) {
              strokeColor = '#059669';
              strokeWidth = 3;
              strokeOpacity = 0.9;
            } else {
              // Red attention arc on top-right (ticks 2 to 17) matching reference image
              if (tick.id >= 2 && tick.id <= 17) {
                strokeColor = '#ef4444';
                strokeWidth = 3;
                strokeOpacity = 0.95;
              } else {
                strokeColor = '#cbd5e1';
                strokeWidth = 2.5;
                strokeOpacity = 0.6;
              }
            }

            return (
              <line
                key={tick.id}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={strokeOpacity}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Circular Camera Viewfinder Frame */}
        <div className="relative w-[214px] h-[214px] rounded-full overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center">
          {/* Live Webcam Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            } ${cameraActive && !snapshotPreview ? 'opacity-100' : 'opacity-0 absolute'}`}
          />

          {/* Snapshot Preview Image */}
          {snapshotPreview && (
            <img
              src={snapshotPreview}
              alt="Face Snapshot"
              className="w-full h-full object-cover animate-in fade-in"
            />
          )}

          {/* Camera Loading Spinner */}
          {!cameraActive && !cameraError && !snapshotPreview && (
            <div className="flex flex-col items-center gap-2 text-slate-300">
              <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-medium text-slate-400">Starting camera...</span>
            </div>
          )}

          {/* Camera Error Display inside Circle */}
          {cameraError && !snapshotPreview && (
            <div className="p-4 text-center space-y-2 max-w-[190px]">
              <AlertCircle size={24} className="mx-auto text-amber-400" />
              <p className="text-[10px] text-slate-300 leading-tight">{cameraError}</p>
            </div>
          )}

          {/* Verification Success Overlay */}
          {verificationSuccess && (
            <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center p-4 text-white animate-in zoom-in-95 duration-200">
              <CheckCircle2 size={44} className="mb-1" />
              <span className="text-xs font-bold uppercase tracking-wider">Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Status / Guidance Card matching Image 2 */}
      {verificationSuccess ? (
        <div className="w-full bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3 text-left animate-in fade-in">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 size={16} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold text-slate-900">
              Face identity verified
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Biometric check passed. Securely redirecting to your workspace...
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full bg-[#fff1f2] border border-[#fecdd3] rounded-2xl p-3.5 flex items-start gap-3 text-left animate-in fade-in">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-bold text-red-600">
              Verification needs another attempt
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {verificationError || "Could not detect a clear face. Please position your face directly in front of the camera with good lighting."}
            </p>
          </div>
        </div>
      )}

      {/* Match Confidence Bar (Exact Image 2 representation) */}
      <div className="w-full flex items-center justify-between gap-3 px-1 pt-1">
        <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs shrink-0">
          <span>Match confidence</span>
          <Info size={14} className="text-slate-400" />
        </div>
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              verificationSuccess
                ? 'bg-emerald-500 w-[95%]'
                : isFaceDetected
                ? 'bg-blue-600 w-[75%]'
                : 'bg-gradient-to-r from-red-500 to-rose-400 w-[38%]'
            }`}
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 shrink-0">
          {verificationSuccess ? 'High' : isFaceDetected ? 'Med' : 'Low'}
        </span>
      </div>

      {/* Primary Action Buttons ("Retake" and "Try Again") */}
      <div className="w-full space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleRetake}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-[#f1f5f9] hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} />
            <span>Retake</span>
          </button>

          <button
            type="button"
            onClick={handlePerformScan}
            disabled={isProcessing || (!cameraActive && !snapshotPreview)}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {isProcessing ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Try Again</span>
            )}
          </button>
        </div>

        {/* OR Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
            OR
          </span>
        </div>

        {/* Use Password Login Fallback Button */}
        <button
          type="button"
          onClick={handleGoBack}
          className="w-full py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Lock size={15} className="text-slate-600" />
          <span>Use Password Login</span>
        </button>
      </div>
    </div>
  );

  // If inline mode, render seamlessly inside the container
  if (inline) {
    return <div className="w-full">{content}</div>;
  }

  // If modal mode, render in a clean institutional card dialog
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-slate-900 overflow-hidden">
        {content}
      </div>
    </div>
  );
}
