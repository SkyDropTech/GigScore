import React, { useState } from 'react';
import {
  ShieldCheck,
  Wallet,
  BarChart3,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function DriverOverviewHome({
  driverProfile = {},
  driverSummary = {},
  mlAssessment = null,
  monthlyEarnings = [],
  currentPersona = {},
  onNavigateTab,
  onApplyLoan,
}) {
  const [timeframe, setTimeframe] = useState('6M');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Extract parsed PDF statement data
  const parsedData = driverProfile?.parsed_statement_data || {};
  const driverInfo = parsedData.driver_info || {};
  const mlSummary = parsedData.ml_summary || {};
  const monthlyRecords = (parsedData.monthly_records && parsedData.monthly_records.length > 0)
    ? parsedData.monthly_records
    : (monthlyEarnings && monthlyEarnings.length > 0 ? monthlyEarnings : []);

  // 1. Driver Name & Greeting
  const fullName = driverInfo.name || driverProfile?.full_name || currentPersona?.full_name || 'Rishikesh Shedge';
  const firstName = fullName.split(' ')[0] || 'Driver';

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  // 2. Score Calculation
  const score = mlAssessment?.score || driverSummary?.score || 782;
  const scoreStanding = score >= 750 ? 'Good Standing' : score >= 650 ? 'Fair Standing' : 'Review Required';

  // 3. Earnings This Month & Trend
  // From PDF statement records or fallback to reference ₹28,450
  let earningsThisMonth = 28450;
  let earningsDiff = 2210;
  let earningsGrowthPct = '8.4%';
  let isUpwardTrend = true;

  if (monthlyRecords.length > 0) {
    const latestRec = monthlyRecords[monthlyRecords.length - 1];
    earningsThisMonth = latestRec.net_income || earningsThisMonth;
    if (monthlyRecords.length > 1) {
      const prevRec = monthlyRecords[monthlyRecords.length - 2];
      const diff = latestRec.net_income - prevRec.net_income;
      earningsDiff = Math.abs(diff);
      isUpwardTrend = diff >= 0;
      earningsGrowthPct = `${((diff / prevRec.net_income) * 100).toFixed(1)}%`;
    }
  } else if (driverSummary?.avg_monthly_net_income) {
    earningsThisMonth = Math.round(driverSummary.avg_monthly_net_income);
  }

  // 4. Work Consistency (Active Days & Trips)
  const activeDays = mlSummary.active_days_monthly
    ? Math.round(Number(mlSummary.active_days_monthly))
    : (monthlyRecords.length > 0 && monthlyRecords[monthlyRecords.length - 1].active_days) || 24;

  const tripsPerDay = mlSummary.trips_per_day
    ? Number(mlSummary.trips_per_day).toFixed(1)
    : '3.2';

  const activePercent = Math.min(100, Math.round((activeDays / 30) * 100));

  // 5. Available Credit
  const availableCredit = mlAssessment?.recommended_amount
    ? Math.min(50000, Math.round(mlAssessment.recommended_amount))
    : 35000;

  // 6. 6-Month Multi-Metric Chart Data
  const [earningsTab, setEarningsTab] = useState('net'); // 'net' | 'gross_net' | 'trips'

  const defaultChartData = [
    { month: 'Apr', value: 12500, gross: 17800, trips: 140, activeDays: 16, label: '₹12,500' },
    { month: 'May', value: 18500, gross: 26400, trips: 195, activeDays: 20, label: '₹18,500' },
    { month: 'Jun', value: 23200, gross: 33100, trips: 245, activeDays: 23, label: '₹23,200' },
    { month: 'Jul', value: 25400, gross: 36200, trips: 270, activeDays: 25, label: '₹25,400' },
    { month: 'Aug', value: 35400, gross: 50500, trips: 380, activeDays: 28, label: '₹35,400' },
    { month: 'Sep', value: 31200, gross: 44500, trips: 330, activeDays: 26, label: '₹31,200' },
  ];

  let chartPoints = defaultChartData;
  if (monthlyRecords.length > 0) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    chartPoints = monthlyRecords.slice(-6).map((rec) => {
      let mLabel = rec.month;
      if (rec.month && rec.month.includes('-')) {
        const parts = rec.month.split('-');
        const mIdx = parseInt(parts[1], 10) - 1;
        mLabel = monthNames[mIdx] || rec.month;
      }
      return {
        month: mLabel,
        value: rec.net_income || 25000,
        gross: rec.gross_income || Math.round((rec.net_income || 25000) * 1.4),
        trips: Number(rec.trips || 220),
        activeDays: Number(rec.active_days || 24),
        label: `₹${(rec.net_income || 25000).toLocaleString('en-IN')}`,
      };
    });
  }

  // Calculate SVG curve coordinates with dynamic auto-scaling
  const svgWidth = 560;
  const svgHeight = 185;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 22;
  const paddingBottom = 32;

  const rawMax = Math.max(...chartPoints.map((p) => p.value), 20000);
  const maxVal = Math.ceil((rawMax * 1.25) / 5000) * 5000;
  const minVal = 0;
  const gridVals = [maxVal, Math.round(maxVal * 0.66), Math.round(maxVal * 0.33), 0];

  const points = chartPoints.map((p, i) => {
    const x = paddingLeft + (i / Math.max(1, chartPoints.length - 1)) * (svgWidth - paddingLeft - paddingRight);
    const y = svgHeight - paddingBottom - ((p.value - minVal) / (maxVal - minVal)) * (svgHeight - paddingTop - paddingBottom);
    return { ...p, x, y };
  });

  // Construct smooth SVG path using Catmull-Rom or cubic Bezier
  const createSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const cx1 = current.x + (next.x - current.x) * 0.45;
      const cy1 = current.y;
      const cx2 = current.x + (next.x - current.x) * 0.55;
      const cy2 = next.y;
      d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const linePath = createSmoothPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
    : '';

  // 7. Work Activity Calendar Heatmap Grid (Week 1 to Week 5)
  // Matching reference image: 24 active days represented as emerald cells
  const activityWeeks = [
    { label: 'Week 1', days: [true, true, true, false, true, true, false] },
    { label: 'Week 2', days: [true, true, true, true, true, true, false] },
    { label: 'Week 3', days: [true, false, true, true, true, true, true] },
    { label: 'Week 4', days: [true, true, true, true, true, false, true] },
    { label: 'Week 5', days: [true, true, false, true, true, false, false] },
  ];

  // 8. What Affects Your GigScore percentages
  const consistencyPct = mlSummary.coefficient_of_variation
    ? Math.max(70, Math.min(99, Math.round((1 - mlSummary.coefficient_of_variation) * 100)))
    : 88;
  const activityPct = Math.min(99, Math.max(65, activePercent));
  const repaymentPct = 96;

  return (
    <div className="font-main space-y-6 animate-fade-in pb-12">
      {/* ======================================================== */}
      {/* 1. GREETING HEADER & TAGLINE BANNER                     */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight flex items-center gap-2">
            <span>{greeting}, {firstName}</span> <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Here's your financial snapshot. Keep driving, keep growing!
          </p>
        </div>

        {/* Right Quote Pill */}
        <div className="self-start md:self-auto px-4 py-2.5 rounded-2xl bg-blue-50/60 border border-blue-100/80 shadow-2xs">
          <p className="font-body-sm text-xs font-medium text-slate-700 italic text-right">
            "Small miles. Bigger opportunities."
          </p>
          <p className="font-headline text-[11px] font-bold text-secondary text-right mt-0.5">
            — GigScore
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP 4 METRIC SUMMARY CARDS                            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Your GigScore */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('credit_score')}
          className="group bg-surface-container-lowest rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShieldCheck size={22} className="stroke-[2.5]" />
            </div>
            <div className="font-label-md text-label-md font-semibold text-on-surface-variant">Your GigScore</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-headline text-3xl font-extrabold text-on-surface tracking-tight tabular-nums">{score}</span>
              <span className="font-body-sm text-sm font-medium text-slate-400">/ 900</span>
            </div>
            <div className="mt-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                {scoreStanding}
              </span>
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="font-body-sm text-[11px] text-on-surface-variant line-clamp-2">
              Based on your earnings, work activity and repayment history.
            </span>
            <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </div>
        </div>

        {/* Card 2: Earnings This Month */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('earnings')}
          className="group bg-surface-container-lowest rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Wallet size={20} className="stroke-[2.5]" />
            </div>
            <div className="font-label-md text-label-md font-semibold text-on-surface-variant">Earnings This Month</div>
            <div className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mt-1 tabular-nums">
              ₹{earningsThisMonth.toLocaleString('en-IN')}
            </div>
            <div className="mt-1.5 flex items-center gap-1 font-label-sm text-label-sm font-bold text-emerald-600">
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>{isUpwardTrend ? '↑' : '↓'} {earningsGrowthPct} from last month</span>
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              Keep up the good work! Your earnings are growing.
            </span>
            <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </div>
        </div>

        {/* Card 3: Work Consistency */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('work_performance')}
          className="group bg-surface-container-lowest rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BarChart3 size={20} className="stroke-[2.5]" />
            </div>
            <div className="font-label-md text-label-md font-semibold text-on-surface-variant">Work Consistency</div>
            <div className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mt-1 tabular-nums">
              {activeDays} days
            </div>
            <div className="mt-1.5 font-label-sm text-label-sm font-semibold text-on-surface-variant">
              {tripsPerDay} trips/day (avg)
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              You worked on {activePercent}% of available days this month.
            </span>
            <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </div>
        </div>

        {/* Card 4: Available Credit */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('loan_applications')}
          className="group bg-surface-container-lowest rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <CreditCard size={20} className="stroke-[2.5]" />
            </div>
            <div className="font-label-md text-label-md font-semibold text-on-surface-variant">Available Credit</div>
            <div className="font-headline text-3xl font-extrabold text-on-surface tracking-tight mt-1 tabular-nums">
              ₹{availableCredit.toLocaleString('en-IN')}
            </div>
            <div className="mt-1.5 font-label-sm text-label-sm font-semibold text-on-surface-variant">
              Estimated eligible amount
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="font-body-sm text-[11px] text-on-surface-variant">
              Use for vehicle repair, fuel or working capital.
            </span>
            <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MIDDLE ROW: YOUR EARNINGS & WORK ACTIVITY            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Your Earnings Chart */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header with icon, title, graph tab switchers, and filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BarChart3 size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-tight">Monthly Earnings</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Track your income and analyze performance</p>
                </div>
              </div>

              {/* Graph Toggle Pills & Timeframe */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setEarningsTab('net')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      earningsTab === 'net'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Net
                  </button>
                  <button
                    type="button"
                    onClick={() => setEarningsTab('gross_net')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      earningsTab === 'gross_net'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Gross/Net
                  </button>
                  <button
                    type="button"
                    onClick={() => setEarningsTab('trips')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      earningsTab === 'trips'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Trips
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="appearance-none bg-surface-container-lowest border border-slate-200/80 rounded-xl px-2.5 py-1 pr-6 font-label-md text-xs font-bold text-on-surface shadow-2xs hover:border-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="6M">6M</option>
                    <option value="3M">3M</option>
                    <option value="12M">1Y</option>
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                    <ChevronRight size={11} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Dynamic Multi-Graph Chart */}
            <div className="w-full relative pt-1">
              {earningsTab === 'net' && (
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none font-headline">
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines & Y-Axis Labels */}
                  {gridVals.map((val) => {
                    const y = svgHeight - paddingBottom - (val / maxVal) * (svgHeight - paddingTop - paddingBottom);
                    return (
                      <g key={val}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={svgWidth - paddingRight}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeDasharray={val === 0 ? '0' : '4 4'}
                          strokeWidth="1"
                        />
                        <text
                          x={paddingLeft - 8}
                          y={y + 3.5}
                          textAnchor="end"
                          className="text-[10px] fill-slate-400 font-semibold font-headline tabular-nums"
                        >
                          {val === 0 ? '0' : `₹${Math.round(val / 1000)}k`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Gradient Fill */}
                  <path d={areaPath} fill="url(#earningsGradient)" />

                  {/* Smooth Curve Stroke */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive Points and X-Axis Labels */}
                  {points.map((pt, idx) => (
                    <g key={idx}>
                      <text
                        x={pt.x}
                        y={svgHeight - 12}
                        textAnchor="middle"
                        className={`text-[11px] font-headline font-semibold transition-colors ${
                          hoveredIndex === idx ? 'fill-blue-600 font-bold' : 'fill-slate-500'
                        }`}
                      >
                        {pt.month}
                      </text>

                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredIndex === idx ? 5.5 : 3.8}
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="cursor-pointer transition-all duration-150 drop-shadow-xs"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />

                      {hoveredIndex === idx && (
                        <g className="pointer-events-none">
                          <rect
                            x={pt.x - 34}
                            y={pt.y - 28}
                            width="68"
                            height="20"
                            rx="5"
                            fill="#0f172a"
                            className="drop-shadow-md"
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 14}
                            textAnchor="middle"
                            fill="#ffffff"
                            className="text-[10px] font-headline font-bold tabular-nums"
                          >
                            {pt.label}
                          </text>
                        </g>
                      )}
                    </g>
                  ))}
                </svg>
              )}

              {earningsTab === 'gross_net' && (
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none font-headline">
                  {gridVals.map((val) => {
                    const y = svgHeight - paddingBottom - (val / maxVal) * (svgHeight - paddingTop - paddingBottom);
                    return (
                      <g key={val}>
                        <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                        <text x={paddingLeft - 8} y={y + 3.5} textAnchor="end" className="text-[10px] fill-slate-400 font-semibold tabular-nums">
                          {val === 0 ? '0' : `₹${Math.round(val / 1000)}k`}
                        </text>
                      </g>
                    );
                  })}
                  {chartPoints.map((r, idx) => {
                    const plotW = svgWidth - paddingLeft - paddingRight;
                    const groupW = plotW / chartPoints.length;
                    const colW = 14;
                    const groupX = paddingLeft + idx * groupW + (groupW - colW * 2 - 4) / 2;
                    const plotH = svgHeight - paddingTop - paddingBottom;
                    const grossH = Math.max(8, ((r.gross || r.value * 1.4) / (maxVal * 1.25)) * plotH);
                    const netH = Math.max(6, (r.value / (maxVal * 1.25)) * plotH);
                    const grossY = svgHeight - paddingBottom - grossH;
                    const netY = svgHeight - paddingBottom - netH;

                    return (
                      <g key={idx}>
                        <rect x={groupX} y={grossY} width={colW} height={grossH} rx="3" fill="#cbd5e1" />
                        <rect x={groupX + colW + 3} y={netY} width={colW} height={netH} rx="3" fill="#2563eb" />
                        <text x={groupX + colW + 1.5} y={svgHeight - 12} textAnchor="middle" className="text-[10.5px] font-headline font-semibold fill-slate-500">
                          {r.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}

              {earningsTab === 'trips' && (
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none font-headline">
                  {[400, 200, 0].map((val) => {
                    const y = svgHeight - paddingBottom - (val / 450) * (svgHeight - paddingTop - paddingBottom);
                    return (
                      <g key={val}>
                        <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                        <text x={paddingLeft - 8} y={y + 3.5} textAnchor="end" className="text-[10px] fill-slate-400 font-semibold tabular-nums">
                          {val}
                        </text>
                      </g>
                    );
                  })}
                  {chartPoints.map((r, idx) => {
                    const plotW = svgWidth - paddingLeft - paddingRight;
                    const groupW = plotW / chartPoints.length;
                    const colW = 24;
                    const x = paddingLeft + idx * groupW + (groupW - colW) / 2;
                    const plotH = svgHeight - paddingTop - paddingBottom;
                    const barH = Math.max(8, ((r.trips || 200) / 450) * plotH);
                    const y = svgHeight - paddingBottom - barH;

                    return (
                      <g key={idx}>
                        <rect x={x} y={y} width={colW} height={barH} rx="4" fill="#10b981" opacity="0.85" />
                        <text x={x + colW / 2} y={y - 4} textAnchor="middle" className="text-[9px] fill-emerald-800 font-bold tabular-nums">
                          {r.trips || 200}
                        </text>
                        <text x={x + colW / 2} y={svgHeight - 12} textAnchor="middle" className="text-[10.5px] font-headline font-semibold fill-slate-500">
                          {r.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Bottom Highlight Strip */}
          <div className="mt-5 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <TrendingUp size={14} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="font-headline text-xs font-bold text-on-surface tabular-nums">
                  ₹{earningsThisMonth.toLocaleString('en-IN')} earned this month
                </div>
                <div className="font-body-sm text-[11px] text-on-surface-variant">
                  That's ₹{earningsDiff.toLocaleString('en-IN')} more than last month.
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="font-headline text-xs font-bold text-emerald-700">Keep going!</div>
              <div className="font-body-sm text-[11px] text-on-surface-variant">Your earnings are on an upward trend.</div>
            </div>
          </div>
        </div>

        {/* Right: Work Activity Calendar Heatmap */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-tight">Work Activity</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Days you were active this month</p>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2.5">
              {/* Day Headers */}
              <div className="grid grid-cols-8 gap-1.5 text-center">
                <div className="font-label-sm text-[11px] font-semibold text-slate-400 text-left pl-1"></div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="font-label-sm text-[11px] font-bold text-on-surface-variant">
                    {d}
                  </div>
                ))}
              </div>

              {/* 5 Weeks Rows */}
              {activityWeeks.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-cols-8 gap-1.5 items-center">
                  <div className="font-label-sm text-[11px] font-semibold text-slate-400 text-left pl-1">
                    {week.label}
                  </div>
                  {week.days.map((isActive, dIdx) => (
                    <div
                      key={dIdx}
                      title={isActive ? 'Active day (trips recorded)' : 'No activity recorded'}
                      className={`h-6 sm:h-7 rounded-lg transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-400/95 hover:bg-emerald-500 shadow-2xs'
                          : 'bg-slate-100/90 hover:bg-slate-200/80'
                      }`}
                    />
                  ))}
                </div>
              ))}

              {/* Legend */}
              <div className="pt-3 flex items-center justify-center gap-5 font-label-sm text-xs text-on-surface-variant font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Active day</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                  <span>No activity</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Highlight Strip */}
          <div className="mt-5 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp size={14} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="font-headline text-xs font-bold text-on-surface tabular-nums">{activeDays} active days</div>
              <div className="font-body-sm text-[11px] text-on-surface-variant">
                You worked on {activePercent}% of available days.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM ROW: WHAT AFFECTS GIGSCORE & ELIGIBLE OFFER   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: What Affects Your GigScore? */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="stroke-[2.5]" />
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-tight">
                What Affects Your GigScore?
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Progress bars (3 cols) */}
              <div className="md:col-span-3 space-y-4">
                {/* 1. Earnings consistency */}
                <div>
                  <div className="flex justify-between font-label-md text-label-md font-semibold text-on-surface mb-1.5">
                    <span>Earnings consistency</span>
                    <span className="font-headline font-bold text-on-surface tabular-nums">{consistencyPct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${consistencyPct}%` }}
                    />
                  </div>
                </div>

                {/* 2. Work activity */}
                <div>
                  <div className="flex justify-between font-label-md text-label-md font-semibold text-on-surface mb-1.5">
                    <span>Work activity</span>
                    <span className="font-headline font-bold text-on-surface tabular-nums">{activityPct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-700"
                      style={{ width: `${activityPct}%` }}
                    />
                  </div>
                </div>

                {/* 3. Repayment history */}
                <div>
                  <div className="flex justify-between font-label-md text-label-md font-semibold text-on-surface mb-1.5">
                    <span>Repayment history</span>
                    <span className="font-headline font-bold text-on-surface tabular-nums">{repaymentPct}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-700"
                      style={{ width: `${repaymentPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right callout tip box (2 cols) */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb size={13} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="font-headline text-xs font-bold text-amber-900 leading-snug">Good job!</div>
                  <div className="font-body-sm text-[11px] text-amber-800/90 leading-relaxed mt-1">
                    Keep maintaining consistent earnings and activity to unlock higher credit limits.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: You May Be Eligible For Offer Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CreditCard size={18} className="stroke-[2.5]" />
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-tight">
                You May Be Eligible For
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div>
                  <div className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight tabular-nums">
                    ₹{availableCredit.toLocaleString('en-IN')}
                  </div>
                  <div className="font-label-md text-label-md font-semibold text-on-surface-variant mt-0.5">
                    Vehicle repair support
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-slate-700">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>Quick application</span>
                  </div>
                  <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-slate-700">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>Minimal documents</span>
                  </div>
                  <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-slate-700">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>Flexible repayment</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onApplyLoan) {
                        onApplyLoan();
                      } else if (onNavigateTab) {
                        onNavigateTab('loan_applications');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-label-md text-label-md font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <span>Check Eligibility</span>
                    <ArrowRight size={14} className="stroke-[2.5]" />
                  </button>
                  <p className="font-body-sm text-[11px] text-slate-400 mt-2">
                    Final approval depends on lender assessment.
                  </p>
                </div>
              </div>

              {/* Graphic Illustration of Car with Wrench */}
              <div className="relative w-44 h-32 self-center sm:self-auto shrink-0 flex items-center justify-center">
                <img
                  src="/images/ill_vehicle_wrench.png"
                  alt="Vehicle Repair Support"
                  className="w-full h-full object-contain drop-shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. DRIVER EMPOWERMENT & SAFETY SHOWCASE (NEW ASSETS)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Earn More, Your Way */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold bg-blue-50 text-secondary border border-blue-100">
                Growth Acceleration
              </span>
              <h3 className="font-headline-md text-headline-md font-extrabold text-on-surface leading-tight">
                Earn More, Your Way
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                More rides. Better earnings. A brighter tomorrow. Unlock peak-hour surges and tailored working capital.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2 font-label-sm text-label-sm font-semibold text-slate-700">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-emerald-500 font-bold">▲</span> +18% MoM Surge
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                  ⚡ Instant Weekly Payouts
                </span>
              </div>
            </div>
            <div className="w-44 h-36 self-center sm:self-auto shrink-0 flex items-center justify-center">
              <img
                src="/images/ill_earn_growth.png"
                alt="Earn More Your Way"
                className="w-full h-full object-contain drop-shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Your Safety Our Priority */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                Driver Protection
              </span>
              <h3 className="font-headline-md text-headline-md font-extrabold text-on-surface leading-tight">
                Your Safety, Our Priority
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                On every journey, we stand with you. Real-time trip validation and 24/7 underwriting support.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2 font-label-sm text-label-sm font-semibold text-slate-700">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={12} className="text-blue-600" /> 24/7 Support
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={12} className="text-blue-600" /> Live Tracking
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={12} className="text-blue-600" /> Driver Community
                </span>
              </div>
            </div>
            <div className="w-44 h-36 self-center sm:self-auto shrink-0 flex items-center justify-center">
              <img
                src="/images/ill_safety.png"
                alt="Your Safety Our Priority"
                className="w-full h-full object-contain drop-shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
