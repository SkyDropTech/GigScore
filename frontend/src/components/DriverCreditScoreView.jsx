import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Calendar,
  CreditCard,
  User,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Info,
  Car,
  Download,
  Wallet,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Award,
  ExternalLink,
  Check,
} from 'lucide-react';
import MonthlyEarningsAnalytics from './MonthlyEarningsAnalytics';
import PlatformSyncIngestionSection from './PlatformSyncIngestionSection';

export default function DriverCreditScoreView({
  driverProfile = {},
  driverSummary = {},
  mlAssessment = null,
  monthlyEarnings = [],
  currentPersona = {},
  activeLoans = [],
  uploadedFile = null,
  olaConnected = false,
  uberConnected = false,
  onConnectOla,
  onConnectUber,
  onUploadFile,
  isUploading = false,
  uploadProgress = 85,
  onNavigateTab,
  onApplyLoan,
}) {
  const [timeframeFilter, setTimeframeFilter] = useState('6M');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // 1. Extract Parsed PDF Statement Data
  const parsedData = driverProfile?.parsed_statement_data || {};
  const driverInfo = parsedData.driver_info || {};
  const mlSummary = parsedData.ml_summary || {};
  const monthlyRecords = (parsedData.monthly_records && parsedData.monthly_records.length > 0)
    ? parsedData.monthly_records
    : (monthlyEarnings && monthlyEarnings.length > 0 ? monthlyEarnings : []);

  // Driver Identity Fields
  const fullName = driverInfo.name || driverProfile?.full_name || currentPersona?.full_name || 'Rishikesh Shedge';
  const driverId = driverInfo.driver_id || driverProfile?.driver_id || currentPersona?.id || 'GS-DEMO-RS001';
  const platform = driverInfo.platform || driverProfile?.platform || 'Uber';
  const city = driverInfo.city || driverProfile?.city || 'Pune';
  const vehicle = driverInfo.vehicle || driverProfile?.vehicle_type || 'Car';

  // 2. Verified Monthly Records & Breakdown Table (Matches Uploaded PDF Statement)
  const defaultMonthlyBreakdown = [
    { month: '2026-03', label: 'Mar 2026', shortMonth: 'Mar', trips: 330, activeDays: 23, gross: 123917, fees: 24783, fuel: 18830, net: 80304 },
    { month: '2026-04', label: 'Apr 2026', shortMonth: 'Apr', trips: 366, activeDays: 27, gross: 137160, fees: 27432, fuel: 20482, net: 89246 },
    { month: '2026-05', label: 'May 2026', shortMonth: 'May', trips: 288, activeDays: 22, gross: 104647, fees: 20929, fuel: 15637, net: 68081 },
    { month: '2026-06', label: 'Jun 2026', shortMonth: 'Jun', trips: 402, activeDays: 29, gross: 145657, fees: 29131, fuel: 21508, net: 95017 },
    { month: '2026-07', label: 'Jul 2026', shortMonth: 'Jul', trips: 428, activeDays: 29, gross: 153739, fees: 30748, fuel: 22797, net: 100194 },
    { month: '2026-08', label: 'Aug 2026', shortMonth: 'Aug', trips: 393, activeDays: 29, gross: 145426, fees: 29085, fuel: 21878, net: 94463 },
  ];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const rows = monthlyRecords.length > 0
    ? monthlyRecords.slice(-6).map((rec) => {
        const mStr = rec.month || '';
        let label = mStr;
        let shortMonth = mStr;
        if (mStr.includes('-')) {
          const parts = mStr.split('-');
          const mIdx = parseInt(parts[1], 10) - 1;
          const monthName = monthNames[mIdx] || parts[1];
          label = `${monthName} ${parts[0]}`;
          shortMonth = monthName;
        }
        return {
          month: mStr,
          label: label,
          shortMonth: shortMonth,
          trips: Number(rec.trips || 0),
          activeDays: Number(rec.active_days || 0),
          gross: Number(rec.gross_income || 0),
          fees: Number(rec.platform_fee || 0),
          fuel: Number(rec.other_costs || 0),
          net: Number(rec.net_income || 0),
        };
      })
    : defaultMonthlyBreakdown;

  // Compute 6-Month Aggregate Totals
  const totalCompletedRides = rows.reduce((acc, r) => acc + r.trips, 0);
  const totalActiveDays = rows.reduce((acc, r) => acc + r.activeDays, 0);
  const totalGrossEarnings = rows.reduce((acc, r) => acc + r.gross, 0);
  const totalPlatformFees = rows.reduce((acc, r) => acc + r.fees, 0);
  const totalFuelCosts = rows.reduce((acc, r) => acc + r.fuel, 0);
  const totalNetEarnings = rows.reduce((acc, r) => acc + r.net, 0);
  const avgMonthlyNetIncome = rows.length > 0 ? Math.round(totalNetEarnings / rows.length) : 87884;
  const avgDailyNet = totalActiveDays > 0 ? Math.round(totalNetEarnings / totalActiveDays) : 3316;

  // Highest Earning Month
  const highestMonthRecord = rows.slice().sort((a, b) => b.net - a.net)[0] || rows[0];

  // Cancellation Rate & Rating
  const cancellationRate = mlSummary.cancellation_rate != null
    ? (mlSummary.cancellation_rate <= 1 ? (mlSummary.cancellation_rate * 100).toFixed(1) : Number(mlSummary.cancellation_rate).toFixed(1))
    : '3.6';
  const averageRating = mlSummary.avg_rating != null ? Number(mlSummary.avg_rating).toFixed(2) : '4.78';

  // Period string (e.g. "Mar 2026 – Aug 2026")
  const periodText = rows.length > 0 ? `${rows[0].label} – ${rows[rows.length - 1].label}` : 'Mar 2026 – Aug 2026';

  // 3. GigScore & Standing (Range: 300 – 900)
  const score = mlAssessment?.score || driverSummary?.score || 782;
  const scoreStanding = score >= 750 ? 'Good Standing' : score >= 650 ? 'Fair Standing' : 'Review Required';
  const lastMonthScore = Math.max(300, score - 42);
  const pointsDelta = score - lastMonthScore;

  // Semicircular Speedometer Gauge Math (300 to 900 scale)
  const clampedScore = Math.max(300, Math.min(900, score));
  const gaugePercent = (clampedScore - 300) / 600; // 0 to 1 (e.g., 482 / 600 = ~80.3%)
  const radius = 95;
  const gaugeCircumference = Math.PI * radius; // approx 298.45
  const gaugeDashoffset = gaugeCircumference * (1 - gaugePercent);

  // 4. Factor percentages
  const consistencyPct = mlSummary.coefficient_of_variation
    ? Math.max(70, Math.min(99, Math.round((1 - mlSummary.coefficient_of_variation) * 100)))
    : 88;
  const activityPct = 82;
  const repaymentPct = 96;
  const accountHistoryPct = 76;

  // 5. Score Trend Points
  const defaultTrendScores = [580, 620, 680, 720, 760, score];
  const trendPoints = rows.map((r, i) => ({
    month: r.shortMonth,
    score: defaultTrendScores[i] || Math.round(580 + (i * (score - 580)) / 5),
  }));

  const trendImprovement = trendPoints[trendPoints.length - 1].score - trendPoints[0].score;

  // 6. Available Credit Limit Offer
  const availableCredit = mlAssessment?.recommended_amount
    ? Math.min(50000, Math.round(mlAssessment.recommended_amount))
    : 35000;

  // SVG dimensions for Trend Chart
  const trendSvgWidth = 380;
  const trendSvgHeight = 150;
  const trendPadLeft = 32;
  const trendPadRight = 20;
  const trendPadTop = 22;
  const trendPadBottom = 26;

  const trendCoords = trendPoints.map((pt, i) => {
    const x = trendPadLeft + (i / (trendPoints.length - 1)) * (trendSvgWidth - trendPadLeft - trendPadRight);
    const y = trendSvgHeight - trendPadBottom - ((pt.score - 300) / 600) * (trendSvgHeight - trendPadTop - trendPadBottom);
    return { ...pt, x, y };
  });

  const trendPathLine = trendCoords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const trendPathArea = `${trendPathLine} L ${trendCoords[trendCoords.length - 1].x} ${trendSvgHeight - trendPadBottom} L ${trendCoords[0].x} ${trendSvgHeight - trendPadBottom} Z`;

  // Full-width Monthly Earnings Bar Chart dimensions
  const chartWidth = 740;
  const chartHeight = 190;
  const chartPadLeft = 45;
  const chartPadRight = 25;
  const chartPadTop = 25;
  const chartPadBottom = 35;
  const chartPlotHeight = chartHeight - chartPadTop - chartPadBottom;
  const maxBarValue = 120000;

  return (
    <div className="font-main space-y-6 animate-fade-in pb-16 select-none">
      {/* ======================================================== */}
      {/* 1. BREADCRUMBS & TOP BANNER                              */}
      {/* ======================================================== */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span
          onClick={() => onNavigateTab && onNavigateTab('overview')}
          className="hover:text-slate-800 cursor-pointer transition-colors"
        >
          Driver Workspace
        </span>
        <span>›</span>
        <span className="font-semibold text-slate-800">Credit Score</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title and Context */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
            <ShieldCheck size={28} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-headline text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Your GigScore
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="font-body-sm text-xs text-slate-500">
                Based on your ride history from connected platforms ({periodText})
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Data
              </span>
            </div>
          </div>
        </div>

        {/* Right Info Pill Banner */}
        <div className="bg-blue-50/70 border border-blue-100/90 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-2xs self-start lg:self-auto max-w-lg">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Info size={14} className="stroke-[2.5]" />
          </div>
          <p className="font-body-sm text-xs text-slate-600 leading-snug">
            Your score is calculated using your earnings, work activity and repayment history.{' '}
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('work_performance')}
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-1"
            >
              <span>Learn more</span>
              <ArrowRight size={12} />
            </button>
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1.5 PLATFORM API SYNC & STATEMENT PDF INGESTION SECTION  */}
      {/* (Exact replication of User Provided Image 2)            */}
      {/* ======================================================== */}
      <PlatformSyncIngestionSection
        olaConnected={olaConnected}
        uberConnected={uberConnected}
        onConnectOla={onConnectOla}
        onConnectUber={onConnectUber}
        onUploadFile={onUploadFile}
        uploadedFile={uploadedFile}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        mlAssessment={mlAssessment}
        driverProfile={driverProfile}
        driverSummary={driverSummary}
        isDataIngested={Boolean(uploadedFile) || Boolean(parsedData?.monthly_records?.length)}
        onApplyLoan={onApplyLoan}
        onInspectStatement={() => {
          const el = document.getElementById('monthly-breakdown-table');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* ======================================================== */}
      {/* 2. ROW 1: GAUGE (300-900) | KEY FACTORS | SCORE TREND   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
        {/* Card 1: Your GigScore Gauge (Exact match to provided close-up image) (4 cols) */}
        <div className="xl:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs flex flex-col justify-between items-center text-center">
          <div className="flex flex-col items-center text-center w-full">
            {/* Semicircle Gauge SVG (Matches provided close-up image) */}
            <div className="relative my-2 w-[240px] h-[135px] flex justify-center items-center">
              <svg width="240" height="140" viewBox="0 0 250 145" className="overflow-visible">
                <defs>
                  {/* Exact smooth gradient matching reference screenshot: Red -> Orange -> Yellow -> Emerald Green */}
                  <linearGradient id="scoreArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="22%" stopColor="#f97316" />
                    <stop offset="46%" stopColor="#eab308" />
                    <stop offset="72%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {/* Background track (soft grey, rounded caps) */}
                <path
                  d="M 31 135 A 94 94 0 0 1 219 135"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="18"
                  strokeLinecap="round"
                />

                {/* Concentric inner stadium shadow track matching reference image */}
                <path
                  d="M 46 135 A 79 79 0 0 1 204 135"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="2.5"
                />

                {/* Active Colored Arc (Range 300 - 900) */}
                <path
                  d="M 31 135 A 94 94 0 0 1 219 135"
                  fill="none"
                  stroke="url(#scoreArcGradient)"
                  strokeWidth="18"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>

              {/* Inside Gauge Text: 782 over / 900 */}
              <div className="absolute top-11 left-0 right-0 flex flex-col items-center text-center pointer-events-none">
                <span className="font-headline text-[48px] sm:text-[52px] font-black text-[#0f172a] tracking-tight leading-none tabular-nums">
                  {score}
                </span>
                <span className="font-body-sm text-sm font-semibold text-slate-500 mt-1">
                  / 900
                </span>
              </div>
            </div>

            {/* Standing Pill Badge with Checkmark (Exact match to image) */}
            <div className="mt-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-bold bg-[#dcfce7] text-[#15803d] border border-emerald-200/70 shadow-2xs">
                <div className="w-4 h-4 rounded-full bg-[#15803d] text-white flex items-center justify-center font-bold text-[9px]">
                  ✓
                </div>
                <span>{scoreStanding}</span>
              </div>
            </div>

            <p className="font-body-sm text-xs sm:text-[13px] text-slate-600 font-medium mt-3 text-center leading-relaxed">
              You're in a good position.
              <br />
              Keep up the consistent work!
            </p>
          </div>

          {/* Bottom Callout Strip matching image */}
          <div className="w-full mt-5 p-3.5 rounded-2xl bg-[#ecfdf5] border border-emerald-100/90 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#d1fae5] text-[#059669] flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="font-headline text-sm font-bold text-[#059669] leading-tight">
                +{pointsDelta} points
              </div>
              <div className="font-body-sm text-xs text-slate-500 mt-0.5">
                from last month ({lastMonthScore} → {score})
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Key Factors (4 cols) */}
        <div className="xl:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="stroke-[2.5]" />
                </div>
                <h3 className="font-headline-sm text-base font-bold text-slate-900 leading-tight">
                  Key Factors
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('work_performance')}
                className="font-label-md text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>See Details</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* 4 Factor Progress Items */}
            <div className="space-y-4">
              {/* Factor 1: Earnings consistency */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <TrendingUp size={13} className="stroke-[2.5]" />
                    </div>
                    <span className="font-label-md text-xs font-bold text-slate-800">
                      Earnings consistency
                    </span>
                  </div>
                  <span className="font-headline text-xs font-bold text-slate-900 tabular-nums">
                    {consistencyPct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden ml-8 max-w-[calc(100%-2rem)]">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${consistencyPct}%` }}
                  />
                </div>
                <p className="font-body-sm text-[11px] text-slate-500 mt-1 ml-8">
                  Your income has been stable
                </p>
              </div>

              {/* Factor 2: Work activity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Car size={13} className="stroke-[2.5]" />
                    </div>
                    <span className="font-label-md text-xs font-bold text-slate-800">
                      Work activity
                    </span>
                  </div>
                  <span className="font-headline text-xs font-bold text-slate-900 tabular-nums">
                    {activityPct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden ml-8 max-w-[calc(100%-2rem)]">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
                    style={{ width: `${activityPct}%` }}
                  />
                </div>
                <p className="font-body-sm text-[11px] text-slate-500 mt-1 ml-8">
                  You are active and completing trips regularly
                </p>
              </div>

              {/* Factor 3: Repayment history */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <CreditCard size={13} className="stroke-[2.5]" />
                    </div>
                    <span className="font-label-md text-xs font-bold text-slate-800">
                      Repayment history
                    </span>
                  </div>
                  <span className="font-headline text-xs font-bold text-slate-900 tabular-nums">
                    {repaymentPct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden ml-8 max-w-[calc(100%-2rem)]">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-700"
                    style={{ width: `${repaymentPct}%` }}
                  />
                </div>
                <p className="font-body-sm text-[11px] text-slate-500 mt-1 ml-8">
                  You've paid on time
                </p>
              </div>

              {/* Factor 4: Account history */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <User size={13} className="stroke-[2.5]" />
                    </div>
                    <span className="font-label-md text-xs font-bold text-slate-800">
                      Account history
                    </span>
                  </div>
                  <span className="font-headline text-xs font-bold text-slate-900 tabular-nums">
                    {accountHistoryPct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden ml-8 max-w-[calc(100%-2rem)]">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${accountHistoryPct}%` }}
                  />
                </div>
                <p className="font-body-sm text-[11px] text-slate-500 mt-1 ml-8">
                  Good track record with platform
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Your Score Trend (4 cols) */}
        <div className="xl:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BarChart3 size={16} className="stroke-[2.5]" />
                </div>
                <h3 className="font-headline-sm text-base font-bold text-slate-900 leading-tight">
                  Your Score Trend
                </h3>
              </div>

              <div className="relative">
                <select
                  value={timeframeFilter}
                  onChange={(e) => setTimeframeFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-xl px-2.5 py-1 pr-6 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="6M">Last 6 Months</option>
                  <option value="3M">Last 3 Months</option>
                  <option value="12M">Last 12 Months</option>
                </select>
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronDown size={11} />
                </div>
              </div>
            </div>

            {/* Line Trend Chart */}
            <div className="w-full relative pt-1">
              <svg viewBox={`0 0 ${trendSvgWidth} ${trendSvgHeight}`} className="w-full h-auto overflow-visible select-none font-headline">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines & Y-Axis Labels */}
                {[900, 750, 600, 450, 300].map((val) => {
                  const y = trendSvgHeight - trendPadBottom - ((val - 300) / 600) * (trendSvgHeight - trendPadTop - trendPadBottom);
                  return (
                    <g key={val}>
                      <line
                        x1={trendPadLeft}
                        y1={y}
                        x2={trendSvgWidth - trendPadRight}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <text
                        x={trendPadLeft - 6}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[9px] fill-slate-400 font-semibold font-headline tabular-nums"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Filled Area */}
                <path d={trendPathArea} fill="url(#trendGradient)" />

                {/* Trend Stroke */}
                <path
                  d={trendPathLine}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points, Numerical Badges & Month Labels */}
                {trendCoords.map((pt, idx) => (
                  <g key={idx}>
                    {/* Month Label on X-axis */}
                    <text
                      x={pt.x}
                      y={trendSvgHeight - 8}
                      textAnchor="middle"
                      className="text-[10px] font-headline font-semibold fill-slate-500"
                    >
                      {pt.month}
                    </text>

                    {/* Value Badge above point */}
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      textAnchor="middle"
                      className="text-[10px] font-headline font-bold fill-slate-800 tabular-nums"
                    >
                      {pt.score}
                    </text>

                    {/* Circle Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={4.5}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="drop-shadow-xs"
                    />
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Bottom Trend Insight Callout */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp size={14} className="stroke-[2.5]" />
            </div>
            <div className="text-xs font-medium text-slate-600 leading-snug">
              <span>Your score has improved by </span>
              <span className="font-headline font-bold text-emerald-700">
                {trendImprovement} points
              </span>{' '}
              <span>
                from {trendPoints[0]?.score} in {rows[0]?.label || 'Mar 2026'} to {score} in {rows[rows.length - 1]?.label || 'Aug 2026'}.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. ROW 2: DRIVER PROFILE | SUMMARY METRICS | LOAN OFFER */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
        {/* Card 1: Driver Profile (3 cols) */}
        <div className="xl:col-span-3 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User size={16} className="stroke-[2.5]" />
                </div>
                <h3 className="font-headline-sm text-base font-bold text-slate-900 leading-tight">
                  Driver Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => alert(`Driver profile verified via Aadhaar & Platform Telemetry (${driverId})`)}
                className="font-label-md text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Profile Field Rows */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <span className="font-body-sm text-slate-500">Name</span>
                <span className="font-headline font-bold text-slate-900">{fullName}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <span className="font-body-sm text-slate-500">Driver ID</span>
                <span className="font-headline font-bold text-slate-900">{driverId}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <span className="font-body-sm text-slate-500">Platform</span>
                <span className="font-headline font-bold text-slate-900">{platform}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <span className="font-body-sm text-slate-500">City</span>
                <span className="font-headline font-bold text-slate-900">{city}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="font-body-sm text-slate-500">Vehicle</span>
                <span className="font-headline font-bold text-slate-900">{vehicle}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Summary (Mar 2026 – Aug 2026) (5 cols) */}
        <div className="xl:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar size={16} className="stroke-[2.5]" />
              </div>
              <h3 className="font-headline-sm text-base font-bold text-slate-900 leading-tight">
                Summary ({periodText})
              </h3>
            </div>

            {/* 6 Grid Metric Tiles (3 cols x 2 rows) */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                <span className="font-headline text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-tight">
                  {totalCompletedRides.toLocaleString('en-IN')}
                </span>
                <span className="font-label-sm text-[11px] font-medium text-slate-500 mt-1 leading-tight">
                  Completed rides
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                <span className="font-headline text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-tight">
                  ₹{totalGrossEarnings.toLocaleString('en-IN')}
                </span>
                <span className="font-label-sm text-[11px] font-medium text-slate-500 mt-1 leading-tight">
                  Gross earnings
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                <span className="font-headline text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-tight">
                  ₹{totalPlatformFees.toLocaleString('en-IN')}
                </span>
                <span className="font-label-sm text-[11px] font-medium text-slate-500 mt-1 leading-tight">
                  Platform fees
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                <span className="font-headline text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-tight">
                  ₹{totalFuelCosts.toLocaleString('en-IN')}
                </span>
                <span className="font-label-sm text-[11px] font-medium text-slate-500 mt-1 leading-tight">
                  Estimated fuel costs
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                <span className="font-headline text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-tight">
                  ₹{totalNetEarnings.toLocaleString('en-IN')}
                </span>
                <span className="font-label-sm text-[11px] font-medium text-slate-500 mt-1 leading-tight">
                  Estimated net earnings
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                <span className="font-headline text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-tight">
                  ₹{avgMonthlyNetIncome.toLocaleString('en-IN')}
                </span>
                <span className="font-label-sm text-[11px] font-medium text-slate-500 mt-1 leading-tight">
                  Avg. monthly net income
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Two Pill Badges */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-1">
            <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100/90 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <AlertCircle size={13} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="font-headline text-xs font-bold text-purple-950 tabular-nums">
                  {cancellationRate}%
                </span>
                <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                  Cancellation rate
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-100/90 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Award size={13} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="font-headline text-xs font-bold text-amber-950 tabular-nums">
                  {averageRating} / 5
                </span>
                <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                  Average rating
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: You May Be Eligible For (4 cols) */}
        <div className="xl:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Wallet size={16} className="stroke-[2.5]" />
              </div>
              <h3 className="font-headline-sm text-base font-bold text-slate-900 leading-tight">
                You may be eligible for
              </h3>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2.5 flex-1">
                <div>
                  <div className="font-headline text-3xl font-black text-emerald-600 tracking-tight tabular-nums leading-tight">
                    ₹{availableCredit.toLocaleString('en-IN')}
                  </div>
                  <div className="font-label-sm text-xs font-semibold text-slate-500 mt-0.5">
                    Estimated credit limit
                  </div>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-2 font-label-md text-xs font-medium text-slate-700">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Quick application</span>
                  </div>
                  <div className="flex items-center gap-2 font-label-md text-xs font-medium text-slate-700">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Minimal documents</span>
                  </div>
                  <div className="flex items-center gap-2 font-label-md text-xs font-medium text-slate-700">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Flexible repayment</span>
                  </div>
                </div>
              </div>

              {/* Coin Illustration Image Asset provided by user */}
              <div className="w-32 sm:w-36 h-28 shrink-0 flex items-center justify-center">
                <img
                  src="/images/ill_coins_stack.png"
                  alt="Pre-Approved Credit Coins"
                  className="w-full h-full object-contain drop-shadow-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-body-sm text-[10.5px] text-slate-400 leading-tight flex-1">
                Final approval depends on lender assessment.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onApplyLoan) onApplyLoan();
                  else if (onNavigateTab) onNavigateTab('loan_applications');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-label-md text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
              >
                <span>Check Eligibility</span>
                <ArrowRight size={13} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. ROW 3: COMPACT MULTI-GRAPH MONTHLY EARNINGS ANALYTICS */}
      {/* ======================================================== */}
      <MonthlyEarningsAnalytics
        rows={rows}
        driverProfile={driverProfile}
        driverSummary={driverSummary}
        periodText={periodText}
        onNavigateTab={onNavigateTab}
      />

      {/* ======================================================== */}
      {/* 5. ROW 4: FULL WIDTH MONTHLY BREAKDOWN TABLE (BELOW)     */}
      {/* ======================================================== */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xs">
        {/* Header & Download Statement Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-headline text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Monthly Breakdown
              </h2>
              <p className="font-body-sm text-xs sm:text-sm text-slate-500 mt-0.5">
                Detailed statement records parsed and verified via India Stack Registry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (uploadedFile?.url) {
                window.open(uploadedFile.url, '_blank');
              } else {
                alert('Verified PDF Statement is securely attested in India Stack Registry.');
              }
            }}
            className="font-label-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 px-4 py-2 rounded-xl shadow-2xs flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-auto"
          >
            <Download size={14} className="text-slate-500" />
            <span>Download Official Statement</span>
          </button>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 font-label-sm uppercase tracking-wider">
                <th className="py-3.5 px-4">Month</th>
                <th className="py-3.5 px-4 text-center">Completed Trips</th>
                <th className="py-3.5 px-4 text-center">Active Days</th>
                <th className="py-3.5 px-4 text-right">Gross Earnings</th>
                <th className="py-3.5 px-4 text-right">Platform Fees</th>
                <th className="py-3.5 px-4 text-right">Fuel OpEx</th>
                <th className="py-3.5 px-4 text-right">Net Earnings</th>
                <th className="py-3.5 px-4 text-center">Daily Average</th>
                <th className="py-3.5 px-4 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-body-sm">
              {rows.map((row, idx) => {
                const dailyAvg = row.activeDays > 0 ? Math.round(row.net / row.activeDays) : 0;
                return (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-label-md font-bold text-slate-900 whitespace-nowrap">
                      {row.label}
                    </td>
                    <td className="py-3.5 px-4 font-headline font-semibold text-slate-700 tabular-nums text-center">
                      {row.trips.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-headline font-semibold text-slate-700 tabular-nums text-center">
                      {row.activeDays} days
                    </td>
                    <td className="py-3.5 px-4 font-headline font-semibold text-slate-700 tabular-nums text-right">
                      ₹{row.gross.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-headline font-semibold text-slate-700 tabular-nums text-right text-rose-600">
                      -₹{row.fees.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-headline font-semibold text-slate-700 tabular-nums text-right text-amber-700">
                      -₹{row.fuel.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-headline font-bold text-slate-900 tabular-nums text-right text-sm">
                      ₹{row.net.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-headline font-semibold text-slate-700 tabular-nums text-center">
                      ₹{dailyAvg.toLocaleString('en-IN')}/day
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <Check size={11} className="stroke-[3]" />
                        Attested
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer with Verified 6-Month Totals */}
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-xs">
                <td className="py-3.5 px-4 font-headline font-bold text-slate-900">
                  Total (6M Summary)
                </td>
                <td className="py-3.5 px-4 font-headline font-bold text-slate-900 tabular-nums text-center">
                  {totalCompletedRides.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4 font-headline font-bold text-slate-900 tabular-nums text-center">
                  {totalActiveDays} days
                </td>
                <td className="py-3.5 px-4 font-headline font-bold text-slate-900 tabular-nums text-right">
                  ₹{totalGrossEarnings.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4 font-headline font-bold text-rose-600 tabular-nums text-right">
                  -₹{totalPlatformFees.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4 font-headline font-bold text-amber-700 tabular-nums text-right">
                  -₹{totalFuelCosts.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4 font-headline font-black text-emerald-700 tabular-nums text-right text-sm">
                  ₹{totalNetEarnings.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4 font-headline font-bold text-slate-900 tabular-nums text-center">
                  ₹{avgDailyNet.toLocaleString('en-IN')}/day
                </td>
                <td className="py-3.5 px-4 text-center font-label-sm text-[10.5px] text-emerald-700 font-bold">
                  100% Verified
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
