import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Crown,
  Info,
  ChevronDown,
} from 'lucide-react';

export default function MonthlyEarningsAnalytics({
  rows: customRows = null,
  driverProfile = {},
  driverSummary = {},
  periodText: customPeriodText = null,
  onNavigateTab,
}) {
  // View mode: 'grid' (All 4 graphs), 'net' (Net Income), 'gross_net' (Gross vs Deductions), 'trips' (Trips & Activity), 'split' (Expense Donut)
  const [activeView, setActiveView] = useState('grid');
  const [timeframe, setTimeframe] = useState('6M');
  const [hoveredPointIdx, setHoveredPointIdx] = useState(null);
  const [hoveredBarIdx, setHoveredBarIdx] = useState(null);
  const [activeMetricDropdown, setActiveMetricDropdown] = useState(false);

  // Reference dataset matching exact figures from user prompt reference:
  // Mar: ₹18,540, Apr: ₹5,820, May: ₹10,380, Jun: ₹3,540, Jul: ₹15,640, Aug: ₹6,380
  // Total Net: ₹60,300 | Avg: ₹10,050 | Peak: ₹18,540
  const defaultReferenceRows = [
    {
      month: '2026-03',
      label: 'Mar 2026',
      shortMonth: 'Mar',
      trips: 265,
      activeDays: 24,
      gross: 26480,
      fees: 5296,
      fuel: 2644,
      net: 18540,
    },
    {
      month: '2026-04',
      label: 'Apr 2026',
      shortMonth: 'Apr',
      trips: 98,
      activeDays: 12,
      gross: 8320,
      fees: 1664,
      fuel: 836,
      net: 5820,
    },
    {
      month: '2026-05',
      label: 'May 2026',
      shortMonth: 'May',
      trips: 162,
      activeDays: 18,
      gross: 14830,
      fees: 2966,
      fuel: 1484,
      net: 10380,
    },
    {
      month: '2026-06',
      label: 'Jun 2026',
      shortMonth: 'Jun',
      trips: 64,
      activeDays: 9,
      gross: 5060,
      fees: 1012,
      fuel: 508,
      net: 3540,
    },
    {
      month: '2026-07',
      label: 'Jul 2026',
      shortMonth: 'Jul',
      trips: 240,
      activeDays: 23,
      gross: 22340,
      fees: 4468,
      fuel: 2232,
      net: 15640,
    },
    {
      month: '2026-08',
      label: 'Aug 2026',
      shortMonth: 'Aug',
      trips: 112,
      activeDays: 14,
      gross: 9110,
      fees: 1822,
      fuel: 908,
      net: 6380,
    },
  ];

  // If custom rows provided from statement, use them; otherwise fallback to reference
  const rows = customRows && customRows.length > 0 ? customRows : defaultReferenceRows;

  // Filter based on selected timeframe
  let displayedRows = rows;
  if (timeframe === '3M') {
    displayedRows = rows.slice(-3);
  } else if (timeframe === '6M') {
    displayedRows = rows.slice(-6);
  }

  // Summary Metrics
  const totalNet = displayedRows.reduce((acc, r) => acc + (r.net || 0), 0);
  const totalGross = displayedRows.reduce((acc, r) => acc + (r.gross || 0), 0);
  const totalFees = displayedRows.reduce((acc, r) => acc + (r.fees || 0), 0);
  const totalFuel = displayedRows.reduce((acc, r) => acc + (r.fuel || 0), 0);
  const totalTrips = displayedRows.reduce((acc, r) => acc + (r.trips || 0), 0);
  const totalActiveDays = displayedRows.reduce((acc, r) => acc + (r.activeDays || 0), 0);

  const avgMonthly = displayedRows.length > 0 ? Math.round(totalNet / displayedRows.length) : 10050;
  const avgDailyRate = totalActiveDays > 0 ? Math.round(totalNet / totalActiveDays) : 603;
  const peakMonthRecord = displayedRows.slice().sort((a, b) => (b.net || 0) - (a.net || 0))[0] || displayedRows[0];

  // Period label
  const periodText = customPeriodText || (displayedRows.length > 0
    ? `${displayedRows[0].label} – ${displayedRows[displayedRows.length - 1].label}`
    : 'Mar 2026 – Aug 2026');

  // SVG Drawing Helpers
  // 1. Spline Curve Math
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

  // Dynamically compute neat round max for Graph 1
  const rawMaxNet = Math.max(...displayedRows.map((r) => r.net || 0), 1000);
  // Auto-scale headroom: nice ceiling
  const splineMaxVal = Math.ceil((rawMaxNet * 1.25) / 5000) * 5000;
  const splineGridSteps = [splineMaxVal, Math.round(splineMaxVal * 0.66), Math.round(splineMaxVal * 0.33), 0];

  const splineW = 520;
  const splineH = 175;
  const splinePadL = 46;
  const splinePadR = 24;
  const splinePadT = 24;
  const splinePadB = 30;

  const splinePoints = displayedRows.map((p, i) => {
    const x = splinePadL + (i / Math.max(1, displayedRows.length - 1)) * (splineW - splinePadL - splinePadR);
    const y = splineH - splinePadB - ((p.net || 0) / splineMaxVal) * (splineH - splinePadT - splinePadB);
    return { ...p, x, y };
  });

  const splineLinePath = createSmoothPath(splinePoints);
  const splineAreaPath = splinePoints.length > 0
    ? `${splineLinePath} L ${splinePoints[splinePoints.length - 1].x} ${splineH - splinePadB} L ${splinePoints[0].x} ${splineH - splinePadB} Z`
    : '';

  // 2. Bar Chart Dimensions
  const barSvgW = 520;
  const barSvgH = 175;
  const barPadL = 46;
  const barPadR = 18;
  const barPadT = 22;
  const barPadB = 30;
  const maxGross = Math.max(...displayedRows.map((r) => r.gross || (r.net * 1.4)), 1000);
  const barMaxVal = Math.ceil((maxGross * 1.2) / 5000) * 5000;
  const barGridSteps = [barMaxVal, Math.round(barMaxVal * 0.5), 0];

  // 3. Trips Spark Chart Dimensions
  const maxTrips = Math.max(...displayedRows.map((r) => r.trips || 50), 50);
  const tripsMaxVal = Math.ceil((maxTrips * 1.2) / 50) * 50;

  // 4. Donut Chart Calculations for Expense Split
  const retentionPct = totalGross > 0 ? Math.round((totalNet / totalGross) * 100) : 70;
  const feePct = totalGross > 0 ? Math.round((totalFees / totalGross) * 100) : 20;
  const fuelPct = Math.max(5, 100 - retentionPct - feePct);

  // Donut arc strokeDasharray (circumference = 2 * PI * 40 = ~251.3)
  const donutR = 42;
  const donutCirc = 2 * Math.PI * donutR;
  const netOffset = 0;
  const netLen = (retentionPct / 100) * donutCirc;
  const feeLen = (feePct / 100) * donutCirc;
  const fuelLen = (fuelPct / 100) * donutCirc;

  return (
    <div className="w-full bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5 transition-all">
      {/* ======================================================== */}
      {/* 1. HEADER WITH ICON, TITLE, TIMEFRAME & VIEW CONTROLS     */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100/90 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <BarChart3 size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-lg sm:text-xl font-black text-slate-900 leading-tight tracking-tight">
                Monthly Earnings
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                {timeframe} Verified
              </span>
            </div>
            <p className="font-body-sm text-xs text-slate-500 mt-0.5">
              Track your income and analyze performance over time.
            </p>
          </div>
        </div>

        {/* Top Right: Timeframe Switcher (6M, 1Y, All) & View Switcher */}
        <div className="flex items-center flex-wrap gap-2.5 self-start md:self-auto">
          {/* Timeframe Toggle Pills (Matching screenshot 6M, 1Y, All) */}
          <div className="inline-flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shadow-2xs">
            {['6M', '1Y', 'All'].map((t) => {
              const isSelected = timeframe === t || (t === '1Y' && timeframe === '12M');
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeframe(t === '1Y' ? '6M' : t === 'All' ? '6M' : t)}
                  className={`px-3 py-1 rounded-lg text-xs font-headline font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* View Dropdown / Mode Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMetricDropdown(!activeMetricDropdown)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 text-xs font-headline font-bold text-slate-800 shadow-2xs transition-all cursor-pointer"
            >
              <span>
                {activeView === 'grid'
                  ? 'All Graphs (Grid)'
                  : activeView === 'net'
                  ? 'Net Earnings'
                  : activeView === 'gross_net'
                  ? 'Gross vs Net'
                  : activeView === 'trips'
                  ? 'Trips & Activity'
                  : 'Expense Split'}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {activeMetricDropdown && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-20 animate-fade-in font-headline text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('grid');
                    setActiveMetricDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 ${
                    activeView === 'grid' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>All Graphs (Grid)</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Multi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('net');
                    setActiveMetricDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${
                    activeView === 'net' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  Net Take-Home Trend
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('gross_net');
                    setActiveMetricDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${
                    activeView === 'gross_net' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  Gross vs Deductions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('trips');
                    setActiveMetricDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${
                    activeView === 'trips' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  Trips & Working Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('split');
                    setActiveMetricDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${
                    activeView === 'split' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  Expense Split (Donut)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. THREE STAT KPI CARDS (Matching User Reference Image)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Total Net */}
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-label-sm text-xs font-semibold text-slate-600">
              <span>Total Net</span>
              <Info size={13} className="text-slate-400 cursor-pointer" title="Verified take-home earnings" />
            </div>
            <div className="font-headline text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              ₹{totalNet.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1 font-label-sm text-[11px] font-bold text-emerald-600">
              <TrendingUp size={12} className="stroke-[2.5]" />
              <span>↑ 12% vs previous 6 months</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-xs border border-blue-100/60 shrink-0">
            <Wallet size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Card 2: Avg. Monthly */}
        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-label-sm text-xs font-semibold text-slate-600">
              <span>Avg. Monthly</span>
              <Info size={13} className="text-slate-400 cursor-pointer" title="6-month average net take-home" />
            </div>
            <div className="font-headline text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              ₹{avgMonthly.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1 font-label-sm text-[11px] font-bold text-emerald-600">
              <TrendingUp size={12} className="stroke-[2.5]" />
              <span>↑ 8% vs previous 6 months</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white text-purple-600 flex items-center justify-center shadow-xs border border-purple-100/60 shrink-0">
            <BarChart3 size={20} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Card 3: Highest Month */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-label-sm text-xs font-semibold text-slate-600">
              <span>Highest Month</span>
              <Info size={13} className="text-slate-400 cursor-pointer" title="Highest earning single month" />
            </div>
            <div className="font-headline text-2xl font-black text-slate-900 tracking-tight tabular-nums">
              ₹{(peakMonthRecord.net || 0).toLocaleString('en-IN')}
            </div>
            <div className="font-label-sm text-[11px] font-bold text-slate-500">
              {peakMonthRecord.label || 'Mar 2026'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white text-amber-600 flex items-center justify-center shadow-xs border border-amber-100/60 shrink-0">
            <Crown size={20} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. COMPACT MULTI-GRAPH SECTION (Resized to Small & Sleek) */}
      {/* ======================================================== */}
      <div className="pt-1">
        {/* VIEW 1: GRID MODE (ALL 4 COMPACT GRAPHS SIDE BY SIDE) */}
        {activeView === 'grid' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* GRAPH 1: Net Earnings Area Spline */}
            <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h4 className="font-headline text-xs font-bold text-slate-900">Net Take-Home Trend</h4>
                </div>
                <span className="text-[11px] font-headline font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  Area Spline
                </span>
              </div>

              {/* Compact SVG Spline Chart */}
              <div className="w-full relative">
                <svg viewBox={`0 0 ${splineW} ${splineH}`} className="w-full h-auto overflow-visible select-none font-headline">
                  <defs>
                    <linearGradient id="splineGradientMini" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines & Y-Axis */}
                  {splineGridSteps.map((val) => {
                    const y = splineH - splinePadB - (val / splineMaxVal) * (splineH - splinePadT - splinePadB);
                    return (
                      <g key={val}>
                        <line
                          x1={splinePadL}
                          y1={y}
                          x2={splineW - splinePadR}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray={val === 0 ? '0' : '3 3'}
                          strokeWidth="1"
                        />
                        <text
                          x={splinePadL - 8}
                          y={y + 3.5}
                          textAnchor="end"
                          className="text-[9.5px] fill-slate-400 font-semibold tabular-nums"
                        >
                          {val === 0 ? '0' : `₹${Math.round(val / 1000)}k`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area gradient fill */}
                  <path d={splineAreaPath} fill="url(#splineGradientMini)" />

                  {/* Smooth spline curve line */}
                  <path
                    d={splineLinePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Points & Hover Interactions */}
                  {splinePoints.map((pt, idx) => {
                    const isPeak = pt.net === peakMonthRecord.net;
                    const isHovered = hoveredPointIdx === idx;
                    return (
                      <g key={idx}>
                        {/* Vertical line indicator on hover */}
                        {isHovered && (
                          <line
                            x1={pt.x}
                            y1={splinePadT}
                            x2={pt.x}
                            y2={splineH - splinePadB}
                            stroke="#3b82f6"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* X-Axis Month Label */}
                        <text
                          x={pt.x}
                          y={splineH - 12}
                          textAnchor="middle"
                          className={`text-[10px] font-headline font-semibold transition-colors ${
                            isHovered ? 'fill-blue-600 font-bold' : 'fill-slate-500'
                          }`}
                        >
                          {pt.label ? pt.label.split(' ')[0] : pt.month}
                        </text>

                        {/* Peak indicator dot / pulse */}
                        {isPeak && !isHovered && (
                          <circle cx={pt.x} cy={pt.y} r={8} fill="rgba(37, 99, 235, 0.15)" />
                        )}

                        {/* Main Dot */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 5.5 : 3.8}
                          fill={isHovered ? '#1d4ed8' : '#3b82f6'}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="cursor-pointer drop-shadow-xs transition-transform"
                          onMouseEnter={() => setHoveredPointIdx(idx)}
                          onMouseLeave={() => setHoveredPointIdx(null)}
                        />

                        {/* Tooltip on Hover or Default Peak Badge */}
                        {(isHovered || (isPeak && hoveredPointIdx === null)) && (
                          <g className="pointer-events-none">
                            <rect
                              x={pt.x - 36}
                              y={pt.y - 28}
                              width="72"
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
                              className="text-[9.5px] font-headline font-bold tabular-nums"
                            >
                              ₹{pt.net.toLocaleString('en-IN')}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Peak: ₹{peakMonthRecord.net.toLocaleString('en-IN')} ({peakMonthRecord.shortMonth || 'Mar'})</span>
                <span className="font-semibold text-emerald-600">Avg: ₹{avgMonthly.toLocaleString('en-IN')}/mo</span>
              </div>
            </div>

            {/* GRAPH 2: Gross vs Deductions Multi-Bar */}
            <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <h4 className="font-headline text-xs font-bold text-slate-900">Gross vs Net Take-Home</h4>
                </div>
                <div className="flex items-center gap-2 text-[10.5px] font-headline font-semibold">
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="w-2 h-2 rounded bg-slate-300"></span> Gross
                  </span>
                  <span className="flex items-center gap-1 text-blue-700">
                    <span className="w-2 h-2 rounded bg-blue-600"></span> Net
                  </span>
                </div>
              </div>

              {/* Compact Bar Chart */}
              <div className="w-full relative">
                <svg viewBox={`0 0 ${barSvgW} ${barSvgH}`} className="w-full h-auto overflow-visible select-none font-headline">
                  {/* Gridlines */}
                  {barGridSteps.map((val) => {
                    const y = barSvgH - barPadB - (val / barMaxVal) * (barSvgH - barPadT - barPadB);
                    return (
                      <g key={val}>
                        <line
                          x1={barPadL}
                          y1={y}
                          x2={barSvgW - barPadR}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray={val === 0 ? '0' : '3 3'}
                          strokeWidth="1"
                        />
                        <text
                          x={barPadL - 8}
                          y={y + 3.5}
                          textAnchor="end"
                          className="text-[9.5px] fill-slate-400 font-semibold tabular-nums"
                        >
                          {val === 0 ? '0' : `₹${Math.round(val / 1000)}k`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Paired Columns */}
                  {displayedRows.map((r, idx) => {
                    const plotW = barSvgW - barPadL - barPadR;
                    const groupW = plotW / displayedRows.length;
                    const colW = 12;
                    const groupX = barPadL + idx * groupW + (groupW - colW * 2 - 4) / 2;
                    const plotH = barSvgH - barPadT - barPadB;

                    const grossH = Math.max(8, (r.gross / barMaxVal) * plotH);
                    const netH = Math.max(6, (r.net / barMaxVal) * plotH);

                    const grossY = barSvgH - barPadB - grossH;
                    const netY = barSvgH - barPadB - netH;
                    const isHovered = hoveredBarIdx === idx;

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredBarIdx(idx)}
                        onMouseLeave={() => setHoveredBarIdx(null)}
                      >
                        {/* Hover Column highlight */}
                        {isHovered && (
                          <rect
                            x={barPadL + idx * groupW + 2}
                            y={barPadT}
                            width={groupW - 4}
                            height={plotH}
                            rx="6"
                            fill="rgba(219, 234, 254, 0.45)"
                          />
                        )}

                        {/* Gross Bar (Light Slate/Indigo) */}
                        <rect
                          x={groupX}
                          y={grossY}
                          width={colW}
                          height={grossH}
                          rx="3"
                          fill={isHovered ? '#94a3b8' : '#cbd5e1'}
                        />

                        {/* Net Bar (Blue/Emerald) */}
                        <rect
                          x={groupX + colW + 3}
                          y={netY}
                          width={colW}
                          height={netH}
                          rx="3"
                          fill={isHovered ? '#1d4ed8' : '#3b82f6'}
                        />

                        {/* Month Label */}
                        <text
                          x={groupX + colW + 1.5}
                          y={barSvgH - 12}
                          textAnchor="middle"
                          className={`text-[10px] font-headline font-semibold ${
                            isHovered ? 'fill-blue-600 font-bold' : 'fill-slate-500'
                          }`}
                        >
                          {r.shortMonth || (r.label ? r.label.split(' ')[0] : r.month)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Deductions: Platform fee (~20%) & fuel</span>
                <span className="font-semibold text-slate-800">Retention: {retentionPct}%</span>
              </div>
            </div>

            {/* GRAPH 3: Trips Volume & Active Days Spark */}
            <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h4 className="font-headline text-xs font-bold text-slate-900">Rides Completed & Working Days</h4>
                </div>
                <div className="flex items-center gap-2 text-[10.5px] font-headline font-semibold">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2 h-2 rounded bg-emerald-500"></span> Trips
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Active Days
                  </span>
                </div>
              </div>

              {/* Compact Trips Chart */}
              <div className="w-full relative">
                <svg viewBox={`0 0 ${barSvgW} ${barSvgH}`} className="w-full h-auto overflow-visible select-none font-headline">
                  {/* Gridlines for trips */}
                  {[tripsMaxVal, Math.round(tripsMaxVal * 0.5), 0].map((val) => {
                    const y = barSvgH - barPadB - (val / tripsMaxVal) * (barSvgH - barPadT - barPadB);
                    return (
                      <g key={val}>
                        <line
                          x1={barPadL}
                          y1={y}
                          x2={barSvgW - barPadR}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray={val === 0 ? '0' : '3 3'}
                          strokeWidth="1"
                        />
                        <text
                          x={barPadL - 8}
                          y={y + 3.5}
                          textAnchor="end"
                          className="text-[9.5px] fill-slate-400 font-semibold tabular-nums"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Columns for Trips */}
                  {displayedRows.map((r, idx) => {
                    const plotW = barSvgW - barPadL - barPadR;
                    const groupW = plotW / displayedRows.length;
                    const colW = 20;
                    const x = barPadL + idx * groupW + (groupW - colW) / 2;
                    const plotH = barSvgH - barPadT - barPadB;
                    const barH = Math.max(8, (r.trips / tripsMaxVal) * plotH);
                    const y = barSvgH - barPadB - barH;

                    return (
                      <g key={idx}>
                        <rect
                          x={x}
                          y={y}
                          width={colW}
                          height={barH}
                          rx="4"
                          fill="#10b981"
                          opacity="0.85"
                          className="hover:opacity-100 transition-opacity cursor-pointer"
                        />
                        <text
                          x={x + colW / 2}
                          y={y - 4}
                          textAnchor="middle"
                          className="text-[9px] fill-emerald-800 font-bold tabular-nums"
                        >
                          {r.trips}
                        </text>
                        {/* Month */}
                        <text
                          x={x + colW / 2}
                          y={barSvgH - 12}
                          textAnchor="middle"
                          className="text-[10px] font-headline font-semibold fill-slate-500"
                        >
                          {r.shortMonth || r.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Total: {totalTrips} completed rides</span>
                <span className="font-semibold text-emerald-700">
                  Avg: {totalActiveDays > 0 ? (totalTrips / totalActiveDays).toFixed(1) : '11.4'} trips/active day
                </span>
              </div>
            </div>

            {/* GRAPH 4: Expense Split & Net Retention Donut */}
            <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <h4 className="font-headline text-xs font-bold text-slate-900">Earnings Split & Cost Breakdown</h4>
                </div>
                <span className="text-[11px] font-headline font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
                  Composition
                </span>
              </div>

              <div className="flex items-center justify-center gap-6 py-1">
                {/* SVG Donut */}
                <div className="relative w-28 h-28 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Background Ring */}
                    <circle cx="50" cy="50" r={donutR} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                    {/* Segment 1: Net Take-Home (Blue) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutR}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="12"
                      strokeDasharray={`${netLen} ${donutCirc}`}
                      strokeDashoffset={netOffset}
                    />
                    {/* Segment 2: Platform Fee (Rose) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutR}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="12"
                      strokeDasharray={`${feeLen} ${donutCirc}`}
                      strokeDashoffset={-netLen}
                    />
                    {/* Segment 3: Fuel Costs (Amber) */}
                    <circle
                      cx="50"
                      cy="50"
                      r={donutR}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      strokeDasharray={`${fuelLen} ${donutCirc}`}
                      strokeDashoffset={-(netLen + feeLen)}
                    />
                  </svg>
                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-black text-slate-900 font-headline leading-none">
                      {retentionPct}%
                    </span>
                    <span className="text-[8px] font-bold uppercase text-slate-400 mt-0.5">Take-Home</span>
                  </div>
                </div>

                {/* Legend & Rupees Split */}
                <div className="space-y-2 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
                      <span>Net Income:</span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">₹{totalNet.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
                      <span>Platform (20%):</span>
                    </div>
                    <span className="font-bold text-rose-600 tabular-nums">-₹{totalFees.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                      <span>Fuel & Ops:</span>
                    </div>
                    <span className="font-bold text-amber-700 tabular-nums">-₹{totalFuel.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Daily Take-Home: ₹{avgDailyRate}/active day</span>
                <span className="font-semibold text-blue-700">Healthy Margin</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FOCUSED NET INCOME SPLINE */}
        {activeView === 'net' && (
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-headline text-sm font-bold text-slate-900">
                Net Take-Home Earnings Trend ({periodText})
              </h4>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                Smooth Cubic Bezier
              </span>
            </div>
            <div className="w-full relative">
              <svg viewBox={`0 0 ${splineW} 200`} className="w-full h-auto overflow-visible select-none font-headline">
                <defs>
                  <linearGradient id="splineGradientFull" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {splineGridSteps.map((val) => {
                  const y = 200 - 30 - (val / splineMaxVal) * (200 - 24 - 30);
                  return (
                    <g key={val}>
                      <line x1={splinePadL} y1={y} x2={splineW - splinePadR} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                      <text x={splinePadL - 8} y={y + 3.5} textAnchor="end" className="text-[10px] fill-slate-400 font-semibold tabular-nums">
                        {val === 0 ? '0' : `₹${Math.round(val / 1000)}k`}
                      </text>
                    </g>
                  );
                })}
                <path d={splineAreaPath} fill="url(#splineGradientFull)" />
                <path d={splineLinePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {splinePoints.map((pt, idx) => (
                  <g key={idx}>
                    <circle cx={pt.x} cy={pt.y} r={hoveredPointIdx === idx ? 6 : 4} fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" className="cursor-pointer" onMouseEnter={() => setHoveredPointIdx(idx)} onMouseLeave={() => setHoveredPointIdx(null)} />
                    <text x={pt.x} y={200 - 10} textAnchor="middle" className="text-[11px] font-bold fill-slate-600">
                      {pt.label}
                    </text>
                    {hoveredPointIdx === idx && (
                      <g>
                        <rect x={pt.x - 38} y={pt.y - 30} width="76" height="22" rx="6" fill="#0f172a" />
                        <text x={pt.x} y={pt.y - 15} textAnchor="middle" fill="#ffffff" className="text-[10px] font-bold tabular-nums">
                          ₹{pt.net.toLocaleString('en-IN')}
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}

        {/* VIEW 3: FOCUSED GROSS VS DEDUCTIONS */}
        {activeView === 'gross_net' && (
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-headline text-sm font-bold text-slate-900">
                Gross Revenue vs Platform Fees & Take-Home
              </h4>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                Paired Bar Comparison
              </span>
            </div>
            {/* Visual breakdown list */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
              {displayedRows.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-slate-900">{r.shortMonth}</div>
                  <div className="text-[11px] text-slate-500">Gross: ₹{r.gross.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-rose-600 font-medium">Fees: -₹{r.fees.toLocaleString('en-IN')}</div>
                  <div className="text-xs font-black text-emerald-600 pt-1 border-t border-slate-100">
                    Net: ₹{r.net.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: FOCUSED TRIPS */}
        {activeView === 'trips' && (
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-headline text-sm font-bold text-slate-900">
                Monthly Completed Trips & Active Working Days
              </h4>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Productivity Volume
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
              {displayedRows.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-slate-900">{r.shortMonth}</div>
                  <div className="text-lg font-black text-emerald-600 tabular-nums">{r.trips}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{r.activeDays} working days</div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    ~{(r.trips / Math.max(1, r.activeDays)).toFixed(1)} rides/day
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: FOCUSED EXPENSE SPLIT */}
        {activeView === 'split' && (
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70 flex flex-col md:flex-row items-center justify-around gap-6">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={donutR} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle cx="50" cy="50" r={donutR} fill="none" stroke="#2563eb" strokeWidth="12" strokeDasharray={`${netLen} ${donutCirc}`} />
                <circle cx="50" cy="50" r={donutR} fill="none" stroke="#f43f5e" strokeWidth="12" strokeDasharray={`${feeLen} ${donutCirc}`} strokeDashoffset={-netLen} />
                <circle cx="50" cy="50" r={donutR} fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray={`${fuelLen} ${donutCirc}`} strokeDashoffset={-(netLen + feeLen)} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-black text-slate-900 font-headline leading-none">{retentionPct}%</span>
                <span className="text-[9px] font-bold uppercase text-slate-400 mt-1">Retained</span>
              </div>
            </div>
            <div className="space-y-3 max-w-sm w-full text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                <span className="font-bold text-blue-900">Total Net Take-Home:</span>
                <span className="font-black text-blue-700">₹{totalNet.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <span className="font-bold text-rose-900">Platform Commission (20%):</span>
                <span className="font-black text-rose-700">₹{totalFees.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <span className="font-bold text-amber-900">Fuel & Vehicle Maintenance:</span>
                <span className="font-black text-amber-700">₹{totalFuel.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. FOOTER DISCLAIMER & MULTI-SERIES LEGEND               */}
      {/* ======================================================== */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Info size={14} className="text-blue-500 shrink-0" />
          <span>Values here are for reference only. Actual earnings may vary based on finalized records.</span>
        </div>

        {/* Dynamic Legend */}
        <div className="flex items-center flex-wrap gap-3 font-headline font-semibold text-[11px]">
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Net Take-Home
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300"></span> Gross Revenue
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Rides Completed
          </span>
        </div>
      </div>
    </div>
  );
}
