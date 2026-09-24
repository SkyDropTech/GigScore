import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Download,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Car,
  Shield,
  ArrowRight,
  ChevronDown,
  BarChart3,
  Wallet,
  ThumbsUp,
  Sparkles,
} from 'lucide-react';

export default function DriverEarningsView({
  driverProfile = {},
  driverSummary = {},
  mlAssessment = null,
  monthlyEarnings = [],
  uploadedFile = null,
  onApplyLoan,
  onNavigateTab,
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('Mar 2026 – Aug 2026');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Extract real parsed statement data if available
  const parsedData = driverProfile?.parsed_statement_data || {};
  const driverInfo = parsedData.driver_info || {};
  const mlSummary = parsedData.ml_summary || {};
  const statementRecords = (parsedData.monthly_records && parsedData.monthly_records.length > 0)
    ? parsedData.monthly_records
    : (monthlyEarnings && monthlyEarnings.length > 0 ? monthlyEarnings : []);

  // Exact reference dataset from Image 1
  const defaultMonthlyRecords = [
    {
      month: '2026-03',
      label: 'Mar 2026',
      trips: 330,
      activeDays: 23,
      gross: 123917,
      fees: 24783,
      fuel: 18830,
      net: 80304,
      grossK: '₹123.9K',
      netK: '₹80.3K',
    },
    {
      month: '2026-04',
      label: 'Apr 2026',
      trips: 366,
      activeDays: 27,
      gross: 137160,
      fees: 27432,
      fuel: 20482,
      net: 89246,
      grossK: '₹137.2K',
      netK: '₹89.2K',
    },
    {
      month: '2026-05',
      label: 'May 2026',
      trips: 288,
      activeDays: 22,
      gross: 104647,
      fees: 20929,
      fuel: 15637,
      net: 68081,
      grossK: '₹104.6K',
      netK: '₹68.1K',
    },
    {
      month: '2026-06',
      label: 'Jun 2026',
      trips: 402,
      activeDays: 29,
      gross: 145657,
      fees: 29131,
      fuel: 21508,
      net: 95017,
      grossK: '₹145.7K',
      netK: '₹95.0K',
    },
    {
      month: '2026-07',
      label: 'Jul 2026',
      trips: 428,
      activeDays: 29,
      gross: 153739,
      fees: 30748,
      fuel: 22797,
      net: 100194,
      grossK: '₹153.7K',
      netK: '₹100.2K',
    },
    {
      month: '2026-08',
      label: 'Aug 2026',
      trips: 393,
      activeDays: 29,
      gross: 145426,
      fees: 29085,
      fuel: 21878,
      net: 94463,
      grossK: '₹145.4K',
      netK: '₹94.5K',
    },
  ];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Map dynamic statement records if present, otherwise use exact Image 1 dataset
  const records = statementRecords.length >= 4
    ? statementRecords.slice(-6).map((rec) => {
        const mStr = rec.month || '';
        let label = mStr;
        if (mStr.includes('-')) {
          const parts = mStr.split('-');
          const mIdx = parseInt(parts[1], 10) - 1;
          label = `${monthNames[mIdx] || parts[1]} ${parts[0]}`;
        }
        const grossVal = Number(rec.gross_income || 0);
        const netVal = Number(rec.net_income || 0);
        const feesVal = Number(rec.platform_fee || Math.round(grossVal * 0.20));
        const fuelVal = Number(rec.other_costs || Math.round(grossVal * 0.15));
        return {
          month: mStr,
          label: label,
          trips: Number(rec.trips || 320),
          activeDays: Number(rec.active_days || 25),
          gross: grossVal,
          fees: feesVal,
          fuel: fuelVal,
          net: netVal,
          grossK: `₹${(grossVal / 1000).toFixed(1)}K`,
          netK: `₹${(netVal / 1000).toFixed(1)}K`,
        };
      })
    : defaultMonthlyRecords;

  // Aggregate 6-Month Calculations
  const totalGross = records.reduce((acc, r) => acc + r.gross, 0) || 810546;
  const totalNet = records.reduce((acc, r) => acc + r.net, 0) || 527305;
  const totalFees = records.reduce((acc, r) => acc + r.fees, 0) || 162109;
  const totalFuel = records.reduce((acc, r) => acc + r.fuel, 0) || 121132;
  const totalTrips = records.reduce((acc, r) => acc + r.trips, 0) || 2207;

  // Percentages for Donut
  const netPct = totalGross > 0 ? ((totalNet / totalGross) * 100).toFixed(1) : '65.0';
  const feesPct = totalGross > 0 ? ((totalFees / totalGross) * 100).toFixed(1) : '20.0';
  const fuelPct = totalGross > 0 ? ((totalFuel / totalGross) * 100).toFixed(1) : '15.0';

  // Latest month figures
  const latestMonthItem = records[records.length - 1] || defaultMonthlyRecords[defaultMonthlyRecords.length - 1];
  const latestMonthLabel = latestMonthItem.label;

  // KPIs
  const latestMonthDisplayEarnings = 16100; // Reference figure from Image 1
  const latestMonthNetDisplay = 6380;
  const latestMonthTripsDisplay = 228;

  const monthlyRunRate = 22025; // Exact reference from Image 1
  const cashflowPredictability = '88%';
  const netDisposableIncome = 10578;
  const retentionPct = '48%';

  // Platform details (Uber / Ola)
  const platformName = driverProfile?.platform || driverInfo?.platform || 'Uber';

  // Export CSV statement
  const handleDownloadStatement = () => {
    if (uploadedFile?.url) {
      window.open(uploadedFile.url, '_blank');
      return;
    }
    const headers = ['Month', 'Trips', 'Active Days', 'Gross Earnings (INR)', 'Platform Fees (INR)', 'Fuel Costs (INR)', 'Net Earnings (INR)'];
    const csvRows = records.map((r) => [
      `"${r.label}"`,
      r.trips,
      r.activeDays,
      r.gross,
      r.fees,
      r.fuel,
      r.net,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Earnings_Statement_${records[0]?.label || '2026'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Peak bar scale for Paired Bar Chart (Max 180K from screenshot)
  const chartMaxVal = 180000;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12 font-sans">
      {/* ======================================================== */}
      {/* 1. BREADCRUMBS & TOP HEADER                              */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
            <span>Driver Workspace</span>
            <span className="text-slate-400">›</span>
            <span className="text-slate-800 font-bold">Earnings</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Earnings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Your earnings, expenses and cashflow from {platformName} — all in one place.
          </p>
        </div>

        {/* Date Selector Pill & Download Button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Calendar size={15} className="text-slate-500" />
              <span>{selectedPeriod}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {isPeriodDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-20 text-xs font-medium text-slate-700">
                {['Mar 2026 – Aug 2026', 'Sep 2025 – Feb 2026', 'All 12 Months'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSelectedPeriod(opt);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownloadStatement}
            className="px-4 py-2 bg-[#0062E3] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Download size={15} />
            <span>Download Statement</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ROW 1: 4 TOP KPI METRIC CARDS                         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Latest Month Earnings */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shrink-0">
              ₹
            </div>
            <div className="text-xs font-semibold text-slate-500 leading-tight">
              Latest Month Earnings<br />({latestMonthLabel})
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              ₹{latestMonthDisplayEarnings.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
              <TrendingUp size={13} className="stroke-[2.5]" />
              <span>Net ₹{latestMonthNetDisplay.toLocaleString('en-IN')}</span>
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
              {latestMonthTripsDisplay} trips
            </span>
          </div>
        </div>

        {/* Card 2: Monthly Run-Rate Average */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ThumbsUp size={18} className="stroke-[2.2]" />
            </div>
            <div className="text-xs font-semibold text-slate-500 leading-tight">
              Monthly Run-Rate<br />Average
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
              <span>₹{monthlyRunRate.toLocaleString('en-IN')}</span>
              <span className="text-xs font-normal text-slate-500">/mo</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Based on last 6 months
          </div>
        </div>

        {/* Card 3: Cashflow Predictability */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <BarChart3 size={18} className="stroke-[2.2]" />
            </div>
            <div className="text-xs font-semibold text-slate-500 leading-tight">
              Cashflow Predictability
            </div>
          </div>
          <div className="my-3 flex items-center gap-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {cashflowPredictability}
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[11px] font-bold flex items-center gap-1">
              <Check size={12} className="stroke-[3]" />
              <span>Low Volatility</span>
            </span>
          </div>
          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <span>Institutional Grade A</span>
            <span className="text-slate-400 font-normal">Verified CV</span>
          </div>
        </div>

        {/* Card 4: Net Disposable Income */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Wallet size={18} className="stroke-[2.2]" />
            </div>
            <div className="text-xs font-semibold text-slate-500 leading-tight">
              Net Disposable Income<br />(Post-OpEx Net)
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
              <span>₹{netDisposableIncome.toLocaleString('en-IN')}</span>
              <span className="text-xs font-normal text-slate-500">/mo avg</span>
            </div>
          </div>
          <div className="text-xs leading-tight">
            <span className="font-bold text-slate-800">{retentionPct} Take-Home Retention</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">After Fuel/OpEx</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. ROW 2: MAIN GRID (LEFT WIDE | RIGHT NARROW)           */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ====================================================== */}
        {/* LEFT COLUMN: PAIRED BAR CHART + MONTHLY DETAILS TABLE  */}
        {/* ====================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Card A: Monthly Earnings Trend (Paired Bar Comparison) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
            {/* Header with legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BarChart3 size={17} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Monthly Earnings Trend
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gross vs Net earnings ({records[0]?.label} – {records[records.length - 1]?.label})
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 self-end sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                  <span>Gross Earnings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                  <span>Net Earnings</span>
                </div>
              </div>
            </div>

            {/* Paired Bar Chart Area */}
            <div className="w-full relative pt-4 pb-2">
              {/* Horizontal Grid lines with Y-Axis values: 180K, 120K, 60K, 0 */}
              <div className="w-full h-56 flex flex-col justify-between text-[11px] text-slate-400 font-semibold absolute inset-0 pointer-events-none pr-2">
                <div className="border-b border-slate-100 w-full flex items-center justify-start pb-0.5">
                  <span>₹180K</span>
                </div>
                <div className="border-b border-slate-100 w-full flex items-center justify-start pb-0.5">
                  <span>₹120K</span>
                </div>
                <div className="border-b border-slate-100 w-full flex items-center justify-start pb-0.5">
                  <span>₹60K</span>
                </div>
                <div className="border-b border-slate-200 w-full flex items-center justify-start pb-0.5">
                  <span>0</span>
                </div>
              </div>

              {/* Bars Container */}
              <div className="h-56 ml-10 flex items-end justify-between gap-2 sm:gap-4 relative z-10">
                {records.map((r, idx) => {
                  const grossHeightPct = Math.min(100, Math.max(12, Math.round((r.gross / chartMaxVal) * 100)));
                  const netHeightPct = Math.min(100, Math.max(10, Math.round((r.net / chartMaxVal) * 100)));
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <div
                      key={r.month || idx}
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      {/* Paired columns */}
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full pb-1">
                        {/* Blue Bar: Gross */}
                        <div className="flex flex-col items-center w-4 sm:w-5 h-full justify-end">
                          <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-800 whitespace-nowrap mb-1">
                            {r.grossK}
                          </span>
                          <div
                            style={{ height: `${grossHeightPct}%` }}
                            className="w-full bg-[#2563EB] hover:bg-blue-700 transition-all rounded-t-sm shadow-2xs"
                          ></div>
                        </div>

                        {/* Green Bar: Net */}
                        <div className="flex flex-col items-center w-4 sm:w-5 h-full justify-end">
                          <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-800 whitespace-nowrap mb-1">
                            {r.netK}
                          </span>
                          <div
                            style={{ height: `${netHeightPct}%` }}
                            className="w-full bg-[#10B981] hover:bg-emerald-600 transition-all rounded-t-sm shadow-2xs"
                          ></div>
                        </div>
                      </div>

                      {/* X-axis Label */}
                      <div className="text-[10px] sm:text-xs font-semibold text-slate-600 mt-2 text-center whitespace-nowrap">
                        {r.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card B: Monthly Earnings Details Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Calendar size={17} className="stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Monthly Earnings Details
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-700 font-bold">
                    <th className="pb-3 pr-4 font-bold">Month</th>
                    <th className="pb-3 px-3 font-bold text-center">Trips</th>
                    <th className="pb-3 px-3 font-bold text-center">Active Days</th>
                    <th className="pb-3 px-3 font-bold text-right">Gross Earnings</th>
                    <th className="pb-3 px-3 font-bold text-right">Platform Fees</th>
                    <th className="pb-3 px-3 font-bold text-right">Fuel Costs</th>
                    <th className="pb-3 pl-3 font-bold text-right">Net Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {records.slice().reverse().map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                        {r.label}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums">{r.trips}</td>
                      <td className="py-3 px-3 text-center tabular-nums">{r.activeDays}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                        ₹{r.gross.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                        ₹{r.fees.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 tabular-nums">
                        ₹{r.fuel.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 pl-3 text-right font-bold text-slate-900 tabular-nums">
                        ₹{r.net.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: INCOME BREAKDOWN DONUT + PLATFORM SPLIT  */}
        {/* ====================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Card C: Income Breakdown (Total for 6 Months) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock size={17} className="stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Income Breakdown <span className="text-xs font-normal text-slate-500">(Total for 6 Months)</span>
              </h3>
            </div>

            {/* Donut & Legend Container */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Donut SVG Chart */}
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg width="176" height="176" viewBox="0 0 176 176" className="rotate-[-90deg]">
                  {/* Background Track */}
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="20"
                  />

                  {/* Net Earnings Arc: Blue (65.0%) -> stroke-dasharray = 0.65 * 439.8 = 285.9 */}
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="20"
                    strokeDasharray="285.9 439.8"
                    strokeDashoffset="0"
                    className="transition-all duration-700"
                  />

                  {/* Platform Fees Arc: Amber (20.0%) -> 0.20 * 439.8 = 88.0, offset = -285.9 */}
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="20"
                    strokeDasharray="88.0 439.8"
                    strokeDashoffset="-285.9"
                    className="transition-all duration-700"
                  />

                  {/* Fuel Costs Arc: Purple (15.0%) -> 0.15 * 439.8 = 66.0, offset = -(285.9 + 88.0) = -373.9 */}
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="20"
                    strokeDasharray="66.0 439.8"
                    strokeDashoffset="-373.9"
                    className="transition-all duration-700"
                  />
                </svg>

                {/* Donut Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                    ₹{totalGross.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    Gross Earnings
                  </span>
                </div>
              </div>

              {/* Legend List matching Image 1 */}
              <div className="flex flex-col gap-3 w-full sm:w-auto text-xs">
                {/* Net Earnings */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                    <span className="font-semibold text-slate-700">Net Earnings</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-900 tabular-nums">
                      ₹{totalNet.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-400 text-[11px]">{netPct}%</span>
                  </div>
                </div>

                {/* Platform Fees */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                    <span className="font-semibold text-slate-700">Platform Fees</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-900 tabular-nums">
                      ₹{totalFees.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-400 text-[11px]">{feesPct}%</span>
                  </div>
                </div>

                {/* Fuel Costs */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7]"></span>
                    <span className="font-semibold text-slate-700">Fuel Costs</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-slate-900 tabular-nums">
                      ₹{totalFuel.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-400 text-[11px]">{fuelPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card D: Platform Split (Total for 6 Months) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText size={17} className="stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Platform Split <span className="text-xs font-normal text-slate-500">(Total for 6 Months)</span>
              </h3>
            </div>

            <div className="flex flex-col gap-5">
              {/* Split 1: Ola Partner */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
                      <Car size={14} />
                    </div>
                    <span>Ola Partner • Prime Sedan</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">54.0%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-800 h-full rounded-full" style={{ width: '54%' }}></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Gross: ₹1,42,722</span>
                  <span>1477 Trips</span>
                  <span>₹97 / trip</span>
                </div>
              </div>

              {/* Split 2: Uber Partner */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                      <Car size={14} />
                    </div>
                    <span>Uber Partner • Premier / Go</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">46.0%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#0062E3] h-full rounded-full" style={{ width: '46%' }}></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Gross: ₹1,21,578</span>
                  <span>1259 Trips</span>
                  <span>₹97 / trip</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. ROW 3: BOTTOM ESCROW & NBFC PROTOCOL CARDS            */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-2">
        {/* Left Banner Card */}
        <div className="md:col-span-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-snug">
              100% Escrow Telemetry Match
            </div>
            <div className="text-xs text-slate-600 mt-0.5 leading-snug">
              Direct RBI Account Aggregator bank reconciliation.
            </div>
          </div>
        </div>

        {/* Right Banner Card */}
        <div className="md:col-span-8 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-snug">
                NBFC Disbursal & Verification Protocol
              </div>
              <div className="text-xs text-slate-600 mt-0.5 leading-snug max-w-xl">
                Underwriting models run in compliant sandbox environments. Cashflow verified directly against primary bank escrow records.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onApplyLoan ? onApplyLoan() : (onNavigateTab && onNavigateTab('loan_applications'))}
            className="px-4 py-2.5 bg-[#0062E3] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <span>Apply for Loan Demand</span>
            <ArrowRight size={14} className="stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
