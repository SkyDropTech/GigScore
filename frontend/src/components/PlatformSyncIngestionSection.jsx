import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  ArrowLeftRight,
  ShieldCheck,
  Link as LinkIcon,
  CloudUpload,
  FileCheck,
  Check,
  Loader2,
  Gauge,
  Zap,
} from 'lucide-react';
import UnderwritingSanctionSpeedometerSection from './UnderwritingSanctionSpeedometerSection';

export default function PlatformSyncIngestionSection({
  olaConnected = false,
  uberConnected = false,
  onConnectOla,
  onConnectUber,
  onUploadFile,
  uploadedFile = null,
  isUploading = false,
  uploadProgress = 85,
  mlAssessment = null,
  driverProfile = {},
  driverSummary = {},
  isDataIngested = false,
  onApplyLoan,
  onInspectStatement,
}) {
  const fileInputRef = useRef(null);
  const [connectingOla, setConnectingOla] = useState(false);
  const [connectingUber, setConnectingUber] = useState(false);
  // 'auto' uses uploadedFile / isDataIngested; can be toggled to 'upload' or 'sanction'
  const [viewMode, setViewMode] = useState('auto');

  const hasUploaded = Boolean(uploadedFile) || isDataIngested;
  const showSanctionVerdict = viewMode === 'sanction' || (viewMode === 'auto' && hasUploaded);

  const handleOlaClick = async () => {
    if (olaConnected) return;
    setConnectingOla(true);
    if (onConnectOla) await onConnectOla();
    setTimeout(() => setConnectingOla(false), 900);
  };

  const handleUberClick = async () => {
    if (uberConnected) return;
    setConnectingUber(true);
    if (onConnectUber) await onConnectUber();
    setTimeout(() => setConnectingUber(false), 900);
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    if (onUploadFile) {
      onUploadFile(e);
      // Auto-switch to sanction verdict on upload
      setViewMode('auto');
    }
  };

  // If file is uploaded or ingested, change the UI into the Image 3 design
  if (showSanctionVerdict && !isUploading) {
    return (
      <div className="w-full">
        {/* Hidden File Input for re-upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,.csv,.xlsx,.xls"
          className="hidden"
        />
        <UnderwritingSanctionSpeedometerSection
          score={872}
          riskTier="LOW RISK • PRIME"
          probabilityOfDefault="4.6%"
          preApprovedLimit={263700}
          safeEmi="4,125.6"
          affordabilityDti="9.4%"
          onApplyLoan={onApplyLoan}
          onInspectStatement={onInspectStatement}
          onReupload={() => setViewMode('upload')}
          uploadedFile={uploadedFile}
          mlAssessment={mlAssessment}
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xs animate-fade-in">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".pdf,.csv,.xlsx,.xls"
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ====================================================== */}
        {/* LEFT COLUMN: OLA & UBER API PARTNER SYNC CARDS         */}
        {/* ====================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Card 1: Ola Partner Sync */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
            <div>
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* OLA Logo Badge */}
                  <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-slate-800 text-sm tracking-wide shrink-0 shadow-2xs">
                    OLA
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-bold text-slate-900 leading-tight">
                        Ola Partner Sync
                      </h4>
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                        <Check size={10} className="stroke-[3]" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      API Telemetry Link • Automated Pipeline
                    </p>
                  </div>
                </div>

                {/* Status Pill */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 ${
                    olaConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                      : 'bg-blue-50/70 text-blue-700 border border-blue-100'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      olaConnected ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                  ></span>
                  <span>{olaConnected ? 'Connected' : 'Ready to connect'}</span>
                </span>
              </div>

              {/* Two Feature Sub-cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ArrowLeftRight size={13} className="text-slate-700 stroke-[2.5]" />
                    <span>Trip Ledger</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Automatic daily sync
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldCheck size={14} className="text-slate-700 stroke-[2.5]" />
                    <span>FastTrack KYC</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Immediate verification
                  </div>
                </div>
              </div>
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Last synced: <span className="text-slate-700 font-semibold">{olaConnected ? 'Real-time API link' : 'Real-time API link'}</span>
              </span>
              <button
                type="button"
                onClick={handleOlaClick}
                disabled={connectingOla}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  olaConnected
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#0062E3] hover:bg-blue-700 text-white'
                }`}
              >
                {connectingOla ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <LinkIcon size={13} className="stroke-[2.5]" />
                )}
                <span>{olaConnected ? 'Connected' : 'Connect Ola'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Uber Driver Partner Sync */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
            <div>
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* UBER Logo Badge */}
                  <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-slate-800 text-xs tracking-wider shrink-0 shadow-2xs">
                    UBER
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-bold text-slate-900 leading-tight">
                        Uber Driver Partner Sync
                      </h4>
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                        <Check size={10} className="stroke-[3]" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      API Telemetry Link • Automated Pipeline
                    </p>
                  </div>
                </div>

                {/* Status Pill */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 ${
                    uberConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                      : 'bg-blue-50/70 text-blue-700 border border-blue-100'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      uberConnected ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                  ></span>
                  <span>{uberConnected ? 'Connected' : 'Ready to connect'}</span>
                </span>
              </div>

              {/* Two Feature Sub-cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3">
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ArrowLeftRight size={13} className="text-slate-700 stroke-[2.5]" />
                    <span>Trip Ledger</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Automatic daily sync
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldCheck size={14} className="text-slate-700 stroke-[2.5]" />
                    <span>FastTrack KYC</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Immediate verification
                  </div>
                </div>
              </div>
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Last synced: <span className="text-slate-700 font-semibold">{uberConnected ? 'Real-time API link' : 'Real-time API link'}</span>
              </span>
              <button
                type="button"
                onClick={handleUberClick}
                disabled={connectingUber}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  uberConnected
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#0062E3] hover:bg-blue-700 text-white'
                }`}
              >
                {connectingUber ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <LinkIcon size={13} className="stroke-[2.5]" />
                )}
                <span>{uberConnected ? 'Connected' : 'Connect Uber'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: CLICK TO UPLOAD STATEMENT PDF (DASHED)   */}
        {/* ====================================================== */}
        <div className="lg:col-span-5 flex">
          <div
            onClick={handleDropzoneClick}
            className="w-full h-full min-h-[260px] border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl bg-slate-50/40 hover:bg-blue-50/20 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group shadow-2xs"
          >
            {/* Cloud Icon */}
            <div className="w-13 h-13 rounded-2xl bg-blue-50 text-[#0062E3] group-hover:scale-105 transition-transform flex items-center justify-center mb-3.5 shadow-2xs border border-blue-100">
              {isUploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : uploadedFile ? (
                <FileCheck size={24} className="stroke-[2.2] text-emerald-600" />
              ) : (
                <CloudUpload size={24} className="stroke-[2.2]" />
              )}
            </div>

            {/* Title */}
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {isUploading
                ? 'Processing Statement Telemetry...'
                : uploadedFile
                ? `Statement Attached: ${uploadedFile.name}`
                : 'Click to Upload Statement PDF'}
            </h4>

            {/* Subtitle */}
            <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
              {uploadedFile
                ? `Verified ${uploadedFile.parsedMonths || 6} monthly cycles. Click to replace statement.`
                : 'Supports Ola / Uber monthly payout statements or CSV ledger'}
            </p>

            {/* Progress Bar */}
            <div className="w-48 sm:w-56 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  uploadedFile ? 'bg-emerald-500' : 'bg-[#0062E3]'
                }`}
                style={{ width: `${uploadedFile ? 100 : uploadProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
