import React from 'react';
import {
  Gauge,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export default function UnderwritingSanctionSpeedometerSection({
  score = 872,
  riskTier = 'LOW RISK • PRIME',
  probabilityOfDefault = '4.6%',
  preApprovedLimit = 263700,
  safeEmi = '4,125.6',
  affordabilityDti = '9.4%',
  onApplyLoan,
  onInspectStatement,
  onReupload,
  uploadedFile = null,
  mlAssessment = null,
}) {
  // Real values if passed from ML model or fallback to exact screenshot reference
  const displayScore = mlAssessment?.score || score || 872;
  const rawLimit = mlAssessment?.recommended_amount || preApprovedLimit || 263700;
  const formattedLimit = Number(rawLimit).toLocaleString('en-IN');
  const displayEmi = mlAssessment?.recommended_emi
    ? Number(mlAssessment.recommended_emi).toLocaleString('en-IN')
    : safeEmi;
  const displayDti = mlAssessment?.affordability_ratio
    ? `${(mlAssessment.affordability_ratio * 100).toFixed(1)}%`
    : affordabilityDti;
  const displayProb = mlAssessment?.probability_of_default !== undefined
    ? `${(Number(mlAssessment.probability_of_default) * 100).toFixed(1)}%`
    : probabilityOfDefault;

  // Speedometer Semicircular Arc Math
  // Range: 300 to 900 (span = 600)
  const minScore = 300;
  const maxScore = 900;
  const clampedScore = Math.max(minScore, Math.min(maxScore, displayScore));
  const fillRatio = (clampedScore - minScore) / (maxScore - minScore); // ~0.953 for 872

  const radius = 88;
  const arcLength = Math.PI * radius; // ~276.46
  const strokeDashoffset = arcLength * (1 - fillRatio);

  const handleApplyClick = () => {
    if (onApplyLoan) {
      onApplyLoan(rawLimit);
    }
  };

  const handleInspectClick = () => {
    if (onInspectStatement) {
      onInspectStatement();
    } else {
      const el = document.getElementById('itemized-statement-section') || document.getElementById('monthly-breakdown-table');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ======================================================== */}
        {/* LEFT CARD: GIGSCORE SPEEDOMETER                          */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header: Title + XGBoost Tag */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge size={19} className="text-[#0062E3]" />
                <span className="text-xs font-black tracking-wider text-slate-700 uppercase">
                  GIGSCORE SPEEDOMETER
                </span>
              </div>
              <span className="bg-slate-100 text-slate-600 text-[11px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase">
                XGBOOST V3.2
              </span>
            </div>

            {/* Gauge Graphic Container */}
            <div className="flex flex-col items-center justify-center pt-5 pb-2">
              <div className="relative w-[240px] h-[130px] flex items-center justify-center">
                <svg
                  width="240"
                  height="130"
                  viewBox="0 0 240 130"
                  className="overflow-visible"
                >
                  <defs>
                    <linearGradient id="speedometerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="25%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="75%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>

                  {/* Semicircle background track */}
                  <path
                    d="M 32 120 A 88 88 0 0 1 208 120"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />

                  {/* Semicircle active gradient arc */}
                  <path
                    d="M 32 120 A 88 88 0 0 1 208 120"
                    fill="none"
                    stroke="url(#speedometerGrad)"
                    strokeWidth="18"
                    strokeDasharray={arcLength}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                </svg>

                {/* Centered Score Display */}
                <div className="absolute top-10 left-0 right-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="font-headline text-[52px] sm:text-[56px] font-black text-slate-900 tracking-tight leading-none tabular-nums">
                    {displayScore}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider mt-1.5 uppercase">
                    SCALE 300 — 900
                  </span>
                </div>
              </div>

              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-black tracking-wide shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{riskTier}</span>
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 text-xs font-bold shadow-2xs">
                  P(Default): {displayProb}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Scale Markers */}
          <div className="flex items-center justify-between w-full pt-4 mt-2 border-t border-slate-100 text-xs font-bold">
            <span className="text-rose-600 font-bold">300 Subprime</span>
            <span className="text-amber-600 font-bold">600 Near-Prime</span>
            <span className="text-emerald-600 font-bold">750+ Prime</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT CARD: UNDERWRITING SANCTION VERDICT                 */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header: Title Pill + Eligible Badge */}
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 text-xs font-black tracking-wide uppercase">
                <ShieldCheck size={16} className="text-blue-600 stroke-[2.5]" />
                <span>UNDERWRITING SANCTION VERDICT</span>
              </div>
              <span className="px-3.5 py-1 rounded-full bg-[#059669] text-white text-xs font-black tracking-wider uppercase shadow-2xs">
                ELIGIBLE
              </span>
            </div>

            {/* Main Headline & Context Subtitle */}
            <div className="mt-3.5">
              <h3 className="font-headline text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-tight">
                Pre-Approved Capital Limit: ₹{formattedLimit}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Your multi-platform cashflow regularity and driving stability satisfy all automated lending benchmarks.
              </p>
            </div>

            {/* 3 Metrics Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {/* Box 1: Sanction Limit */}
              <div className="bg-[#f8fafc] border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
                  SANCTION LIMIT
                </span>
                <div className="font-headline text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
                  ₹{formattedLimit}
                </div>
                <span className="text-[11px] font-bold text-emerald-600 mt-1">
                  Pre-Approved Capital
                </span>
              </div>

              {/* Box 2: Safe Monthly EMI */}
              <div className="bg-[#f8fafc] border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
                  SAFE MONTHLY EMI
                </span>
                <div className="font-headline text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
                  ₹{displayEmi}/mo
                </div>
                <span className="text-[11px] font-semibold text-slate-400 mt-1">
                  12M Amortization
                </span>
              </div>

              {/* Box 3: Affordability DTI */}
              <div className="bg-[#f8fafc] border border-slate-200/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
                  AFFORDABILITY (DTI)
                </span>
                <div className="font-headline text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
                  {displayDti}
                </div>
                <span className="text-[11px] font-bold text-emerald-600 mt-1">
                  Safe Cushion (&lt;35%)
                </span>
              </div>
            </div>

            {/* Regulatory Compliance Banner */}
            <div className="bg-blue-50/60 border border-blue-100/90 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-black text-[11px]">
                  ✓
                </span>
                <span>
                  Complies with <strong className="font-bold text-slate-900">RBI Digital Lending Directives</strong>. Zero collateral demanded.
                </span>
              </div>
              <span className="font-black text-slate-800 shrink-0 self-end sm:self-auto">
                TreeSHAP Auditable
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-5">
            {/* Primary Blue Action Button */}
            <button
              type="button"
              onClick={handleApplyClick}
              className="flex-1 h-12 px-6 rounded-xl bg-[#0062E3] hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap size={18} className="fill-white" />
              <span>Apply for ₹{formattedLimit} Loan Demand</span>
              <ArrowRight size={18} />
            </button>

            {/* Secondary Action Button */}
            <button
              type="button"
              onClick={handleInspectClick}
              className="h-12 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-800 font-bold text-sm border border-slate-200/80 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <ExternalLink size={16} className="text-slate-700" />
              <span>Inspect Verified Statement</span>
            </button>

            {/* Switch / Reupload Button if callback provided */}
            {onReupload && (
              <button
                type="button"
                onClick={onReupload}
                title="Sync another account or upload a new statement file"
                className="h-12 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all flex items-center justify-center cursor-pointer shrink-0"
              >
                <RefreshCw size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
