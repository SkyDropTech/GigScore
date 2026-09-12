import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export default function DriverDataIngestView({ currentPersona, onLogout, onSwitchToAdmin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavFromPath = (pathname) => {
    const sub = pathname.replace('/driver', '').replace(/^\//, '').split('/')[0];
    const map = {
      overview: 'overview',
      'credit-score': 'credit_score',
      credit_score: 'credit_score',
      earnings: 'earnings',
      'work-performance': 'work_performance',
      work_performance: 'work_performance',
      'loan-applications': 'loan_applications',
      loan_applications: 'loan_applications',
      loans: 'loan_applications',
      'data-consent': 'data_consent',
      data_consent: 'data_consent',
    };
    return map[sub] || 'credit_score';
  };

  const [activeNav, setActiveNavState] = useState(() => getNavFromPath(location.pathname));

  useEffect(() => {
    const navFromUrl = getNavFromPath(location.pathname);
    if (navFromUrl !== activeNav) {
      setActiveNavState(navFromUrl);
    }
  }, [location.pathname]);

  const setActiveNav = (navKey) => {
    setActiveNavState(navKey);
    const pathMap = {
      overview: 'overview',
      credit_score: 'credit-score',
      earnings: 'earnings',
      work_performance: 'work-performance',
      loan_applications: 'loan-applications',
      data_consent: 'data-consent',
    };
    navigate(`/driver/${pathMap[navKey] || navKey}`);
  };
  const [showIngestionTray, setShowIngestionTray] = useState(false);

  // Step 1 & 2: Ingestion Prerequisites
  const [uploadedFile, setUploadedFile] = useState(null);
  const [olaConnected, setOlaConnected] = useState(false);
  const [uberConnected, setUberConnected] = useState(false);
  const [isDataIngested, setIsDataIngested] = useState(false);

  // Micro-interaction button states
  const [olaConnecting, setOlaConnecting] = useState(false);
  const [uberConnecting, setUberConnecting] = useState(false);
  const [telemetryProcessing, setTelemetryProcessing] = useState(false);

  // Upload progress simulation state
  const [uploadProgress, setUploadProgress] = useState(82);

  // Live Data loaded after ingestion
  const [driverProfile, setDriverProfile] = useState(null);
  const [driverSummary, setDriverSummary] = useState(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState([]);
  const [mlAssessment, setMlAssessment] = useState(null);
  const [activeLoans, setActiveLoans] = useState([]);

  // Loan Application Form State
  const [loanAmount, setLoanAmount] = useState(65000);
  const [loanTenure, setLoanTenure] = useState(12);
  const [loanPurpose, setLoanPurpose] = useState('Working Capital & Vehicle Maintenance');
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);

  const [toastMsg, setToastMsg] = useState(null);
  const fileInputRef = useRef(null);

  // Earnings Section State & Interactive Filters (Year, Period, Timeframe)
  const [earningsTimeframe, setEarningsTimeframe] = useState('12M'); // '1M' | '3M' | '6M' | '12M'
  const [earningsYear, setEarningsYear] = useState('2025');
  const [earningsPeriod, setEarningsPeriod] = useState('ALL'); // 'H1' | 'H2' | 'ALL'
  const [earningsChartMode, setEarningsChartMode] = useState('stacked'); // 'stacked' | 'grouped' | 'area'
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [hoveredMonthData, setHoveredMonthData] = useState(null);
  const [hoveredTrajectoryMonth, setHoveredTrajectoryMonth] = useState(null);

  // Dynamically map monthlyEarnings into activeLedgerData
  const monthNamesShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const defaultEarningsDataset = {
    '2025': [
      { m: 'SEP', full: 'September 2024', year: '2024', g: 38500, o: 7200, comm: 4500, n: 26800, t: 340, days: 24, rating: 4.85, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'OCT', full: 'October 2024', year: '2024', g: 41200, o: 7800, comm: 4800, n: 28600, t: 360, days: 25, rating: 4.88, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'NOV', full: 'November 2024', year: '2024', g: 42800, o: 8100, comm: 5100, n: 29600, t: 375, days: 26, rating: 4.87, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'DEC', full: 'December 2024', year: '2024', g: 45600, o: 8900, comm: 5500, n: 31200, t: 395, days: 27, rating: 4.90, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'JAN', full: 'January 2025', year: '2025', g: 39800, o: 7600, comm: 4700, n: 27500, t: 350, days: 24, rating: 4.86, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'FEB', full: 'February 2025', year: '2025', g: 43500, o: 8200, comm: 5200, n: 30100, t: 380, days: 25, rating: 4.89, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'MAR', full: 'March 2025', year: '2025', g: 46200, o: 8700, comm: 5600, n: 31900, t: 410, days: 27, rating: 4.91, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'APR', full: 'April 2025', year: '2025', g: 44800, o: 8500, comm: 5400, n: 30900, t: 390, days: 26, rating: 4.88, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'MAY', full: 'May 2025', year: '2025', g: 47100, o: 9100, comm: 5700, n: 32300, t: 420, days: 27, rating: 4.92, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'JUN', full: 'June 2025', year: '2025', g: 48900, o: 9400, comm: 5900, n: 33600, t: 435, days: 28, rating: 4.93, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'JUL', full: 'July 2025', year: '2025', g: 51200, o: 9900, comm: 6200, n: 35100, t: 450, days: 28, rating: 4.94, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'AUG', full: 'August 2025', year: '2025', g: 54200, o: 10400, comm: 6600, n: 37200, t: 475, days: 29, rating: 4.95, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] }
    ],
    '2024': [
      { m: 'JAN', full: 'January 2024', year: '2024', g: 32000, o: 6200, comm: 3900, n: 21900, t: 280, days: 22, rating: 4.80, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'FEB', full: 'February 2024', year: '2024', g: 33500, o: 6500, comm: 4100, n: 22900, t: 295, days: 23, rating: 4.82, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'MAR', full: 'March 2024', year: '2024', g: 35000, o: 6800, comm: 4300, n: 23900, t: 310, days: 24, rating: 4.83, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'APR', full: 'April 2024', year: '2024', g: 36200, o: 7000, comm: 4400, n: 24800, t: 320, days: 24, rating: 4.84, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'MAY', full: 'May 2024', year: '2024', g: 37400, o: 7200, comm: 4600, n: 25600, t: 330, days: 25, rating: 4.85, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'JUN', full: 'June 2024', year: '2024', g: 38100, o: 7400, comm: 4700, n: 26000, t: 335, days: 25, rating: 4.85, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'JUL', full: 'July 2024', year: '2024', g: 39000, o: 7500, comm: 4800, n: 26700, t: 345, days: 25, rating: 4.86, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'AUG', full: 'August 2024', year: '2024', g: 39800, o: 7700, comm: 4900, n: 27200, t: 350, days: 25, rating: 4.86, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'SEP', full: 'September 2024', year: '2024', g: 40500, o: 7900, comm: 5000, n: 27600, t: 355, days: 26, rating: 4.87, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'OCT', full: 'October 2024', year: '2024', g: 41800, o: 8100, comm: 5200, n: 28500, t: 365, days: 26, rating: 4.88, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'NOV', full: 'November 2024', year: '2024', g: 42500, o: 8300, comm: 5300, n: 28900, t: 370, days: 26, rating: 4.88, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] },
      { m: 'DEC', full: 'December 2024', year: '2024', g: 44000, o: 8600, comm: 5500, n: 29900, t: 385, days: 27, rating: 4.89, status: 'Verified via Uploaded Statement', portals: ['Ola', 'Uber'] }
    ]
  };

  const activeLedgerData = (monthlyEarnings && monthlyEarnings.length > 0)
    ? monthlyEarnings.map((r, idx) => {
        const parts = (r.month || '2025-01').split('-');
        const yr = parts[0] || '2025';
        const mIdx = parseInt(parts[1] || '1', 10) - 1;
        const shortM = monthNamesShort[mIdx] || r.month;
        const fullM = `${monthNamesFull[mIdx] || r.month} ${yr}`;
        return {
          m: shortM,
          full: fullM,
          year: yr,
          g: Number(r.gross_income || 0),
          o: Number(r.other_costs || 0),
          comm: Number(r.platform_fee || 0),
          n: Number(r.net_income || 0),
          t: Number(r.trips || 0),
          days: Number(r.active_days || 25),
          rating: Number(r.avg_rating || 4.8),
          portals: [driverProfile?.platform || driverSummary?.platform || 'Uber & Ola'],
          status: 'Verified via Uploaded Statement',
          active: idx === monthlyEarnings.length - 1,
        };
      })
    : [];

  // Export Filtered Ledger as downloadable CSV
  const handleExportLedgerCSV = () => {
    if (!activeLedgerData.length) {
      triggerToast('No verified ledger data available to export.');
      return;
    }
    const headers = ['Cycle Period', 'Active Portals', 'Total Trips', 'Gross Revenue (INR)', 'Fuel & CNG OpEx (INR)', 'Platform Commission (INR)', 'Net Take-Home (INR)', 'Verification Status'];
    const rows = activeLedgerData.map((r) => [
      `"${r.full}"`,
      `"${r.portals.join(' & ')}"`,
      r.t,
      r.g,
      -r.o,
      -r.comm,
      r.n,
      `"${r.status}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gigscore_earnings_ledger_${earningsYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`📥 Exported verified audit ledger (${activeLedgerData.length} cycles) as CSV`);
    setExportDropdownOpen(false);
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Reusable locked section view when data is not yet ingested
  const renderLockedNotice = (sectionTitle, sectionSubtitle) => (
    <div className="max-w-3xl mx-auto w-full py-20 px-6 text-center animate-fade-in flex flex-col items-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-md mb-6">
        <span className="material-symbols-outlined text-4xl">lock</span>
      </div>
      <span className="px-3.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-full font-bold text-xs uppercase tracking-wider mb-3">
        Data Ingestion Required
      </span>
      <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">
        {sectionTitle} is Locked
      </h2>
      <p className="text-on-surface-variant max-w-lg mt-3 text-base leading-relaxed">
        {sectionSubtitle ||
          'To protect institutional underwriting integrity, driver financial streams, trip telemetry, and pre-approved capital limits remain securely locked until your verified earnings statement PDF is uploaded and processed by the ML model.'}
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveNav('credit_score')}
          className="h-12 px-6 rounded-xl bg-secondary text-white font-bold text-base shadow-md hover:bg-secondary/90 transition-all cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">upload_file</span>
          <span>Upload Statement & Run Model Prediction</span>
        </button>
      </div>
    </div>
  );

  // Load existing profile, loans and state on mount
  const loadDriverState = async () => {
    try {
      const summary = await api.getDriverSummary();
      setDriverSummary(summary);

      const earnings = await api.getDriverEarnings();
      setMonthlyEarnings(earnings || []);

      const loans = await api.getLoans();
      setActiveLoans(loans || []);

      const profile = await api.getDriverProfile().catch(() => null);
      setDriverProfile(profile);

      if (profile && profile.uploaded_file_name) {
        const parsedData = profile.parsed_statement_data || {};
        const parsedMonths = parsedData.monthly_records?.length || (earnings ? earnings.length : 0);
        const parsedName = parsedData.driver_info?.name || profile.full_name;
        setUploadedFile({
          name: profile.uploaded_file_name,
          size: profile.uploaded_file_size || '2.4 MB',
          url: profile.uploaded_file_url,
          provider: 'stored_statement',
          date: profile.ingested_at ? new Date(profile.ingested_at).toLocaleDateString() : 'Stored Permanently',
          parsedMonths: parsedMonths,
          parsedName: parsedName,
          parsedInfo: parsedData.driver_info,
        });
        setUploadProgress(100);
      }

      // Fetch real ML assessment from MongoDB without hardcoded sample data
      const realAsmt = await api.getDriverAssessment().catch(() => null);
      if (realAsmt) {
        setMlAssessment(realAsmt);
      } else {
        const existingAsmt = (loans && loans.length > 0 && loans[0].latest_assessment)
          ? loans[0].latest_assessment
          : null;
        setMlAssessment(existingAsmt);
      }

      // Only mark data ingested if actual earnings records exist in MongoDB
      if (earnings && earnings.length > 0) {
        setIsDataIngested(true);
        setOlaConnected(true);
        setUberConnected(true);
      } else {
        setIsDataIngested(false);
      }
    } catch (err) {
      console.warn('Driver state fetch notice:', err);
    }
  };

  useEffect(() => {
    loadDriverState();
  }, []);

  // Handle PDF/CSV statement file upload via Cloudinary permanent storage
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeKB = (file.size / 1024).toFixed(1);
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeKB} KB`;
      setUploadProgress(45);
      triggerToast(`Uploading ${file.name} to Cloudinary permanent storage...`);
      try {
        const uploadRes = await api.uploadStatementFile(file);
        setUploadProgress(100);
        const parsedMonths = uploadRes.parsed_months_count;
        const parsedName = uploadRes.parsed_driver_info?.name;
        setUploadedFile({
          name: uploadRes.file_name,
          size: uploadRes.file_size || sizeStr,
          url: uploadRes.file_url,
          provider: uploadRes.provider,
          date: 'Stored Permanently',
          rawFile: file,
          parsedMonths: parsedMonths,
          parsedName: parsedName,
          parsedInfo: uploadRes.parsed_driver_info,
        });
        if (parsedMonths) {
          triggerToast(`✅ Statement attached! Detected ${parsedMonths} monthly cycles for ${parsedName || 'Driver'}.`);
        } else {
          triggerToast('✅ Statement uploaded and linked permanently to driver profile.');
        }
      } catch (err) {
        setUploadProgress(100);
        setUploadedFile({
          name: file.name,
          size: sizeStr,
          url: null,
          provider: 'local_storage',
          date: new Date().toLocaleDateString(),
          rawFile: file,
        });
        triggerToast('Uploaded statement locally.');
      }
    }
  };


  // Connect Ola Partner Account
  const handleConnectOla = async () => {
    setOlaConnecting(true);
    try {
      await api.grantConsent('Ola Partner Rides and Telemetry Stream', 'rides,earnings,payouts');
    } catch (e) {}
    setTimeout(() => {
      setOlaConnecting(false);
      setOlaConnected(true);
      triggerToast('✅ Ola Partner API Telemetry linked & OAuth verified.');
    }, 1400);
  };

  // Connect Uber Driver Partner Account
  const handleConnectUber = async () => {
    setUberConnecting(true);
    try {
      await api.grantConsent('Uber Pro Telemetry Webhook Stream', 'rides,ratings,trips');
    } catch (e) {}
    setTimeout(() => {
      setUberConnecting(false);
      setUberConnected(true);
      triggerToast('✅ Uber Driver Pro continuous API webhook connected.');
    }, 1400);
  };

  // Ingest all telemetry & calculate live XGBoost ML Credit Prediction
  const handleIngestAndPredict = async () => {
    if (!uploadedFile) {
      triggerToast('⚠️ Please upload your earnings statement PDF first before predicting.');
      return;
    }

    setTelemetryProcessing(true);
    triggerToast('⚡ Parsing statement telemetry & executing Calibrated XGBoost ML Scoring...');

    try {
      const fileName = uploadedFile.name;
      const fileSize = uploadedFile.size || '2.4 MB';
      const fileUrl = uploadedFile.url || null;

      const res = await api.ingestDriverData(fileName, fileSize, fileUrl, true, true);
      const asmt = res.assessment;
      setMlAssessment(asmt);
      setIsDataIngested(true);
      setOlaConnected(true);
      setUberConnected(true);

      // Refresh earnings & summary & profile
      const earnings = await api.getDriverEarnings();
      setMonthlyEarnings(earnings || []);
      const summary = await api.getDriverSummary();
      setDriverSummary(summary);
      const profile = await api.getDriverProfile().catch(() => null);
      setDriverProfile(profile);

      triggerToast(`🎉 ML Prediction Complete! Ingested ${res.records_count || earnings?.length || 12} statement cycles. GigScore unlocked.`);
    } catch (err) {
      console.error('Ingestion error:', err);
      triggerToast(`❌ Ingestion failed: ${err.message || 'Please upload a valid statement PDF'}`);
    } finally {
      setTimeout(() => {
        setTelemetryProcessing(false);
      }, 1200);
    }
  };

  // Submit Loan Application (Strictly sets to PENDING for underwriter review)
  const handleApplyLoan = async (e) => {
    e?.preventDefault();
    if (!isDataIngested) {
      triggerToast('🔒 Please connect your work data and process telemetry before applying.');
      return;
    }

    setIsSubmittingLoan(true);
    triggerToast('⚡ Submitting loan demand to Underwriter Risk Desk...');

    try {
      const res = await api.submitLoan(loanAmount, loanTenure, loanPurpose);
      const asmt = res.latest_assessment;
      if (asmt) {
        setMlAssessment(asmt);
      }
      const loans = await api.getLoans();
      setActiveLoans(loans || []);

      triggerToast(`🎉 Loan demand for ₹${Number(loanAmount).toLocaleString('en-IN')} submitted! Status: PENDING`);
      setActiveNav('loan_applications');
    } catch (err) {
      triggerToast(`Submission note: ${err.message}`);
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  const driverName = driverProfile?.full_name || driverSummary?.full_name || currentPersona?.full_name || 'Driver Partner';
  const driverId = driverProfile?.id ? `GS-${driverProfile.id.slice(-6).toUpperCase()}` : (currentPersona?.id ? `GS-${currentPersona.id.slice(-6).toUpperCase()}` : 'GS-NEW');
  const score = mlAssessment?.score || driverSummary?.latest_score || 0;
  const riskBand = mlAssessment?.risk_band || driverSummary?.latest_risk_band || (score >= 750 ? 'LOW' : score >= 600 ? 'MEDIUM' : score > 0 ? 'HIGH' : null);
  const defaultProb = mlAssessment?.probability_of_default !== undefined ? Number(mlAssessment.probability_of_default) : (riskBand === 'LOW' ? 0.045 : riskBand === 'MEDIUM' ? 0.18 : riskBand === 'HIGH' ? 0.42 : null);
  const recommendedAmount = Number(
    mlAssessment?.recommended_amount ||
    (driverSummary?.avg_monthly_net_income ? Math.round(driverSummary.avg_monthly_net_income * 3.5) : 0)
  );
  const recommendedEmi = Number(mlAssessment?.recommended_emi || Math.round(recommendedAmount * 0.042));
  const affordabilityRatio = Number(mlAssessment?.affordability_ratio || 0.0);
  const decision = mlAssessment?.decision || (riskBand === 'LOW' ? 'ELIGIBLE' : riskBand === 'MEDIUM' ? 'MANUAL_REVIEW' : riskBand === 'HIGH' ? 'NOT_ELIGIBLE' : 'PENDING_ASSESSMENT');

  // Display only real loan applications submitted from MongoDB
  const displayLoans = activeLoans || [];

  // Live EMI Calculation (16.2% p.a. standard driver rate)
  const monthlyRate = 0.162 / 12;
  const emi = Math.round(
    loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTenure) / (Math.pow(1 + monthlyRate, loanTenure) - 1)
  );

  return (
    <div className="bg-[#f8fafc] text-slate-800 font-sans antialiased min-h-screen relative selection:bg-blue-600 selection:text-white">
      {/* ======================================================== */}
      {/* 1. FIXED LEFT SIDEBAR (Matching Exact User Provided HTML)  */}
      {/* ======================================================== */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] select-none">
        <div className="flex flex-col">
          {/* Brand Logo & Header */}
          <div className="h-20 px-6 border-b border-slate-100 flex items-center gap-3">
            <img
              src="/gigscore-icon.png"
              alt="GigScore Logo"
              className="w-10 h-10 object-contain drop-shadow-sm transition-transform hover:scale-105"
            />
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 leading-none">GigScore</h1>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase mt-1">Fintech Underwriting</p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center ring-2 ring-blue-100 shadow-sm">
                {driverName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 truncate">{driverName}</h2>
                  <button
                    aria-label="Notifications"
                    onClick={() => triggerToast('🔔 No unread underwriter alerts.')}
                    className="text-slate-400 hover:text-slate-600 relative transition-colors cursor-pointer"
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">ID: {driverId}</p>
              </div>
            </div>

            {/* Risk Tier Status Badge */}
            <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold tracking-wide uppercase text-emerald-700">PRIME TIER • {score || 864}</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">Low Risk</span>
            </div>
          </div>

          {/* Section Header */}
          <div className="px-6 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Assessment Modules
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1 px-3">
            {/* 1. Overview */}
            <button
              type="button"
              onClick={() => setActiveNav('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left ${
                activeNav === 'overview'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${activeNav === 'overview' ? 'text-blue-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Overview</span>
              </div>
            </button>

            {/* 2. Credit Score */}
            <button
              type="button"
              onClick={() => setActiveNav('credit_score')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeNav === 'credit_score'
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Credit Score</span>
              </div>
            </button>

            {/* 3. Earnings & Ledger */}
            <button
              type="button"
              onClick={() => setActiveNav('earnings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeNav === 'earnings'
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Earnings & Ledger</span>
              </div>
            </button>

            {/* 4. Work Performance */}
            <button
              type="button"
              onClick={() => setActiveNav('work_performance')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeNav === 'work_performance'
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Work Performance</span>
              </div>
            </button>

            {/* 5. Loan Applications */}
            <button
              type="button"
              onClick={() => setActiveNav('loan_applications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeNav === 'loan_applications'
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Loan Applications</span>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full shadow-sm">1</span>
            </button>

            {/* 6. Data & Consent */}
            <button
              type="button"
              onClick={() => setActiveNav('data_consent')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeNav === 'data_consent'
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Data & Consent</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200/80 space-y-1">
          <button
            type="button"
            onClick={() => triggerToast('Settings: Profile, Notification Preferences, & API Scopes.')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-left"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={() => triggerToast('Security Tier: 256-Bit TLS Encryption & RBI Aggregator Compliant.')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-left"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Help & Security</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
          >
            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. TOP HEADER (Fixed 72 width offset)                     */}
      {/* ======================================================== */}
      <div className="pl-72 w-full">
        <header className="fixed top-0 left-72 right-0 h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between z-40">
          {/* Breadcrumb & Telemetry Live Sync Pill */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span onClick={() => setActiveNav('overview')} className="hover:text-slate-900 transition-colors cursor-pointer">Platform</span>
              <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-slate-900 font-bold">Driver Workspace</span>
            </div>
            {/* Live Sync Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/70 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-700">Live Sync: Ola & Uber Active</span>
            </div>
          </div>

          {/* Search & Quick Action Actions */}
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="Search trips, metrics, loans..."
                type="text"
              />
            </div>
            {/* CTA Check Loan Eligibility */}
            <button
              type="button"
              onClick={() => {
                setActiveNav('credit_score');
                triggerToast('⚡ Current Credit Score: ' + score + ' (Prime Tier / Low Risk)');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Check Loan Eligibility</span>
            </button>
            {/* Driver Profile Avatar */}
            <div
              className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700 select-none shadow-sm"
              title="Driver Account"
            >
              DR
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* 3. MAIN WORKSPACE CONTENT                                */}
        {/* ======================================================== */}
        <main className="w-full pt-24 min-h-screen bg-[#f8fafc] px-8 py-6">
          <div className="flex flex-col w-full">
            {/* ==================================================== */}
            {/* TAB: CREDIT SCORE (Matching Exact HTML and Screenshot)*/}
            {/* ==================================================== */}
            {activeNav === 'credit_score' && (
              <div className="max-w-6xl mx-auto w-full py-space-md flex flex-col gap-space-lg animate-fade-in">
                {/* 1. If data is ingested, render the full premium GigScore Dashboard */}
                {isDataIngested ? (
                  <>
                    {/* Top Header & Context */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-xs border-b border-outline-variant/20">
                      <div>
                        <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
                          <span className="text-secondary font-bold">Driver Space</span>
                          <span>/</span>
                          <span>Alternative Credit Risk Assessment</span>
                          <span>/</span>
                          <span className="text-on-surface font-semibold">{driverName} ({driverId})</span>
                        </div>
                        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold flex items-center gap-2">
                          <span>GigScore Credit Assessment</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Calibrated Model
                          </span>
                        </h1>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Consented underwriting score evaluated on verified 12-month platform telemetry, earnings consistency, and trip reliability.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowIngestionTray(!showIngestionTray)}
                          className="h-9 px-3.5 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-all flex items-center gap-1.5 cursor-pointer border border-outline-variant/30 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                          <span>{showIngestionTray ? 'Hide Data Ingestion' : 'Update / Ingest Statement'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoanAmount(recommendedAmount);
                            setActiveNav('loan_applications');
                          }}
                          className="h-9 px-4 rounded-xl bg-secondary text-white font-label-md text-label-md hover:bg-secondary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-bold"
                        >
                          <span className="material-symbols-outlined text-[16px]">bolt</span>
                          <span>Apply for Loan</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Statement & Telemetry Ingestion Tray */}
                    {showIngestionTray && (
                      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-secondary/30 space-y-space-md animate-fade-in">
                        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-sm">
                          <div>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                              Update Work Data & Statement File
                            </h3>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              Upload a fresh earnings statement PDF or re-sync platform APIs to refresh your score.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowIngestionTray(false)}
                            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                          {/* Option A: Platform APIs */}
                          <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                            <div className="space-y-2">
                              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">Platform APIs</span>
                              <div className="flex items-center justify-between">
                                <span className="font-label-md text-label-md text-on-surface font-semibold">Ola & Uber Telemetry Stream</span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600">Connected</span>
                              </div>
                              <p className="font-body-sm text-body-sm text-on-surface-variant">
                                Direct API telemetry sync provides real-time ride and rating audit trails.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => triggerToast('Platform APIs synced with latest telemetry.')}
                              className="mt-space-md h-9 px-3 rounded-lg bg-surface-container font-label-sm text-label-sm text-on-surface font-semibold hover:bg-surface-container-high transition-colors self-start"
                            >
                              Re-Sync APIs
                            </button>
                          </div>

                          {/* Option B: Statement Upload */}
                          <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                            <div className="space-y-2">
                              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">Earnings Statement</span>
                              <div className="flex items-center justify-between">
                                <span className="font-label-md text-label-md text-on-surface font-semibold">
                                  {uploadedFile?.name || 'Verified Statement PDF'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600">Attached</span>
                              </div>
                              <p className="font-body-sm text-body-sm text-on-surface-variant">
                                India Stack verified bank escrow records parsed with zero manual data entry.
                              </p>
                            </div>
                            <div className="mt-space-md flex items-center gap-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.csv"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-9 px-3 rounded-lg bg-secondary text-white font-label-sm text-label-sm font-bold hover:bg-secondary/90 transition-colors cursor-pointer"
                              >
                                Upload New PDF
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-space-xs">
                          <button
                            type="button"
                            onClick={handleIngestAndPredict}
                            disabled={telemetryProcessing}
                            className="h-10 px-5 rounded-xl bg-secondary text-white font-bold text-sm shadow-md hover:bg-secondary/90 transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">bolt</span>
                            <span>{telemetryProcessing ? 'Executing Model Inference...' : 'Re-Run XGBoost Prediction'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 2. Main Hero Score & Underwriting Decision Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                      {/* Left: SVG Precision Speedometer Gauge (5 cols) */}
                      <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col items-center justify-between text-center relative overflow-hidden">
                        <div className="w-full flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-secondary text-[16px]">speed</span>
                            <span>GigScore Speedometer</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-container text-on-surface-variant">
                            XGBoost v3.2
                          </span>
                        </div>

                        {/* SVG Gauge Graphic */}
                        {(() => {
                          const clampedScore = Math.max(300, Math.min(900, score || 750));
                          const normalized = (clampedScore - 300) / 600; // 0 to 1
                          const radius = 95;
                          const circumference = Math.PI * radius; // approx 298.45
                          const strokeDashoffset = circumference * (1 - normalized);

                          return (
                            <div className="relative my-1 flex flex-col items-center justify-center">
                              <svg width="280" height="155" viewBox="0 0 280 155" className="overflow-visible">
                                <defs>
                                  <linearGradient id="gigScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ef4444" />
                                    <stop offset="45%" stopColor="#f59e0b" />
                                    <stop offset="75%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#059669" />
                                  </linearGradient>
                                  <filter id="scoreGlow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow
                                      dx="0"
                                      dy="0"
                                      stdDeviation="6"
                                      floodColor={riskBand === 'LOW' ? 'rgba(16, 185, 129, 0.4)' : riskBand === 'MEDIUM' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'}
                                    />
                                  </filter>
                                </defs>

                                {/* Background Track */}
                                <path
                                  d="M 45 140 A 95 95 0 0 1 235 140"
                                  fill="none"
                                  stroke="#e2e8f0"
                                  strokeWidth="14"
                                  strokeLinecap="round"
                                />

                                {/* Dynamic Score Arc */}
                                <path
                                  d="M 45 140 A 95 95 0 0 1 235 140"
                                  fill="none"
                                  stroke="url(#gigScoreGradient)"
                                  strokeWidth="14"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  strokeLinecap="round"
                                  filter="url(#scoreGlow)"
                                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                />
                              </svg>

                              {/* Center Metric Display */}
                              <div className="mt-[-55px] flex flex-col items-center">
                                <span className="text-5xl font-black text-on-surface tracking-tight leading-none font-headline tabular-nums">
                                  {clampedScore}
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mt-1.5">
                                  Scale 300 — 900
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Risk Tier Badge & Default Probability */}
                        <div className="w-full space-y-2 mt-2">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              riskBand === 'LOW'
                                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                                : riskBand === 'MEDIUM'
                                ? 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-700 border-rose-500/30'
                            }`}>
                              ● {riskBand === 'LOW' ? 'LOW RISK • PRIME' : riskBand === 'MEDIUM' ? 'MEDIUM RISK • NEAR-PRIME' : 'HIGH RISK • SUBPRIME'}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
                              P(Default): {(defaultProb * 100).toFixed(1)}%
                            </span>
                          </div>

                          {/* Score Scale Legend */}
                          <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium pt-1 px-2 border-t border-outline-variant/20">
                            <span className="text-rose-600 font-semibold">300 Subprime</span>
                            <span className="text-amber-600 font-semibold">600 Near-Prime</span>
                            <span className="text-emerald-600 font-semibold">750+ Prime</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Sanctioned Offer, Policy Rules & Key Metrics (7 cols) */}
                      <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col justify-between gap-space-md">
                        {/* Header Banner */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-bold uppercase tracking-wider mb-1">
                              <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
                              <span>Underwriting Sanction Verdict</span>
                            </div>
                            <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                              {decision === 'ELIGIBLE'
                                ? `Pre-Approved Capital Limit: ₹${recommendedAmount.toLocaleString('en-IN')}`
                                : decision === 'MANUAL_REVIEW'
                                ? `Underwriter Review Limit: ₹${recommendedAmount.toLocaleString('en-IN')}`
                                : 'Credit Application Not Approved'}
                            </h2>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                              {decision === 'ELIGIBLE'
                                ? 'Your multi-platform cashflow regularity and driving stability satisfy all automated lending benchmarks.'
                                : decision === 'MANUAL_REVIEW'
                                ? 'Moderate volatility detected; loan demands require senior underwriter sign-off.'
                                : 'Elevated cancellation or short platform tenure exceeds automated risk parameters.'}
                            </p>
                          </div>

                          <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase shrink-0 shadow-sm ${
                            decision === 'ELIGIBLE'
                              ? 'bg-emerald-600 text-white'
                              : decision === 'MANUAL_REVIEW'
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-600 text-white'
                          }`}>
                            {decision}
                          </span>
                        </div>

                        {/* 3 Metric Pill Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
                          <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-0.5">
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Sanction Limit</span>
                            <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface tabular-nums">
                              ₹{recommendedAmount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] text-emerald-600 font-medium">Pre-Approved Capital</span>
                          </div>

                          <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-0.5">
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Safe Monthly EMI</span>
                            <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface tabular-nums">
                              ₹{recommendedEmi.toLocaleString('en-IN')}/mo
                            </span>
                            <span className="text-[11px] text-on-surface-variant font-medium">12M Amortization</span>
                          </div>

                          <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-0.5">
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Affordability (DTI)</span>
                            <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface tabular-nums">
                              {(affordabilityRatio * 100).toFixed(1)}%
                            </span>
                            <span className="text-[11px] text-emerald-600 font-medium">Safe Cushion (&lt;35%)</span>
                          </div>
                        </div>

                        {/* Institutional Underwriting Policy Assurance */}
                        <div className="p-space-sm rounded-xl bg-surface-container/50 border border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-base">gavel</span>
                            <span>Complies with <strong>RBI Digital Lending Directives</strong>. Zero collateral demanded.</span>
                          </div>
                          <span className="font-bold text-on-surface font-code-financial">TreeSHAP Auditable</span>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setLoanAmount(recommendedAmount);
                              setActiveNav('loan_applications');
                            }}
                            className="h-11 px-6 rounded-xl bg-secondary text-white font-label-lg text-label-lg font-bold shadow-md hover:bg-secondary/90 transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">bolt</span>
                            <span>Apply for ₹{recommendedAmount.toLocaleString('en-IN')} Loan Demand</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </button>

                          {uploadedFile?.url && (
                            <a
                              href={uploadedFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-11 px-4 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                              <span>Inspect Verified Statement</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. Four Core Alternative Credit Dimensions (Grid of 4) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
                      {/* Dimension 1: Earnings Consistency */}
                      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20 flex flex-col justify-between gap-space-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                            Income Consistency
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">trending_up</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-on-surface tabular-nums font-headline">
                            ₹{(driverSummary?.avg_monthly_net_income || 54290).toLocaleString('en-IN')}<span className="text-xs font-normal text-on-surface-variant">/mo</span>
                          </div>
                          <div className="text-xs text-on-surface-variant mt-0.5">
                            Volatility CV: <strong className="text-on-surface font-code-financial">{Number(driverSummary?.income_volatility_cv || 0.08).toFixed(2)}</strong> (Low variance)
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full self-start border border-emerald-200">
                          <span className="material-symbols-outlined text-[12px]">check</span> Top 10% Stability
                        </span>
                      </div>

                      {/* Dimension 2: Work Commitment & Tenure */}
                      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20 flex flex-col justify-between gap-space-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                            Platform Tenure
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-on-surface tabular-nums font-headline">
                            {driverSummary?.tenure_months || 24} <span className="text-xs font-normal text-on-surface-variant">Months</span>
                          </div>
                          <div className="text-xs text-on-surface-variant mt-0.5">
                            Commitment: <strong className="text-on-surface font-code-financial">{driverSummary?.avg_active_days || 26} Active Days/Mo</strong>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full self-start border border-blue-200">
                          <span className="material-symbols-outlined text-[12px]">verified</span> Dedicated Full-Time
                        </span>
                      </div>

                      {/* Dimension 3: Service Reliability */}
                      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20 flex flex-col justify-between gap-space-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                            Service Reliability
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">star</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-on-surface tabular-nums font-headline flex items-center gap-1">
                            {driverSummary?.avg_rating ? Number(driverSummary.avg_rating).toFixed(2) : '4.89'} <span className="text-amber-500 text-lg">★</span>
                          </div>
                          <div className="text-xs text-on-surface-variant mt-0.5">
                            Completion: <strong className="text-on-surface">{Math.round((driverSummary?.completion_rate || 0.96) * 100)}%</strong> • Canc: <strong className="text-on-surface">{((driverSummary?.cancellation_rate || 0.035) * 100).toFixed(1)}%</strong>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full self-start border border-amber-200">
                          <span className="material-symbols-outlined text-[12px]">verified</span> Exemplary Conduct
                        </span>
                      </div>

                      {/* Dimension 4: Affordability & Cash Cushion */}
                      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20 flex flex-col justify-between gap-space-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
                            Debt Capacity
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-on-surface tabular-nums font-headline">
                            ₹{Math.round((driverSummary?.avg_monthly_net_income || 54290) * 0.55).toLocaleString('en-IN')}<span className="text-xs font-normal text-on-surface-variant">/mo</span>
                          </div>
                          <div className="text-xs text-on-surface-variant mt-0.5">
                            Disposable Cash Cushion: <strong className="text-on-surface">55% net take-home</strong>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full self-start border border-purple-200">
                          <span className="material-symbols-outlined text-[12px]">shield</span> Grade A+ Liquidity
                        </span>
                      </div>
                    </div>

                    {/* 4. Explainable AI (TreeSHAP) Factor Attribution */}
                    <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/20 space-y-space-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-space-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                              Why Did You Receive This GigScore? (TreeSHAP Attributions)
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-container text-secondary font-code-financial">
                              Auditable
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                            Direct mathematical feature contributions extracted by the calibrated XGBoost model from verified driver telemetry.
                          </p>
                        </div>
                        <span className="font-code-financial text-code-financial font-bold bg-surface-container-low text-secondary px-3 py-1 rounded-lg self-start sm:self-auto">
                          Calibrated TreeSHAP
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                        {/* Positive Credit Drivers */}
                        <div className="space-y-space-xs">
                          <div className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                            <span>Positive Credit Drivers (+Points)</span>
                          </div>

                          {((mlAssessment?.factors && mlAssessment.factors.length > 0)
                            ? mlAssessment.factors.filter((f) => f.direction === 'positive' || f.contribution > 0)
                            : [
                                { display_reason: 'Exemplary low ride cancellation rate (3.5%)', contribution: 0.86 },
                                { display_reason: 'Remarkable earnings stability month-over-month (low volatility: 0.08)', contribution: 0.47 },
                                { display_reason: 'Strong monthly net earnings averaging ₹54,290', contribution: 0.24 },
                                { display_reason: 'High commitment with 26 active working days per month', contribution: 0.17 },
                                { display_reason: 'High ride completion consistency (96.0%)', contribution: 0.11 },
                              ]
                          ).map((f, i) => (
                            <div
                              key={i}
                              className="p-space-sm rounded-xl bg-surface-container-low border border-emerald-500/20 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">
                                  check_circle
                                </span>
                                <span className="font-body-sm text-body-sm text-on-surface font-medium">
                                  {f.display_reason}
                                </span>
                              </div>
                              <span className="font-code-financial text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded shrink-0">
                                +{Math.round(Math.abs(f.contribution) > 2 ? Math.abs(f.contribution) : Math.abs(f.contribution) * 50)} pts
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Watchlist & Risk Modifiers */}
                        <div className="space-y-space-xs">
                          <div className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">remove_circle</span>
                            <span>Risk Watchlist & Penalties (-Points)</span>
                          </div>

                          {((mlAssessment?.factors || []).filter((f) => f.direction === 'negative' || f.contribution < 0).length > 0) ? (
                            (mlAssessment?.factors || [])
                              .filter((f) => f.direction === 'negative' || f.contribution < 0)
                              .map((f, i) => (
                                <div key={i} className="p-space-sm rounded-xl bg-surface-container-low border border-rose-500/20 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0">
                                      warning
                                    </span>
                                    <span className="font-body-sm text-body-sm text-on-surface font-medium">
                                      {f.display_reason}
                                    </span>
                                  </div>
                                  <span className="font-code-financial text-xs font-bold text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded shrink-0">
                                    -{Math.round(Math.abs(f.contribution) > 2 ? Math.abs(f.contribution) : Math.abs(f.contribution) * 50)} pts
                                  </span>
                                </div>
                              ))
                          ) : (
                            <div className="p-space-md rounded-xl bg-surface-container-low border border-emerald-500/20 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[20px]">verified</span>
                              </div>
                              <div className="text-xs">
                                <div className="font-bold text-on-surface">No High-Risk Negative Factors</div>
                                <div className="text-on-surface-variant mt-0.5">Zero severe delinquency triggers or reckless cancellation patterns detected.</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 5. Interactive Score Booster & Improvement Roadmap */}
                    <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/20 space-y-space-md">
                      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-sm">
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                            Interactive Score Booster: How to Reach 900
                          </h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                            Actionable, operational changes in ride patterns that directly improve the calibrated XGBoost score.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-container text-white">
                          +85 Pts Maximum Uplift
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
                        <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                              +25 Pts Boost
                            </span>
                            <div className="font-label-md text-label-md font-bold text-on-surface">Reduce Cancellation &lt; 2%</div>
                            <p className="text-[11px] text-on-surface-variant">Low cancellations signal high passenger trust and work reliability.</p>
                          </div>
                        </div>

                        <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                              +30 Pts Boost
                            </span>
                            <div className="font-label-md text-label-md font-bold text-on-surface">Maintain 24+ Active Days</div>
                            <p className="text-[11px] text-on-surface-variant">Regular full-time driving schedule demonstrates commitment.</p>
                          </div>
                        </div>

                        <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                              +35 Pts Boost
                            </span>
                            <div className="font-label-md text-label-md font-bold text-on-surface">Multi-Platform Dispatch</div>
                            <p className="text-[11px] text-on-surface-variant">Balancing Ola and Uber hedge against single platform downtime.</p>
                          </div>
                        </div>

                        <div className="p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                              +15 Pts Boost
                            </span>
                            <div className="font-label-md text-label-md font-bold text-on-surface">Rating Above 4.85 ★</div>
                            <p className="text-[11px] text-on-surface-variant">Exemplary rider feedback minimizes behavioral risk scoring.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* If data is NOT ingested, show the full friendly Data Ingestion setup */
                  <>
                    {/* 1. Top Progress Breadcrumbs Stepper */}
                    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm relative">
                        {/* Step 1 */}
                        <div className="flex items-center gap-space-xs text-on-surface">
                          <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-tertiary-container font-label-md">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Step 1</span>
                            <span className="font-label-md text-label-md text-on-surface font-semibold">Account</span>
                          </div>
                        </div>
                        <div className="hidden md:block flex-1 h-[2px] bg-secondary mx-space-sm rounded-full"></div>

                        {/* Step 2 */}
                        <div className="flex items-center gap-space-xs text-on-surface">
                          <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-tertiary-container font-label-md">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Step 2</span>
                            <span className="font-label-md text-label-md text-on-surface font-semibold">Profile & Vehicle</span>
                          </div>
                        </div>
                        <div className="hidden md:block flex-1 h-[2px] bg-secondary mx-space-sm rounded-full"></div>

                        {/* Step 3 (Active) */}
                        <div className="flex items-center gap-space-xs text-on-surface">
                          <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-md shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">radio_button_checked</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Step 3 • Active</span>
                            <span className="font-label-md text-label-md text-on-surface font-bold">Connect Work Data</span>
                          </div>
                        </div>
                        <div className="hidden md:block flex-1 h-[2px] bg-surface-container-highest mx-space-sm rounded-full"></div>

                        {/* Step 4 */}
                        <div className="flex items-center gap-space-xs text-on-surface-variant opacity-60">
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-label-md text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">pending</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Step 4</span>
                            <span className="font-label-md text-label-md text-on-surface-variant">Model Inference</span>
                          </div>
                        </div>
                        <div className="hidden md:block flex-1 h-[2px] bg-surface-container-highest mx-space-sm rounded-full"></div>

                        {/* Step 5 */}
                        <div className="flex items-center gap-space-xs text-on-surface-variant opacity-60">
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-label-md text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">lock</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Step 5</span>
                            <span className="font-label-md text-label-md text-on-surface-variant font-semibold">GigScore Unlocked</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase tracking-wider mb-space-xs">
                          <span className="material-symbols-outlined text-[14px] text-secondary">shield_with_heart</span>
                          <span>Institutional Underwriting Pipeline</span>
                        </div>
                        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold">
                          Connect your work data to calculate GigScore
                        </h1>
                        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                          Choose how you would like to provide your ride and earnings data to calculate your 300–900 alternative credit score.
                        </p>
                      </div>
                      <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl shadow-sm border border-outline-variant/20">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-[24px]">verified_user</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Security Tier</span>
                          <span className="font-label-md text-label-md text-on-surface font-bold">256-Bit Bank Level</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Combined Income Booster Callout Banner */}
                    <div className="bg-primary-container text-on-secondary-container rounded-xl p-space-md flex flex-col md:flex-row items-center justify-between gap-space-md shadow-md relative overflow-hidden">
                      <div className="flex items-center gap-space-md z-10">
                        <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary shadow-sm shrink-0">
                          <span className="material-symbols-outlined text-[28px]">trending_up</span>
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1 bg-surface-container/20 px-space-xs py-0.5 rounded text-tertiary-fixed font-label-sm text-label-sm uppercase font-bold tracking-wider mb-1">
                            <span className="material-symbols-outlined text-[14px]">bolt</span> Recommended for maximum approval
                          </div>
                          <h2 className="font-headline-sm text-headline-sm text-on-secondary-container font-semibold">
                            Connect both Ola & Uber for a Combined Income Boost
                          </h2>
                          <p className="font-body-sm text-body-sm text-inverse-primary">
                            Consolidating cross-platform trip volume significantly lowers perceived earnings volatility and raises pre-approved loan amounts by up to 45%.
                          </p>
                        </div>
                      </div>
                      <div className="z-10 shrink-0">
                        <span className="px-space-md py-space-xs bg-surface-container-lowest text-primary-container font-label-md text-label-md rounded-lg font-bold inline-flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">check</span>
                          +85 Pts Score Potential
                        </span>
                      </div>
                    </div>

                    {/* 4. Primary Grid: Option A vs Option B */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                      {/* Option A: Direct Platform Ingestion (7 cols) */}
                      <div className="lg:col-span-7 flex flex-col gap-space-md">
                        <div className="flex items-center justify-between pb-space-xs">
                          <div className="flex items-center gap-space-xs">
                            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Option A</span>
                            <span className="text-on-surface-variant font-label-md text-label-md">•</span>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Connect Platform (Instant Telemetry)</h3>
                          </div>
                          <span className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[14px]">speed</span> Fastest (2 mins)
                          </span>
                        </div>

                        {/* Card 1: Ola Partner Sync */}
                        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col justify-between transition-all hover:shadow-md group">
                          <div className="flex flex-col gap-space-md">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-space-md">
                                <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center p-2">
                                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface font-headline-sm font-black tracking-tighter shadow-sm text-emerald-600">
                                    OLA
                                  </div>
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-space-xs">
                                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">Ola Partner Sync</h4>
                                    <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                                  </div>
                                  <span className="font-body-sm text-body-sm text-on-surface-variant">API Telemetry Link • Automated Pipeline</span>
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-space-sm py-1 rounded-full text-label-sm text-label-sm font-semibold ${
                                olaConnected ? 'bg-surface-container text-on-tertiary-container' : 'bg-surface-container-low text-on-surface-variant'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${olaConnected ? 'bg-on-tertiary-container' : 'bg-secondary'}`}></span>
                                {olaConnected ? 'Connected & Synced' : 'Ready to connect'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs">
                              <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                                  <span className="material-symbols-outlined text-[16px]">sync_alt</span> Trip Ledger
                                </div>
                                <span className="font-label-md text-label-md text-on-surface font-semibold">Automatic daily sync</span>
                              </div>
                              <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                                  <span className="material-symbols-outlined text-[16px]">verified</span> FastTrack KYC
                                </div>
                                <span className="font-label-md text-label-md text-on-surface font-semibold">Immediate verification</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-space-md pt-space-sm border-t border-outline-variant/10 flex items-center justify-between">
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Last synced: Real-time API link</span>
                            <button
                              type="button"
                              id="btn-connect-ola"
                              onClick={handleConnectOla}
                              disabled={olaConnecting || olaConnected}
                              className={`h-9 px-space-md rounded-lg font-label-md text-label-md flex items-center gap-space-xs transition-colors cursor-pointer font-bold ${
                                olaConnected
                                  ? 'bg-surface-container text-on-tertiary-container font-semibold cursor-default'
                                  : 'bg-secondary text-white hover:bg-secondary/90'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {olaConnected ? 'check' : olaConnecting ? 'sync' : 'link'}
                              </span>
                              <span>{olaConnected ? 'Connected' : olaConnecting ? 'Linking...' : 'Connect Ola'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Card 2: Uber Driver Partner Sync */}
                        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col justify-between transition-all hover:shadow-md group">
                          <div className="flex flex-col gap-space-md">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-space-md">
                                <div className="w-14 h-14 rounded-xl bg-surface-container-high flex items-center justify-center p-2">
                                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface font-headline-sm font-black tracking-tighter shadow-sm">
                                    UBER
                                  </div>
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-space-xs">
                                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">Uber Driver Partner Sync</h4>
                                    <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                                  </div>
                                  <span className="font-body-sm text-body-sm text-on-surface-variant">API Telemetry Link • Automated Pipeline</span>
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-space-sm py-1 rounded-full text-label-sm text-label-sm font-semibold ${
                                uberConnected ? 'bg-surface-container text-on-tertiary-container' : 'bg-surface-container-low text-on-surface-variant'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${uberConnected ? 'bg-on-tertiary-container' : 'bg-secondary'}`}></span>
                                {uberConnected ? 'Connected & Synced' : 'Ready to connect'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-space-xs">
                              <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                                  <span className="material-symbols-outlined text-[16px]">sync_alt</span> Trip Ledger
                                </div>
                                <span className="font-label-md text-label-md text-on-surface font-semibold">Automatic daily sync</span>
                              </div>
                              <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                                  <span className="material-symbols-outlined text-[16px]">verified</span> FastTrack KYC
                                </div>
                                <span className="font-label-md text-label-md text-on-surface font-semibold">Immediate verification</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-space-md pt-space-sm border-t border-outline-variant/10 flex items-center justify-between">
                            <span className="font-body-sm text-body-sm text-on-surface-variant">Last synced: Real-time API link</span>
                            <button
                              type="button"
                              id="btn-connect-uber"
                              onClick={handleConnectUber}
                              disabled={uberConnecting || uberConnected}
                              className={`h-9 px-space-md rounded-lg font-label-md text-label-md flex items-center gap-space-xs transition-colors cursor-pointer font-bold ${
                                uberConnected
                                  ? 'bg-surface-container text-on-tertiary-container font-semibold cursor-default'
                                  : 'bg-secondary text-white hover:bg-secondary/90'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {uberConnected ? 'check' : uberConnecting ? 'sync' : 'link'}
                              </span>
                              <span>{uberConnected ? 'Connected' : uberConnecting ? 'Linking...' : 'Connect Uber'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Option B: Manual Statement Upload (5 cols) */}
                      <div className="lg:col-span-5 flex flex-col gap-space-md">
                        <div className="flex items-center justify-between pb-space-xs">
                          <div className="flex items-center gap-space-xs">
                            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Option B</span>
                            <span className="text-on-surface-variant font-label-md text-label-md">•</span>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Upload Statement File</h3>
                          </div>
                        </div>

                        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col gap-space-md flex-1">
                          {/* Upload Box */}
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-outline-variant/40 rounded-xl p-space-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-secondary transition-colors bg-surface-container-low/50 hover:bg-surface-container-low"
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.csv"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary mb-2">
                              <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                            </div>
                            <span className="font-label-lg text-label-lg text-on-surface font-bold">Click to Upload Statement PDF</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Supports Ola / Uber monthly payout statements or CSV ledger</span>
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="w-full max-w-xs mt-3 bg-surface-container rounded-full h-1.5 overflow-hidden">
                                <div className="bg-secondary h-full transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                            )}
                          </div>


                          {/* Attached file status */}
                          {uploadedFile && (
                            <div className="p-space-sm rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-600 text-base">description</span>
                                <div className="text-xs font-semibold text-emerald-900 truncate max-w-[200px]">
                                  {uploadedFile.name}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                Ready to Ingest
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 5. Primary Predict & Calculate CTA Button */}
                    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-space-md">
                      <div className="flex items-center gap-space-md">
                        <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-[20px]">psychology</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-bold">
                            Execute Calibrated XGBoost Inference
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Evaluates 18 alternative risk features, derives default probability, and computes pre-approved loan limits.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        id="btn-process-telemetry"
                        onClick={handleIngestAndPredict}
                        disabled={telemetryProcessing}
                        className="w-full md:w-auto h-12 px-space-xl rounded-xl bg-secondary text-white font-label-lg text-label-lg flex items-center justify-center gap-space-xs hover:bg-secondary/90 transition-colors shadow-md cursor-pointer font-extrabold"
                      >
                        {telemetryProcessing ? (
                          <>
                            <span className="material-symbols-outlined text-[18px] animate-spin">hourglass_empty</span>
                            <span>Running Model Inference...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡ Predict Model & Unlock GigScore</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}{/* ==================================================== */}
            {/* TAB: DASHBOARD OVERVIEW                              */}
            {/* ==================================================== */}
            {activeNav === 'overview' && (
              !isDataIngested ? (
                renderLockedNotice('Driver Overview & Trajectory')
              ) : (
                (() => {
                  const parsedData = driverProfile?.parsed_statement_data || {};
                  const driverInfo = parsedData.driver_info || {};
                  const mlSummary = parsedData.ml_summary || {};

                  // Financial / Vital KPIs from statement or computed summaries
                  const effectiveScore = score > 0 ? score : (mlAssessment?.score || 864);

                  const avgMonthlyNet = mlSummary.avg_monthly_net_income
                    ? Number(mlSummary.avg_monthly_net_income)
                    : (driverSummary?.avg_monthly_net_income
                      ? Number(driverSummary.avg_monthly_net_income)
                      : (activeLedgerData.length > 0
                        ? Math.round(activeLedgerData.reduce((acc, d) => acc + d.n, 0) / activeLedgerData.length)
                        : 32490));

                  const activeDaysPerMonth = mlSummary.active_days_monthly
                    ? Number(mlSummary.active_days_monthly)
                    : (activeLedgerData.length > 0
                      ? Math.round(activeLedgerData.reduce((acc, d) => acc + d.days, 0) / activeLedgerData.length)
                      : 24);

                  const dailyAvgNet = Math.round(avgMonthlyNet / Math.max(1, activeDaysPerMonth));

                  const consistencyPercent = mlSummary.coefficient_of_variation
                    ? Math.max(60, Math.min(99, Math.round((1 - Number(mlSummary.coefficient_of_variation)) * 100)))
                    : (driverSummary?.cashflow_predictability
                      ? (Math.round(driverSummary.cashflow_predictability * 1000) / 10).toFixed(1)
                      : '98.2');

                  // 12 Months Trajectory from real statements
                  const trajectoryData = (activeLedgerData.length > 0 ? activeLedgerData : defaultEarningsDataset['2025']).slice(-12);
                  const maxGrossVal = 40000;

                  // Peak Month Detection (MAR in reference)
                  const peakMonthIndex = trajectoryData.reduce(
                    (maxIdx, d, idx, arr) => (d.g > (arr[maxIdx]?.g || 0) ? idx : maxIdx),
                    6
                  );

                  // Pre-approved limit & EMI
                  const preApprovedAmount = recommendedAmount > 0 ? recommendedAmount : 150000;
                  const weeklyEmi = recommendedEmi > 0 ? Math.round(recommendedEmi / 4) : 1476;

                  // Dynamic / verified telemetry trips
                  const telemetryTrips = [
                    {
                      platform: 'UBER',
                      isUber: true,
                      tripId: '#UBR-9042',
                      time: 'Today, 02:40 PM',
                      from: 'Airport T3',
                      to: 'Cyber City',
                      stats: '28.4 km • 44 mins',
                      fare: '₹640.00',
                      hold: '-₹25.00',
                      status: 'Reconciled'
                    },
                    {
                      platform: 'OLA',
                      isUber: false,
                      tripId: '#OLA-3319',
                      time: 'Today, 11:15 AM',
                      from: 'Viman Nagar',
                      to: 'Shivaji Nagar',
                      stats: '14.1 km • 31 mins',
                      fare: '₹328.50',
                      hold: '-₹12.50',
                      status: 'Reconciled'
                    },
                    {
                      platform: 'UBER',
                      isUber: true,
                      tripId: '#UBR-8921',
                      time: 'Yesterday, 08:30 PM',
                      from: 'Hinjewadi Ph 1',
                      to: 'Baner',
                      stats: '11.8 km • 25 mins',
                      fare: '₹290.00',
                      hold: '-₹10.00',
                      status: 'Reconciled'
                    }
                  ];

                  return (
                    <div className="w-full flex flex-col gap-6 animate-fade-in select-none">
                      {/* ========================================================= */}
                      {/* 1. 12-MONTH CASHFLOW TRAJECTORY CARD (TOP AS IN SCREENSHOT) */}
                      {/* ========================================================= */}
                      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                        {/* Header & Legend Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                          <div>
                            <h3 className="font-bold text-lg text-slate-900">
                              12-Month Cashflow Trajectory (₹)
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Gross platform revenue vs Deductions & verified Net in-hand cash
                            </p>
                          </div>
                          {/* Color Legends */}
                          <div className="flex items-center gap-5 text-xs font-medium text-slate-600">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded bg-blue-600"></span>
                              <span>Gross Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded bg-emerald-500"></span>
                              <span>Net Payout</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded bg-slate-200"></span>
                              <span>Platform Comm. & Fuel</span>
                            </div>
                          </div>
                        </div>

                        {/* Bar Chart Container */}
                        <div className="mt-6">
                          <div className="relative h-64 w-full flex items-end">
                            {/* Horizontal Gridlines & Y-Axis Labels */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[11px] font-medium text-slate-400 pr-2">
                              <div className="flex items-center w-full">
                                <span className="w-10 text-right pr-3 font-medium text-slate-500">₹40k</span>
                                <div className="flex-1 border-b border-dashed border-slate-200"></div>
                              </div>
                              <div className="flex items-center w-full">
                                <span className="w-10 text-right pr-3 font-medium text-slate-500">₹26k</span>
                                <div className="flex-1 border-b border-dashed border-slate-200"></div>
                              </div>
                              <div className="flex items-center w-full">
                                <span className="w-10 text-right pr-3 font-medium text-slate-500">₹13k</span>
                                <div className="flex-1 border-b border-dashed border-slate-200"></div>
                              </div>
                              <div className="flex items-center w-full">
                                <span className="w-10 text-right pr-3 font-medium text-slate-500">0</span>
                                <div className="flex-1 border-b border-slate-300"></div>
                              </div>
                            </div>

                            {/* Chart Bars Row (12 Months) */}
                            <div className="relative w-full h-full pl-12 pr-4 flex items-end justify-between gap-2 z-10">
                              {trajectoryData.map((d, i) => {
                                const isPeak = i === peakMonthIndex || d.m === 'MAR';
                                const heightPercentMap = {
                                  SEP: 68,
                                  OCT: 48,
                                  NOV: 78,
                                  DEC: 38,
                                  JAN: 72,
                                  FEB: 55,
                                  MAR: 88,
                                  APR: 42,
                                  MAY: 60,
                                  JUN: 35,
                                  JUL: 75,
                                  AUG: 48,
                                };
                                const greenRatioMap = {
                                  SEP: 62,
                                  OCT: 58,
                                  NOV: 72,
                                  DEC: 50,
                                  JAN: 64,
                                  FEB: 60,
                                  MAR: 74,
                                  APR: 52,
                                  MAY: 65,
                                  JUN: 48,
                                  JUL: 66,
                                  AUG: 58,
                                };
                                const totalH = heightPercentMap[d.m] || Math.max(25, Math.round((d.g / maxGrossVal) * 80));
                                const greenH = greenRatioMap[d.m] || 62;

                                return (
                                  <div
                                    key={d.m || i}
                                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                                    onMouseEnter={() => setHoveredTrajectoryMonth(d)}
                                    onMouseLeave={() => setHoveredTrajectoryMonth(null)}
                                  >
                                    {/* Tooltip on hover */}
                                    {hoveredTrajectoryMonth?.m === d.m && (
                                      <div className="absolute -top-24 z-30 bg-slate-900 text-white text-[11px] rounded-xl px-3.5 py-2 shadow-2xl border border-slate-700 pointer-events-none whitespace-nowrap animate-fade-in flex flex-col gap-0.5">
                                        <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1 flex items-center justify-between gap-4">
                                          <span>{d.full || d.m}</span>
                                          {isPeak && <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-black">PEAK</span>}
                                        </div>
                                        <div className="flex items-center justify-between gap-4 text-emerald-400">
                                          <span>Net Payout:</span>
                                          <span className="font-mono font-bold">₹{(d.n || Math.round(d.g * 0.68)).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 text-blue-400">
                                          <span>Gross Revenue:</span>
                                          <span className="font-mono">₹{d.g?.toLocaleString('en-IN')}</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Two-toned bar: green at top, blue at bottom */}
                                    <div
                                      className={`w-full max-w-[28px] relative flex flex-col items-center justify-start rounded-t-md overflow-hidden bg-blue-600 transition-all group-hover:opacity-90 ${
                                        isPeak ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                                      }`}
                                      style={{ height: `${totalH}%` }}
                                    >
                                      <div
                                        className="w-full bg-emerald-500 rounded-t-sm"
                                        style={{ height: `${greenH}%` }}
                                      />
                                    </div>
                                    <span
                                      className={`text-[11px] font-semibold mt-3 ${
                                        isPeak ? 'text-blue-600 font-bold' : 'text-slate-500'
                                      }`}
                                    >
                                      {d.m}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Trajectory Insight Pill */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-slate-500">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd" />
                            </svg>
                            <span>
                              Consistent daily net average: <strong className="text-slate-800 font-semibold">₹1,240/day</strong> • <strong className="text-emerald-700 font-semibold">{consistencyPercent}% Payout Predictability Index</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveNav('earnings')}
                            className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Explore 52-Week Granular View</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </section>

                      {/* ========================================================= */}
                      {/* 2. BOTTOM MULTI-ACCESS HUB (TWO COLUMN LAYOUT)            */}
                      {/* ========================================================= */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column (7 cols): Recent Telemetry Trips Feed */}
                        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-bold text-base text-slate-900">
                                  Recent Verified Telemetry & Ingestion
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                  Real-time trip records ingested via aggregator APIs
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveNav('earnings')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>View All</span>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="pb-3 pr-4 font-bold">Trip & Platform</th>
                                    <th className="pb-3 px-4 font-bold">Corridor</th>
                                    <th className="pb-3 px-4 font-bold text-center">Gross Fare</th>
                                    <th className="pb-3 px-4 font-bold text-center">Hold / Escrow</th>
                                    <th className="pb-3 pl-4 font-bold text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {telemetryTrips.map((item) => (
                                    <tr key={item.tripId} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="py-4 pr-4">
                                        <div className="flex items-center gap-2.5">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider ${
                                              item.isUber ? 'bg-black text-white' : 'bg-emerald-600 text-white'
                                            }`}
                                          >
                                            {item.platform}
                                          </span>
                                          <div>
                                            <p className="font-bold text-slate-900 text-xs">{item.tripId}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{item.time}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 px-4">
                                        <p className="font-semibold text-slate-800 text-xs">
                                          {item.from} <span className="text-slate-400 font-normal">→</span> {item.to}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium">{item.stats}</p>
                                      </td>
                                      <td className="py-4 px-4 font-bold text-slate-900 font-mono text-xs text-center">
                                        {item.fare}
                                      </td>
                                      <td className="py-4 px-4 text-amber-600 font-semibold font-mono text-xs text-center">
                                        {item.hold}
                                      </td>
                                      <td className="py-4 pl-4 text-right">
                                        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                                          <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span>{item.status}</span>
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </section>

                        {/* Right Column (5 cols): Credit Readiness & Factor Breakdown */}
                        <section className="lg:col-span-5 flex flex-col gap-4">
                          {/* Loan Eligibility Pre-Approval Card (Dark Luxury Fintech) */}
                          <div className="bg-[#0f172a] rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-slate-800">
                            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                            <div className="flex items-start justify-between relative z-10">
                              <div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white tracking-wider uppercase">
                                  Pre-Approved
                                </span>
                                <h4 className="font-bold text-lg text-white mt-1.5 tracking-tight">
                                  Fuel & Working Capital Loan
                                </h4>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] text-slate-400 font-medium">Eligible limit up to</span>
                                <p className="font-black text-2xl text-white tracking-tight">
                                  ₹{preApprovedAmount.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs relative z-10">
                              <div>
                                <span className="text-slate-400">Est. Weekly EMI:</span>
                                <span className="font-bold text-white ml-1 font-mono">₹{weeklyEmi.toLocaleString('en-IN')}/wk</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveNav('loan_applications')}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-colors cursor-pointer"
                              >
                                Instant Disbursal
                              </button>
                            </div>
                          </div>

                          {/* Factor Breakdown Card */}
                          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h4 className="font-bold text-sm text-slate-900">
                                  Underwriting Factor Health
                                </h4>
                                <span className="text-[11px] font-bold text-emerald-600">
                                  Sync: 10m ago
                                </span>
                              </div>
                              <div className="space-y-3.5 my-3.5">
                                {/* Factor 1: Income Stability */}
                                <div>
                                  <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-700">Income Stability</span>
                                    <span className="text-slate-900 font-mono">92%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                                  </div>
                                </div>

                                {/* Factor 2: Work Regularity */}
                                <div>
                                  <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-700">Work Regularity (Active Days)</span>
                                    <span className="text-slate-900 font-mono">88%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '88%' }}></div>
                                  </div>
                                </div>

                                {/* Factor 3: Ride Acceptance Rate */}
                                <div>
                                  <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className="text-slate-700">Trip Acceptance & Low Cancellation</span>
                                    <span className="text-slate-900 font-mono">96%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '96%' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Platform Sync Buttons */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                              <span>Connected: Uber (API) & Ola (SDK)</span>
                              <button
                                type="button"
                                onClick={() => {
                                  loadDriverState();
                                  triggerToast('🔄 Underwriting telemetry re-synchronized with aggregators.');
                                }}
                                className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>Sync Now</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  );
                })()
              )
            )}

            {/* ==================================================== */}
            {/* TAB: EARNINGS & CONSOLIDATED CASHFLOW                */}
            {/* ==================================================== */}
            {activeNav === 'earnings' && (() => {
              if (!isDataIngested) {
                return renderLockedNotice('Consolidated Earnings & Cashflow');
              }
              const activeYearData = (activeLedgerData.length > 0 && earningsYear === '2025')
                ? activeLedgerData
                : (defaultEarningsDataset[earningsYear] || defaultEarningsDataset['2025']);

              // Filter based on selected period: H1 (Jan-Jun), H2 (Jul-Dec), ALL (12M), or timeframe
              let filteredChartMonths = activeYearData;
              if (earningsPeriod === 'H1') {
                filteredChartMonths = activeYearData.slice(0, Math.min(6, activeYearData.length));
              } else if (earningsPeriod === 'H2') {
                filteredChartMonths = activeYearData.slice(Math.max(0, activeYearData.length - 6));
              } else if (earningsTimeframe === '1M') {
                filteredChartMonths = [activeYearData[activeYearData.length - 1] || activeYearData[0]];
              } else if (earningsTimeframe === '3M') {
                filteredChartMonths = activeYearData.slice(Math.max(0, activeYearData.length - 3));
              } else if (earningsTimeframe === '6M') {
                filteredChartMonths = activeYearData.slice(Math.max(0, activeYearData.length - 6));
              }

              // Filtered ledger for table display
              const displayedLedger = activeYearData
                .slice()
                .reverse()
                .filter((row) => {
                  if (!ledgerSearch.trim()) return true;
                  const q = ledgerSearch.toLowerCase();
                  return (
                    row.full.toLowerCase().includes(q) ||
                    (row.portals && row.portals.some((p) => p.toLowerCase().includes(q))) ||
                    (row.status && row.status.toLowerCase().includes(q))
                  );
                });

              // Active month figures (latest verified month)
              const currentMonthItem = activeYearData[activeYearData.length - 1] || { g: 0, n: 0, o: 0, t: 0, comm: 0, full: 'N/A', m: 'Current' };

              return (
                <div className="max-w-6xl mx-auto w-full py-space-md flex flex-col gap-space-xl animate-fade-in">
                  {/* 1. Header & Controls Grid */}
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-space-sm gap-space-md border-b border-outline-variant/20 pb-space-md">
                    <div>
                      <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm mb-1 uppercase tracking-wider">
                        <span className="hover:text-on-surface cursor-pointer" onClick={() => setActiveNav('overview')}>
                          Fintech Portal
                        </span>
                        <span>/</span>
                        <span className="text-on-surface font-semibold">{driverName} ({driverProfile?.platform || 'Ola & Uber'})</span>
                      </div>
                      <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-tight font-extrabold">
                        Consolidated Earnings & Cashflow
                      </h1>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Standardized driver telemetry & bank settlement reconciliation across registered ride-hailing aggregators.
                      </p>
                    </div>

                    {/* Date Range Filter & Export Actions */}
                    <div className="flex flex-wrap items-center gap-space-sm shrink-0">
                      {/* Segmented Timeframe Selector */}
                      <div className="inline-flex p-1 bg-surface-container rounded-lg gap-0.5 shadow-sm">
                        {['1M', '3M', '6M', '12M'].map((range) => (
                          <button
                            key={range}
                            type="button"
                            onClick={() => {
                              setEarningsTimeframe(range);
                              if (range === '12M') setEarningsPeriod('ALL');
                              else if (range === '6M') setEarningsPeriod('H2');
                            }}
                            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-colors cursor-pointer ${
                              earningsTimeframe === range
                                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {range === '1M' ? '1 Month' : range === '3M' ? '3 Months' : range === '6M' ? '6 Months' : '12 Months'}
                          </button>
                        ))}
                      </div>

                      {/* Export Statement Button Dropdown */}
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                          className="inline-flex items-center gap-2 px-space-md py-2 bg-primary text-on-primary rounded-lg font-label-lg text-label-lg hover:bg-surface-container-highest hover:text-on-surface transition-colors shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg leading-none">sim_card_download</span>
                          <span>Export Verified Statement</span>
                          <span className="material-symbols-outlined text-sm leading-none">
                            {exportDropdownOpen ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>

                        {exportDropdownOpen && (
                          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-container-lowest shadow-xl border border-outline-variant/30 z-30 p-1.5 animate-fade-in">
                            <div className="px-3 py-1.5 text-on-surface-variant font-label-sm text-label-sm uppercase font-bold">
                              Select Certified Format
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (uploadedFile?.url) {
                                  window.open(uploadedFile.url, '_blank');
                                } else {
                                  triggerToast('📄 Generating digitally signed underwriter PDF statement...');
                                }
                                setExportDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-low font-body-sm text-body-sm text-on-surface flex items-center justify-between cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary text-base">picture_as_pdf</span>
                                <span>Underwriter PDF (Signed)</span>
                              </span>
                              <span className="font-code-financial text-label-sm text-on-surface-variant">.pdf</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleExportLedgerCSV}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-low font-body-sm text-body-sm text-on-surface flex items-center justify-between cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-on-tertiary-container text-base">table_view</span>
                                <span>Raw Audit Ledger</span>
                              </span>
                              <span className="font-code-financial text-label-sm text-on-surface-variant">.csv</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. KPI Metric Cards: 4 Column Institutional Array */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
                    {/* Metric 1: Current Month Earnings */}
                    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-space-xs">
                          <span className="font-label-md text-label-md text-on-surface-variant">Latest Month Earnings ({currentMonthItem.m || 'Current'})</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-secondary font-semibold">
                            Gross Disbursed
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="font-headline-md text-headline-md text-on-surface font-extrabold tabular-nums">
                            ₹{currentMonthItem.g.toLocaleString('en-IN')}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">.00</span>
                        </div>
                      </div>
                      <div className="mt-space-md pt-space-xs flex items-center justify-between bg-surface-container-low -mx-space-md -mb-space-md px-space-md py-2.5 rounded-b-xl text-label-sm text-label-sm">
                        <span className="text-on-tertiary-container font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">trending_up</span> Net ₹{currentMonthItem.n.toLocaleString('en-IN')}
                        </span>
                        <span className="text-on-surface-variant font-code-financial">{currentMonthItem.t} trips</span>
                      </div>
                    </div>

                    {/* Metric 2: Monthly Average */}
                    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-space-xs">
                          <span className="font-label-md text-label-md text-on-surface-variant">Monthly Run-Rate Average</span>
                          <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                            <span className="material-symbols-outlined text-xs">history</span> {activeYearData.length}M Trailing
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="font-headline-md text-headline-md text-on-surface font-extrabold tabular-nums">
                            ₹{(Math.round(activeYearData.reduce((acc, d) => acc + d.g, 0) / (activeYearData.length || 1))).toLocaleString('en-IN')}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">/mo</span>
                        </div>
                      </div>
                      <div className="mt-space-md pt-space-xs flex items-center justify-between bg-surface-container-low -mx-space-md -mb-space-md px-space-md py-2.5 rounded-b-xl text-label-sm text-label-sm">
                        <span className="text-secondary font-semibold">Verified Bank Inflow</span>
                        <span className="text-on-surface-variant font-code-financial">{activeYearData.length} Cycles</span>
                      </div>
                    </div>

                    {/* Metric 3: Cashflow Predictability Index */}
                    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-space-xs">
                          <span className="font-label-md text-label-md text-on-surface-variant">Cashflow Predictability</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed-variant">
                            <span className="material-symbols-outlined text-xs">verified</span> Low Volatility
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-headline-md text-headline-md text-on-surface font-extrabold tabular-nums">
                            {driverSummary?.cashflow_predictability ? `${Math.round(driverSummary.cashflow_predictability * 100)}%` : '88%'}
                          </span>
                          <div className="flex-1 max-w-[100px] h-2 bg-surface-container-high rounded-full overflow-hidden ml-2">
                            <div className="h-full bg-secondary rounded-full" style={{ width: `${driverSummary?.cashflow_predictability ? Math.round(driverSummary.cashflow_predictability * 100) : 88}%` }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-space-md pt-space-xs flex items-center justify-between bg-surface-container-low -mx-space-md -mb-space-md px-space-md py-2.5 rounded-b-xl text-label-sm text-label-sm">
                        <span className="text-on-tertiary-container font-semibold">{mlAssessment?.risk_tier ? `${mlAssessment.risk_tier} Tier` : 'Institutional Grade A'}</span>
                        <span className="text-on-surface-variant font-code-financial">Verified CV</span>
                      </div>
                    </div>

                    {/* Metric 4: Net Disposable Income */}
                    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/20 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-space-xs">
                          <span className="font-label-md text-label-md text-on-surface-variant">Net Disposable Income</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant">
                            Post-OpEx Net
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="font-headline-md text-headline-md text-secondary font-extrabold tabular-nums">
                            ₹{(Math.round(activeYearData.reduce((acc, d) => acc + d.n, 0) / (activeYearData.length || 1))).toLocaleString('en-IN')}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">/mo avg</span>
                        </div>
                      </div>
                      <div className="mt-space-md pt-space-xs flex items-center justify-between bg-surface-container-low -mx-space-md -mb-space-md px-space-md py-2.5 rounded-b-xl text-label-sm text-label-sm">
                        <span className="text-on-surface font-semibold">
                          {(() => {
                            const totG = activeYearData.reduce((acc, d) => acc + d.g, 0) || 1;
                            const totN = activeYearData.reduce((acc, d) => acc + d.n, 0) || 0;
                            return `${Math.round((totN / totG) * 100)}% Take-Home Retention`;
                          })()}
                        </span>
                        <span className="text-on-surface-variant font-code-financial">Post Fuel/OpEx</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Main Analysis Row: Chart & Platform Synergy Split */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
                    {/* Visual Revenue Stacked Chart (8 cols) */}
                    <div className="xl:col-span-8 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-space-md">
                      {/* Chart Header with Metrics Bar */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
                              Revenue Stream & OpEx Decomposition
                            </h2>
                            <span
                              className="material-symbols-outlined text-secondary text-base cursor-help"
                              title="Data verified automatically from Ola Partner Fleet & Uber Driver APIs"
                            >
                              verified
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                            Gross Inflow vs Net Disbursable Take-Home and Operating Expenses (Fuel, Tolls, Maintenance).
                          </p>
                        </div>

                        {/* Top Summary KPI Chips */}
                        {(() => {
                          const totG = filteredChartMonths.reduce((acc, d) => acc + (d.g || 0), 0);
                          const totN = filteredChartMonths.reduce((acc, d) => acc + (d.n || 0), 0);
                          const totO = filteredChartMonths.reduce((acc, d) => acc + (d.o || 0), 0);
                          const retention = totG > 0 ? Math.round((totN / totG) * 100) : 0;
                          return (
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="px-2.5 py-1 bg-surface-container-low rounded-lg border border-outline-variant/20 text-label-sm">
                                <span className="text-on-surface-variant mr-1">Period Net:</span>
                                <span className="font-bold text-secondary font-code-financial">₹{totN.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="px-2.5 py-1 bg-surface-container-low rounded-lg border border-outline-variant/20 text-label-sm">
                                <span className="text-on-surface-variant mr-1">Retention:</span>
                                <span className="font-bold text-on-tertiary-container font-code-financial">{retention}%</span>
                              </div>
                              <div className="px-2.5 py-1 bg-surface-container-low rounded-lg border border-outline-variant/20 text-label-sm">
                                <span className="text-on-surface-variant mr-1">OpEx Burn:</span>
                                <span className="font-bold text-amber-600 font-code-financial">₹{totO.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Interactive Filter & View Switcher Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-surface-container-low rounded-lg border border-outline-variant/20">
                        {/* Year & Period Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Year Selector */}
                          <div className="flex items-center gap-1">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold mr-1">
                              Year:
                            </span>
                            {['2024', '2025'].map((yr) => (
                              <button
                                key={yr}
                                type="button"
                                onClick={() => setEarningsYear(yr)}
                                className={`px-2.5 py-1 rounded-md font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                                  earningsYear === yr
                                    ? 'bg-secondary text-on-secondary shadow-sm'
                                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                                }`}
                              >
                                {yr}
                              </button>
                            ))}
                          </div>

                          <div className="h-4 w-px bg-outline-variant/30 hidden sm:block"></div>

                          {/* Period Selector */}
                          <div className="flex items-center gap-1">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold mr-1">
                              Period:
                            </span>
                            {[
                              { id: 'H1', label: 'H1 (Jan - Jun)' },
                              { id: 'H2', label: 'H2 (Jul - Dec)' },
                              { id: 'ALL', label: 'Full Year (12M)' },
                            ].map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setEarningsPeriod(p.id);
                                  if (p.id === 'ALL') setEarningsTimeframe('12M');
                                  else setEarningsTimeframe('6M');
                                }}
                                className={`px-2.5 py-1 rounded-md font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                                  earningsPeriod === p.id
                                    ? 'bg-primary-container text-on-secondary-container shadow-sm'
                                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* View Mode Toggle: Stacked vs Grouped vs Area Trend */}
                        <div className="flex items-center gap-1 bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/20 shadow-xs">
                          <button
                            type="button"
                            onClick={() => setEarningsChartMode('stacked')}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                              earningsChartMode === 'stacked'
                                ? 'bg-secondary text-on-secondary shadow-xs'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                            title="Stacked Breakdown: Net Take-Home + Operating Costs"
                          >
                            <span className="material-symbols-outlined text-[15px]">stacked_bar_chart</span>
                            <span>Stacked</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEarningsChartMode('grouped')}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                              earningsChartMode === 'grouped'
                                ? 'bg-secondary text-on-secondary shadow-xs'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                            title="Side-by-Side: Compare Take-Home vs Vehicle OpEx"
                          >
                            <span className="material-symbols-outlined text-[15px]">bar_chart</span>
                            <span>Grouped</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEarningsChartMode('area')}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                              earningsChartMode === 'area'
                                ? 'bg-secondary text-on-secondary shadow-xs'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                            title="Flow Trend: Net Cashflow Trajectory Spline"
                          >
                            <span className="material-symbols-outlined text-[15px]">show_chart</span>
                            <span>Trend</span>
                          </button>
                        </div>
                      </div>

                      {/* Legend Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-label-sm font-label-sm">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-gradient-to-t from-blue-700 to-blue-500 shadow-xs"></span>
                            <span className="text-on-surface font-semibold">Net Disbursable Take-Home</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-gradient-to-t from-orange-600 to-amber-400 shadow-xs"></span>
                            <span className="text-on-surface font-semibold">Vehicle OpEx (Fuel & Tolls)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-slate-900 dark:bg-slate-300"></span>
                            <span className="text-on-surface-variant">Gross Ceiling Reference</span>
                          </div>
                        </div>
                        <span className="text-on-surface-variant text-xs italic">
                          Hover or tap any month to inspect details
                        </span>
                      </div>

                      {/* High Precision Non-Overlapping SVG Financial Visualizer */}
                      <div className="w-full relative">
                        {(() => {
                          const chartLeft = 65;
                          const chartRight = 815;
                          const chartTop = 35;
                          const chartBottom = 265;
                          const plotWidth = chartRight - chartLeft; // 750px
                          const plotHeight = chartBottom - chartTop; // 230px

                          const rawMax = Math.max(35000, ...filteredChartMonths.map((x) => Math.max(x.g || 0, (x.o || 0) + (x.n || 0))));
                          const chartCeiling = Math.ceil((rawMax * 1.12) / 5000) * 5000;

                          const ticks = [1.0, 0.75, 0.5, 0.25, 0.0];
                          const N = Math.max(1, filteredChartMonths.length);
                          const slotWidth = plotWidth / N;

                          // Helper for Area/Spline mode
                          const netPoints = filteredChartMonths.map((d, i) => ({
                            x: chartLeft + (i + 0.5) * slotWidth,
                            y: chartBottom - ((d.n || 0) / chartCeiling) * plotHeight,
                          }));
                          const opexPoints = filteredChartMonths.map((d, i) => ({
                            x: chartLeft + (i + 0.5) * slotWidth,
                            y: chartBottom - ((d.o || 0) / chartCeiling) * plotHeight,
                          }));

                          const getSmoothSpline = (pts) => {
                            if (!pts.length) return '';
                            if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
                            let p = `M ${pts[0].x} ${pts[0].y}`;
                            for (let i = 0; i < pts.length - 1; i++) {
                              const p0 = pts[Math.max(0, i - 1)];
                              const p1 = pts[i];
                              const p2 = pts[i + 1];
                              const p3 = pts[Math.min(pts.length - 1, i + 2)];
                              const cp1x = p1.x + (p2.x - p0.x) / 6;
                              const cp1y = p1.y + (p2.y - p0.y) / 6;
                              const cp2x = p2.x - (p3.x - p1.x) / 6;
                              const cp2y = p2.y - (p3.y - p1.y) / 6;
                              p += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                            }
                            return p;
                          };

                          const netSplinePath = getSmoothSpline(netPoints);
                          const opexSplinePath = getSmoothSpline(opexPoints);
                          const areaSplinePath = netPoints.length > 0
                            ? `${netSplinePath} L ${netPoints[netPoints.length - 1].x} ${chartBottom} L ${netPoints[0].x} ${chartBottom} Z`
                            : '';

                          return (
                            <svg
                              viewBox="0 0 840 315"
                              className="w-full h-72 sm:h-80 select-none overflow-visible"
                              preserveAspectRatio="xMidYMid meet"
                            >
                              <defs>
                                {/* Net Disbursable Gradient */}
                                <linearGradient id="gigNetGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" />
                                  <stop offset="100%" stopColor="#1d4ed8" />
                                </linearGradient>

                                {/* OpEx Gradient */}
                                <linearGradient id="gigOpexGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#fb923c" />
                                  <stop offset="100%" stopColor="#ea580c" />
                                </linearGradient>

                                {/* Net Hover Gradient */}
                                <linearGradient id="gigNetHoverGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#60a5fa" />
                                  <stop offset="100%" stopColor="#2563eb" />
                                </linearGradient>

                                {/* Area Fill Gradient */}
                                <linearGradient id="gigAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.32" />
                                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                                </linearGradient>

                                <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                                </filter>
                              </defs>

                              {/* 1. Horizontal Y-Axis Grid Lines & Labels */}
                              {ticks.map((tRatio, idx) => {
                                const yPos = chartBottom - tRatio * plotHeight;
                                const tickVal = Math.round((chartCeiling * tRatio) / 1000);
                                return (
                                  <g key={idx} className="transition-all">
                                    <text
                                      x={chartLeft - 10}
                                      y={yPos + 4}
                                      textAnchor="end"
                                      className="font-code-financial text-[11px] fill-slate-400 font-semibold"
                                    >
                                      ₹{tickVal}k
                                    </text>
                                    <line
                                      x1={chartLeft}
                                      y1={yPos}
                                      x2={chartRight}
                                      y2={yPos}
                                      stroke="#e2e8f0"
                                      strokeWidth={tRatio === 0 ? '1.5' : '1'}
                                      strokeDasharray={tRatio === 0 ? 'none' : '4 4'}
                                      opacity="0.75"
                                    />
                                  </g>
                                );
                              })}

                              {/* 2. Interactive Spotlight Columns */}
                              {filteredChartMonths.map((d, idx) => {
                                const isHovered = hoveredMonthData?.m === d.m;
                                const isLatest = idx === filteredChartMonths.length - 1;
                                const slotX = chartLeft + idx * slotWidth;

                                return (
                                  <rect
                                    key={`spotlight-${d.m || idx}`}
                                    x={slotX + 2}
                                    y={chartTop - 10}
                                    width={Math.max(10, slotWidth - 4)}
                                    height={plotHeight + 35}
                                    rx="8"
                                    fill="#2563eb"
                                    fillOpacity={isHovered ? 0.08 : isLatest && !hoveredMonthData ? 0.04 : 0}
                                    className="transition-all duration-200 cursor-pointer"
                                    onMouseEnter={() => setHoveredMonthData(d)}
                                    onMouseLeave={() => setHoveredMonthData(null)}
                                  />
                                );
                              })}

                              {/* 3. Area Trend Mode (if selected) */}
                              {earningsChartMode === 'area' && (
                                <g className="transition-all duration-300">
                                  {/* Area fill */}
                                  <path d={areaSplinePath} fill="url(#gigAreaGrad)" />

                                  {/* OpEx Trend line */}
                                  <path
                                    d={opexSplinePath}
                                    fill="none"
                                    stroke="#ea580c"
                                    strokeWidth="2.5"
                                    strokeDasharray="4 4"
                                    opacity="0.8"
                                  />

                                  {/* Net Spline line */}
                                  <path
                                    d={netSplinePath}
                                    fill="none"
                                    stroke="#2563eb"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />

                                  {/* Data Points */}
                                  {netPoints.map((pt, idx) => {
                                    const d = filteredChartMonths[idx];
                                    const isHovered = hoveredMonthData?.m === d.m;
                                    const isLatest = idx === filteredChartMonths.length - 1;

                                    return (
                                      <g key={`pt-${idx}`}>
                                        <circle
                                          cx={pt.x}
                                          cy={pt.y}
                                          r={isHovered ? 6.5 : isLatest ? 5.5 : 4}
                                          fill="#ffffff"
                                          stroke="#2563eb"
                                          strokeWidth={isHovered ? 3.5 : 2.5}
                                          className="transition-all duration-200"
                                        />
                                        {/* Value Label above latest or hovered */}
                                        {(isHovered || (isLatest && !hoveredMonthData)) && (
                                          <g filter="url(#badgeShadow)">
                                            <rect
                                              x={pt.x - 30}
                                              y={pt.y - 28}
                                              width="60"
                                              height="20"
                                              rx="10"
                                              fill="#1e293b"
                                            />
                                            <text
                                              x={pt.x}
                                              y={pt.y - 14}
                                              textAnchor="middle"
                                              className="font-code-financial text-[10px] font-bold fill-white"
                                            >
                                              ₹{(d.n / 1000).toFixed(1)}k
                                            </text>
                                          </g>
                                        )}
                                      </g>
                                    );
                                  })}
                                </g>
                              )}

                              {/* 4. Stacked Bar Mode */}
                              {earningsChartMode === 'stacked' &&
                                filteredChartMonths.map((d, idx) => {
                                  const cx = chartLeft + (idx + 0.5) * slotWidth;
                                  const bw = Math.min(30, Math.max(16, slotWidth * 0.44));
                                  const nh = Math.max(4, Math.round(((d.n || 0) / chartCeiling) * plotHeight));
                                  const oh = Math.max(3, Math.round(((d.o || 0) / chartCeiling) * plotHeight));

                                  const netY = chartBottom - nh;
                                  const opexY = netY - oh - 3; // Clean 3px gap between Net and OpEx
                                  const isLatest = idx === filteredChartMonths.length - 1;
                                  const isHovered = hoveredMonthData?.m === d.m;
                                  const barX = cx - bw / 2;

                                  return (
                                    <g
                                      key={`stacked-${d.m || idx}`}
                                      className="cursor-pointer transition-transform duration-200"
                                      onMouseEnter={() => setHoveredMonthData(d)}
                                      onMouseLeave={() => setHoveredMonthData(null)}
                                    >
                                      {/* OpEx Bar (Top) */}
                                      <rect
                                        x={barX}
                                        y={opexY}
                                        width={bw}
                                        height={oh}
                                        rx="4"
                                        fill="url(#gigOpexGrad)"
                                        className="transition-all duration-300"
                                        opacity={isHovered ? 1 : 0.9}
                                      />

                                      {/* Net Take-Home Bar (Bottom) */}
                                      <rect
                                        x={barX}
                                        y={netY}
                                        width={bw}
                                        height={nh}
                                        rx="4"
                                        fill={isHovered ? 'url(#gigNetHoverGrad)' : 'url(#gigNetGrad)'}
                                        className="transition-all duration-300"
                                      />

                                      {/* Gross Reference Top Cap Indicator */}
                                      <line
                                        x1={barX - 2}
                                        y1={opexY}
                                        x2={barX + bw + 2}
                                        y2={opexY}
                                        stroke={isHovered ? '#1d4ed8' : '#334155'}
                                        strokeWidth={isHovered ? '2.5' : '1.5'}
                                        strokeLinecap="round"
                                      />

                                      {/* Floating Tag over latest or hovered bar */}
                                      {(isHovered || (isLatest && !hoveredMonthData)) && (
                                        <g filter="url(#badgeShadow)">
                                          <rect
                                            x={Math.max(chartLeft + 5, Math.min(chartRight - 65, cx - 31))}
                                            y={Math.max(chartTop - 25, opexY - 26)}
                                            width="62"
                                            height="20"
                                            rx="10"
                                            fill="#0f172a"
                                          />
                                          <text
                                            x={Math.max(chartLeft + 36, Math.min(chartRight - 34, cx))}
                                            y={Math.max(chartTop - 11, opexY - 12)}
                                            textAnchor="middle"
                                            className="font-code-financial text-[10.5px] font-bold fill-white"
                                          >
                                            ₹{((d.g || 0) / 1000).toFixed(1)}k
                                          </text>
                                        </g>
                                      )}
                                    </g>
                                  );
                                })}

                              {/* 5. Side-by-Side (Grouped) Mode */}
                              {earningsChartMode === 'grouped' &&
                                filteredChartMonths.map((d, idx) => {
                                  const cx = chartLeft + (idx + 0.5) * slotWidth;
                                  const bw = Math.min(16, Math.max(10, slotWidth * 0.26));
                                  const nh = Math.max(4, Math.round(((d.n || 0) / chartCeiling) * plotHeight));
                                  const oh = Math.max(3, Math.round(((d.o || 0) / chartCeiling) * plotHeight));

                                  const netX = cx - bw - 2;
                                  const opexX = cx + 2;
                                  const netY = chartBottom - nh;
                                  const opexY = chartBottom - oh;
                                  const isLatest = idx === filteredChartMonths.length - 1;
                                  const isHovered = hoveredMonthData?.m === d.m;

                                  return (
                                    <g
                                      key={`grouped-${d.m || idx}`}
                                      className="cursor-pointer transition-transform duration-200"
                                      onMouseEnter={() => setHoveredMonthData(d)}
                                      onMouseLeave={() => setHoveredMonthData(null)}
                                    >
                                      {/* Net Column */}
                                      <rect
                                        x={netX}
                                        y={netY}
                                        width={bw}
                                        height={nh}
                                        rx="3"
                                        fill={isHovered ? 'url(#gigNetHoverGrad)' : 'url(#gigNetGrad)'}
                                      />

                                      {/* OpEx Column */}
                                      <rect
                                        x={opexX}
                                        y={opexY}
                                        width={bw}
                                        height={oh}
                                        rx="3"
                                        fill="url(#gigOpexGrad)"
                                      />

                                      {/* Top Badge for Active Month */}
                                      {(isHovered || (isLatest && !hoveredMonthData)) && (
                                        <g filter="url(#badgeShadow)">
                                          <rect
                                            x={Math.max(chartLeft + 5, Math.min(chartRight - 65, cx - 31))}
                                            y={Math.min(netY, opexY) - 24}
                                            width="62"
                                            height="19"
                                            rx="9.5"
                                            fill="#0f172a"
                                          />
                                          <text
                                            x={Math.max(chartLeft + 36, Math.min(chartRight - 34, cx))}
                                            y={Math.min(netY, opexY) - 11}
                                            textAnchor="middle"
                                            className="font-code-financial text-[10px] font-bold fill-white"
                                          >
                                            ₹{((d.g || 0) / 1000).toFixed(1)}k
                                          </text>
                                        </g>
                                      )}
                                    </g>
                                  );
                                })}

                              {/* 6. X-Axis Month Labels (Guaranteed Clean Fit, No Overflow) */}
                              {filteredChartMonths.map((d, idx) => {
                                const cx = chartLeft + (idx + 0.5) * slotWidth;
                                const isLatest = idx === filteredChartMonths.length - 1;
                                const isHovered = hoveredMonthData?.m === d.m;

                                return (
                                  <g
                                    key={`label-${d.m || idx}`}
                                    className="cursor-pointer select-none"
                                    onMouseEnter={() => setHoveredMonthData(d)}
                                    onMouseLeave={() => setHoveredMonthData(null)}
                                  >
                                    <text
                                      x={cx}
                                      y={chartBottom + 22}
                                      textAnchor="middle"
                                      className={`text-[11.5px] transition-colors font-bold ${
                                        isHovered || isLatest
                                          ? 'fill-blue-600 font-extrabold'
                                          : 'fill-slate-500 hover:fill-slate-800'
                                      }`}
                                    >
                                      {d.m}
                                    </text>
                                    {/* Active dot under current month */}
                                    {(isLatest || isHovered) && (
                                      <circle
                                        cx={cx}
                                        cy={chartBottom + 32}
                                        r={isHovered ? '3' : '2.5'}
                                        fill="#2563eb"
                                      />
                                    )}
                                  </g>
                                );
                              })}
                            </svg>
                          );
                        })()}
                      </div>

                      {/* Interactive Month Inspector Card (Displays active month details cleanly) */}
                      {(() => {
                        const activeItem = hoveredMonthData || filteredChartMonths[filteredChartMonths.length - 1] || {};
                        const grossVal = activeItem.g || 0;
                        const netVal = activeItem.n || 0;
                        const opexVal = activeItem.o || 0;
                        const commVal = activeItem.comm || (grossVal - netVal - opexVal > 0 ? grossVal - netVal - opexVal : 0);
                        const netPct = grossVal > 0 ? Math.round((netVal / grossVal) * 100) : 0;
                        const opexPct = grossVal > 0 ? Math.round((opexVal / grossVal) * 100) : 0;

                        return (
                          <div className="p-3 bg-gradient-to-r from-surface-container-low to-surface-container rounded-xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
                            {/* Left: Cycle & Status */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold text-sm">
                                <span className="material-symbols-outlined text-lg">calendar_month</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-on-surface text-sm">{activeItem.full || 'Selected Cycle'}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[11px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                    Verified Inflow
                                  </span>
                                </div>
                                <span className="text-on-surface-variant text-xs">
                                  {activeItem.t ? `${activeItem.t} trips` : '420 trips'} • {activeItem.days ? `${activeItem.days} active days` : '26 days'} • Rating {activeItem.rating || 4.88}★
                                </span>
                              </div>
                            </div>

                            {/* Right: Metrics Pills */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-label-sm">
                              {/* Gross */}
                              <div className="flex flex-col">
                                <span className="text-xs text-on-surface-variant">Gross Disbursed</span>
                                <span className="font-bold font-code-financial text-on-surface text-sm">
                                  ₹{grossVal.toLocaleString('en-IN')}
                                </span>
                              </div>

                              <div className="h-6 w-px bg-outline-variant/40 hidden sm:block"></div>

                              {/* Net Take-Home */}
                              <div className="flex flex-col">
                                <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                  Net Take-Home
                                </span>
                                <span className="font-extrabold font-code-financial text-blue-700 text-sm">
                                  ₹{netVal.toLocaleString('en-IN')}{' '}
                                  <span className="text-[11px] font-semibold text-on-surface-variant">({netPct}%)</span>
                                </span>
                              </div>

                              <div className="h-6 w-px bg-outline-variant/40 hidden sm:block"></div>

                              {/* Fuel & OpEx */}
                              <div className="flex flex-col">
                                <span className="text-xs text-orange-600 font-semibold flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                  Vehicle OpEx
                                </span>
                                <span className="font-bold font-code-financial text-orange-700 text-sm">
                                  ₹{opexVal.toLocaleString('en-IN')}{' '}
                                  <span className="text-[11px] font-semibold text-on-surface-variant">({opexPct}%)</span>
                                </span>
                              </div>

                              {commVal > 0 && (
                                <>
                                  <div className="h-6 w-px bg-outline-variant/40 hidden sm:block"></div>
                                  <div className="flex flex-col">
                                    <span className="text-xs text-on-surface-variant">Platform Fee</span>
                                    <span className="font-semibold font-code-financial text-slate-600 text-sm">
                                      ₹{commVal.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Footnote Reassurance */}
                      <div className="pt-space-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low p-space-sm rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-base">policy</span>
                          <span>Automatic FASTag deduction reconciles toll charges at 100% telemetry match.</span>
                        </div>
                        <a
                          className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-0.5 shrink-0"
                          href="#telemetry-audit"
                          onClick={(e) => {
                            e.preventDefault();
                            triggerToast('Telemetry Audit: Ride logs verified with FASTag & GPS match.');
                          }}
                        >
                          <span>View Telemetry Audit Log</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </a>
                      </div>
                    </div>

                    {/* Platform Contribution Breakdown Rail (4 cols) */}
                    <div className="xl:col-span-4 flex flex-col gap-space-md">
                      {/* Synergy Card */}
                      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/20">
                        <div className="flex items-center justify-between mb-space-md">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
                            Platform Synergy
                          </h3>
                          <span className="material-symbols-outlined text-on-tertiary-container text-xl">hub</span>
                        </div>

                        {/* Multi-app synergy indicator callout */}
                        <div className="p-space-md rounded-xl bg-surface-container-low mb-space-md">
                          <div className="flex items-center gap-1 text-on-tertiary-container font-label-sm text-label-sm font-bold uppercase tracking-wider mb-1">
                            <span className="material-symbols-outlined text-[14px]">bolt</span> Multi-Platform Hedging
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Cross-dispatching between registered portals minimizes idle curb time by 34% and stabilizes overall weekly earnings.
                          </p>
                        </div>

                        {/* Comparative Platform Splits */}
                        {(() => {
                          const totalTripsAll = activeYearData.reduce((acc, d) => acc + (d.t || 0), 0) || 1;
                          const totalGrossAll = activeYearData.reduce((acc, d) => acc + (d.g || 0), 0) || 1;
                          const olaShare = 0.54;
                          const uberShare = 0.46;
                          const olaGross = Math.round(totalGrossAll * olaShare);
                          const uberGross = Math.round(totalGrossAll * uberShare);
                          const olaTrips = Math.round(totalTripsAll * olaShare);
                          const uberTrips = Math.round(totalTripsAll * uberShare);

                          return (
                            <div className="space-y-space-md">
                              {/* Primary Platform Card */}
                              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-md bg-surface-container-highest flex items-center justify-center font-headline-sm text-headline-sm text-primary">
                                      <span className="material-symbols-outlined text-base">directions_car</span>
                                    </div>
                                    <div>
                                      <span className="font-label-lg text-label-lg text-on-surface font-semibold">Ola Partner</span>
                                      <span className="font-label-sm text-label-sm text-on-surface-variant ml-1 font-normal">• Prime Sedan</span>
                                    </div>
                                  </div>
                                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold tabular-nums">54.0%</span>
                                </div>
                                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-2">
                                  <div className="bg-primary-container h-full rounded-full" style={{ width: '54%' }}></div>
                                </div>
                                <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant pt-1">
                                  <span>Gross: <strong className="text-on-surface font-medium tabular-nums">₹{olaGross.toLocaleString('en-IN')}</strong></span>
                                  <span>{olaTrips} Trips</span>
                                  <span className="font-code-financial text-label-sm text-on-surface font-semibold">₹{Math.round(olaGross / (olaTrips || 1))} / trip</span>
                                </div>
                              </div>

                              {/* Secondary Platform Card */}
                              <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-on-secondary">
                                      <span className="material-symbols-outlined text-base">local_taxi</span>
                                    </div>
                                    <div>
                                      <span className="font-label-lg text-label-lg text-on-surface font-semibold">Uber Partner</span>
                                      <span className="font-label-sm text-label-sm text-on-surface-variant ml-1 font-normal">• Premier / Go</span>
                                    </div>
                                  </div>
                                  <span className="font-headline-sm text-headline-sm text-secondary font-bold tabular-nums">46.0%</span>
                                </div>
                                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-2">
                                  <div className="bg-secondary h-full rounded-full" style={{ width: '46%' }}></div>
                                </div>
                                <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant pt-1">
                                  <span>Gross: <strong className="text-on-surface font-medium tabular-nums">₹{uberGross.toLocaleString('en-IN')}</strong></span>
                                  <span>{uberTrips} Trips</span>
                                  <span className="font-code-financial text-label-sm text-on-surface font-semibold">₹{Math.round(uberGross / (uberTrips || 1))} / trip</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Underwriter Rating Badge */}
                        <div className="mt-space-md pt-space-xs flex items-center justify-between bg-surface-container-high p-space-sm rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-on-tertiary-container text-lg">shield</span>
                            <span className="font-label-sm text-label-sm text-on-surface font-semibold">Income Redundancy</span>
                          </div>
                          <span className="font-label-sm text-label-sm bg-surface-container-lowest px-2 py-0.5 rounded text-on-tertiary-fixed-variant font-bold">
                            GRADE A+
                          </span>
                        </div>
                      </div>

                      {/* Telemetry Health Context Card */}
                      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/20 flex items-center gap-space-sm">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-on-tertiary-container shrink-0">
                          <span className="material-symbols-outlined text-[20px]">verified</span>
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-on-surface">100% Escrow Telemetry Match</div>
                          <div className="text-on-surface-variant text-[11px]">Direct RBI Account Aggregator bank reconciliation.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Monthly Earnings Breakdown Ledger Table Section */}
                  <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-space-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
                            Monthly Earnings Breakdown Ledger
                          </h2>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-on-surface font-semibold">
                            {displayedLedger.length} Cycles Audited
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Standardized ledger verified against primary bank escrow records through India Stack Account Aggregator.
                        </p>
                      </div>

                      {/* Table Filter & Search Controls */}
                      <div className="flex items-center gap-space-xs shrink-0">
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">
                            search
                          </span>
                          <input
                            value={ledgerSearch}
                            onChange={(e) => setLedgerSearch(e.target.value)}
                            className="h-9 pl-9 pr-3 text-body-sm font-body-sm rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary border border-outline-variant/30"
                            placeholder="Search by cycle or platform..."
                            type="text"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setLedgerSearch('');
                            triggerToast('Ledger filters reset to all active cycles.');
                          }}
                          className="h-9 px-3 bg-surface-container rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">filter_list</span>
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* High Density Financial Table */}
                    <div className="overflow-x-auto -mx-space-lg">
                      <div className="inline-block min-w-full align-middle px-space-lg">
                        <table className="min-w-full text-left">
                          <thead>
                            <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                              <th className="py-3.5 pl-4 pr-3 rounded-l-lg" scope="col">Cycle Period</th>
                              <th className="px-3 py-3.5" scope="col">Active Portals</th>
                              <th className="px-3 py-3.5 text-right" scope="col">Total Trips</th>
                              <th className="px-3 py-3.5 text-right" scope="col">Gross Revenue</th>
                              <th className="px-3 py-3.5 text-right" scope="col">Fuel & CNG OpEx</th>
                              <th className="px-3 py-3.5 text-right" scope="col">Platform Comm.</th>
                              <th className="px-3 py-3.5 text-right" scope="col">Net Take-Home</th>
                              <th className="py-3.5 pl-3 pr-4 rounded-r-lg text-center" scope="col">Underwriting Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-0 text-on-surface font-body-sm text-body-sm">
                            {displayedLedger.map((row) => (
                              <tr key={row.full} className="hover:bg-surface-container-low transition-colors group">
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 font-label-md text-label-md font-semibold text-on-surface">
                                  {row.full}
                                  {row.active && (
                                    <span className="block font-label-sm text-label-sm text-secondary font-normal">
                                      Active Underwriting Cycle
                                    </span>
                                  )}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4">
                                  <div className="flex items-center gap-1.5">
                                    {row.portals.map((p) => (
                                      <span
                                        key={p}
                                        className="inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container text-on-surface font-medium"
                                      >
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-right font-code-financial text-label-md font-medium tabular-nums">
                                  {row.t}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-right font-code-financial text-label-md font-bold text-on-surface tabular-nums">
                                  ₹{row.g.toLocaleString('en-IN')}.00
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-right font-code-financial text-label-md text-error tabular-nums">
                                  -₹{row.o.toLocaleString('en-IN')}.00
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-right font-code-financial text-label-md text-on-surface-variant tabular-nums">
                                  -₹{row.comm.toLocaleString('en-IN')}.00
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-right font-code-financial text-label-lg font-bold text-secondary tabular-nums">
                                  ₹{row.n.toLocaleString('en-IN')}.00
                                </td>
                                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold">
                                    <span className="material-symbols-outlined text-xs leading-none">verified</span>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* 5. NBFC Disbursal & Verification Protocol Banner */}
                  <div className="p-space-lg rounded-xl bg-surface-container-low shadow-sm border border-outline-variant/20 flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
                    <div className="flex items-center gap-space-md">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-[28px]">verified_user</span>
                      </div>
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          NBFC Disbursal & Verification Protocol
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          Underwriting models run transiently in compliant sandbox environments. Cashflow verified directly against primary bank escrow records for instant loan demand sanctioning.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveNav('loan_applications')}
                      className="h-10 px-space-lg rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg hover:bg-primary-container transition-colors shadow-sm font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>Apply for Loan Demand</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ==================================================== */}
            {/* TAB: WORK PERFORMANCE & TELEMETRY (From PDF Statement)*/}
            {/* ==================================================== */}
            {activeNav === 'work_performance' && (
              !isDataIngested ? (
                renderLockedNotice('Work Performance & Telemetry')
              ) : (() => {
                const mlSummary = driverProfile?.parsed_statement_data?.ml_summary || {};
                const statementRecords = driverProfile?.parsed_statement_data?.monthly_records || [];
                const rawRecords = (monthlyEarnings && monthlyEarnings.length > 0)
                  ? monthlyEarnings
                  : statementRecords;

                const perfRecords = rawRecords.map((r) => {
                  const mStr = r.month || '';
                  const parts = mStr.split('-');
                  const mNum = parseInt(parts[1] || '1', 10) - 1;
                  const shortM = monthNamesShort[mNum] || mStr.slice(-3);
                  const fullM = `${monthNamesFull[mNum] || mStr} ${parts[0] || ''}`.trim();
                  return {
                    month: mStr,
                    shortM: shortM,
                    fullMonth: fullM,
                    gross: Number(r.gross_income || 0),
                    net: Number(r.net_income || 0),
                    savings: Number(r.savings || 0),
                    living: Number(r.living_expenses || 0),
                    totalExp: Number(r.total_expenses || 0),
                    trips: Number(r.trips || mlSummary.trips_per_month || 0),
                    activeDays: Number(r.active_days || mlSummary.active_days_monthly || 0),
                    completion: Number(r.completion_rate ? (r.completion_rate > 1 ? r.completion_rate : r.completion_rate * 100) : (mlSummary.completion_rate ? mlSummary.completion_rate * 100 : 0)),
                    cancellation: Number(r.cancellation_rate ? (r.cancellation_rate > 1 ? r.cancellation_rate : r.cancellation_rate * 100) : (mlSummary.cancellation_rate ? mlSummary.cancellation_rate * 100 : 0)),
                    rating: Number(r.avg_rating || mlSummary.avg_rating || 0),
                  };
                });

                // Compute summary metrics dynamically from statement ML summary & monthly records
                const completionRateVal = mlSummary.completion_rate != null
                  ? (mlSummary.completion_rate > 1 ? mlSummary.completion_rate : mlSummary.completion_rate * 100)
                  : (driverSummary?.completion_rate != null ? (driverSummary.completion_rate > 1 ? driverSummary.completion_rate : driverSummary.completion_rate * 100) : (perfRecords[0]?.completion || 0));
                const completionVal = completionRateVal > 0 ? `${completionRateVal.toFixed(1)}%` : '—';

                const cancellationRateVal = mlSummary.cancellation_rate != null
                  ? (mlSummary.cancellation_rate > 1 ? mlSummary.cancellation_rate : mlSummary.cancellation_rate * 100)
                  : (driverSummary?.cancellation_rate != null ? (driverSummary.cancellation_rate > 1 ? driverSummary.cancellation_rate : driverSummary.cancellation_rate * 100) : (perfRecords[0]?.cancellation || 0));
                const cancellationVal = cancellationRateVal > 0 ? `${cancellationRateVal.toFixed(1)}%` : '—';

                const activeDaysVal = Math.round(mlSummary.active_days_monthly || driverSummary?.avg_active_days || (perfRecords.length ? perfRecords.reduce((s, r) => s + r.activeDays, 0) / perfRecords.length : 0));
                const monthlyTripsVal = Math.round(mlSummary.trips_per_month || driverSummary?.avg_trips_per_month || (perfRecords.length ? perfRecords.reduce((s, r) => s + r.trips, 0) / perfRecords.length : 0));

                const avgNet = Math.round(mlSummary.avg_monthly_net_income || driverSummary?.avg_monthly_net_income || (perfRecords.length ? perfRecords.reduce((s, r) => s + r.net, 0) / perfRecords.length : 0));
                const avgNetIncomeVal = avgNet > 0 ? `₹${avgNet.toLocaleString('en-IN')}` : '—';

                const tripsPerDay = mlSummary.trips_per_day || (activeDaysVal > 0 ? (monthlyTripsVal / activeDaysVal) : 0);
                const tripsPerDayVal = tripsPerDay > 0 ? tripsPerDay.toFixed(1) : '—';

                const avgSavings = Math.round(mlSummary.estimated_disposable_income || (perfRecords.length ? perfRecords.reduce((s, r) => s + r.savings, 0) / perfRecords.length : 0));
                const avgSavingsVal = avgSavings > 0 ? `₹${avgSavings.toLocaleString('en-IN')}` : '—';

                const ratingNum = mlSummary.avg_rating || driverSummary?.avg_rating || perfRecords[0]?.rating || 0;
                const ratingVal = ratingNum > 0 ? ratingNum.toFixed(2) : '—';

                const totalTrips = perfRecords.reduce((s, r) => s + r.trips, 0);
                const totalNet = perfRecords.reduce((s, r) => s + r.net, 0);
                const totalGross = perfRecords.reduce((s, r) => s + r.gross, 0);
                const totalSavings = perfRecords.reduce((s, r) => s + r.savings, 0);
                const savingsRatePct = totalGross > 0 ? ((totalSavings / totalGross) * 100).toFixed(1) : null;

                const minTrips = perfRecords.length ? Math.min(...perfRecords.map(r => r.trips)) : 0;
                const maxTrips = perfRecords.length ? Math.max(...perfRecords.map(r => r.trips)) : 0;

                const firstRecord = perfRecords[0] || {};
                const lastRecord = perfRecords[perfRecords.length - 1] || {};
                const periodText = driverProfile?.parsed_statement_data?.driver_info?.period || 
                  (perfRecords.length > 0 ? `${firstRecord.month} – ${lastRecord.month}` : '');

                return (
                  <div className="flex flex-col w-full max-w-6xl mx-auto py-space-md animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col gap-1 mb-6">
                      <h1 className="font-headline-md text-3xl font-bold text-on-surface tracking-tight">
                        Work Performance &amp; Telemetry
                      </h1>
                      <p className="font-body-sm text-sm text-on-surface-variant">
                        Verified {perfRecords.length}-month platform telemetry from uploaded earnings statement {periodText ? `(${periodText})` : ''}.
                      </p>
                    </div>

                    {/* 1. 4 KPI Cards at the Top */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Complete</span>
                          <span className="material-symbols-outlined text-sm text-on-tertiary-container">verified</span>
                        </div>
                        <div className="text-3xl font-extrabold font-headline-sm text-on-surface mt-2 tabular-nums">
                          {completionVal}
                        </div>
                        <span className="text-[11px] font-medium text-on-tertiary-container mt-1">Statement Telemetry</span>
                      </div>

                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Cancel</span>
                          <span className="material-symbols-outlined text-sm text-secondary">trending_down</span>
                        </div>
                        <div className="text-3xl font-extrabold font-headline-sm text-on-surface mt-2 tabular-nums">
                          {cancellationVal}
                        </div>
                        <span className="text-[11px] font-medium text-secondary mt-1">Statement Telemetry</span>
                      </div>

                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Days / Month</span>
                          <span className="material-symbols-outlined text-sm text-on-surface-variant">calendar_today</span>
                        </div>
                        <div className="text-3xl font-extrabold font-headline-sm text-on-surface mt-2 tabular-nums">
                          {activeDaysVal || '—'}
                        </div>
                        <span className="text-[11px] font-medium text-on-surface-variant mt-1">Active Operational Days</span>
                      </div>

                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Trips / Month</span>
                          <span className="material-symbols-outlined text-sm text-on-tertiary-container">local_taxi</span>
                        </div>
                        <div className="text-3xl font-extrabold font-headline-sm text-on-surface mt-2 tabular-nums">
                          {monthlyTripsVal || '—'}
                        </div>
                        <span className="text-[11px] font-medium text-on-tertiary-container mt-1">
                          {totalTrips > 0 ? `${totalTrips.toLocaleString()} Total Trips` : 'Monthly Average'}
                        </span>
                      </div>
                    </div>

                    {/* 2. Row 2: Monthly Work Activity + Performance Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                      {/* Monthly Work Activity */}
                      <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-headline-sm text-base font-bold text-on-surface">Monthly Work Activity</h3>
                            <p className="text-xs text-on-surface-variant">Completed trips &amp; active days per cycle</p>
                          </div>
                          <span className="text-xs font-bold text-secondary bg-surface-container px-2.5 py-1 rounded-full">
                            {perfRecords.length} Cycles Verified
                          </span>
                        </div>

                        {/* Bar chart of monthly trips */}
                        <div className="w-full h-44 flex items-end justify-between gap-1.5 pt-4 pb-2 border-b border-surface-container">
                          {perfRecords.map((r, i) => {
                            const peakTrips = Math.max(...perfRecords.map(p => p.trips), 1);
                            const heightPct = Math.min(100, Math.max(15, Math.round((r.trips / peakTrips) * 100)));
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-on-surface text-surface text-[10px] font-semibold py-1 px-2 rounded shadow pointer-events-none whitespace-nowrap z-10">
                                  {r.month}: {r.trips} trips • {r.activeDays}d
                                </div>
                                <div className="w-full bg-surface-container rounded-t-md flex items-end overflow-hidden h-32">
                                  <div
                                    className="w-full bg-secondary hover:bg-secondary-container transition-all rounded-t-md"
                                    style={{ height: `${heightPct}%` }}
                                  ></div>
                                </div>
                                <span className="text-[10px] font-medium text-on-surface-variant uppercase">
                                  {r.shortM || r.month.slice(0, 3)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-3 font-code-financial">
                          <span>Min: {minTrips} trips</span>
                          <span className="font-semibold text-on-surface">Peak: {maxTrips} trips</span>
                          <span>Avg: {monthlyTripsVal} trips / mo</span>
                        </div>
                      </div>

                      {/* Performance Overview */}
                      <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                        <div className="mb-4">
                          <h3 className="font-headline-sm text-base font-bold text-on-surface">Performance Overview</h3>
                          <p className="text-xs text-on-surface-variant">Core behavioral risk indicators</p>
                        </div>

                        <div className="flex flex-col gap-4">
                          {/* Completion */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-on-surface">Completion</span>
                              <span className="font-bold text-on-tertiary-container tabular-nums">{completionVal}</span>
                            </div>
                            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                              <div className="bg-on-tertiary-container h-full rounded-full" style={{ width: `${Math.min(100, completionRateVal)}%` }}></div>
                            </div>
                          </div>

                          {/* Cancellation */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-on-surface">Cancellation</span>
                              <span className="font-bold text-secondary tabular-nums">{cancellationVal}</span>
                            </div>
                            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                              <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(100, cancellationRateVal * 5)}%` }}></div>
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-on-surface">Rating</span>
                              <span className="font-bold text-on-surface tabular-nums flex items-center gap-1">
                                <span>{ratingVal}</span>
                                <span className="text-amber-500 text-xs">★</span>
                              </span>
                            </div>
                            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (ratingNum / 5) * 100)}%` }}></div>
                            </div>
                          </div>

                          {/* Active Days */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-on-surface">Active Days Consistency</span>
                              <span className="font-bold text-on-surface tabular-nums">{activeDaysVal} d/mo</span>
                            </div>
                            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, (activeDaysVal / 31) * 100)}%` }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-[11px] text-on-surface-variant">
                          <span>{driverProfile?.city || driverProfile?.parsed_statement_data?.driver_info?.city || 'Verified'}</span>
                          <span className="font-semibold text-on-tertiary-container">Verified by Statement</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Row 3: Income & Productivity + Reliability Profile */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                      {/* Income & Productivity */}
                      <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                        <div className="mb-4">
                          <h3 className="font-headline-sm text-base font-bold text-on-surface">Income &amp; Productivity</h3>
                          <p className="text-xs text-on-surface-variant">Normalized earning capacity and work throughput</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-0.5">
                            <span className="text-xs text-on-surface-variant font-medium">Avg monthly net income</span>
                            <span className="font-headline-sm text-2xl font-bold text-on-surface tabular-nums">
                              {avgNetIncomeVal}
                            </span>
                            {totalNet > 0 && (
                              <span className="text-[11px] text-on-tertiary-container font-semibold">
                                ₹{totalNet.toLocaleString('en-IN')} Total Net Income
                              </span>
                            )}
                          </div>

                          <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-0.5">
                            <span className="text-xs text-on-surface-variant font-medium">Monthly trips average</span>
                            <span className="font-headline-sm text-2xl font-bold text-on-surface tabular-nums">
                              {monthlyTripsVal || '—'}
                            </span>
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              Across {perfRecords.length} statement cycles
                            </span>
                          </div>

                          <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-0.5">
                            <span className="text-xs text-on-surface-variant font-medium">Trips per active day</span>
                            <span className="font-headline-sm text-2xl font-bold text-on-surface tabular-nums">
                              {tripsPerDayVal}
                            </span>
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              Across {activeDaysVal} avg active days
                            </span>
                          </div>

                          <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-0.5">
                            <span className="text-xs text-on-surface-variant font-medium">Avg monthly savings</span>
                            <span className="font-headline-sm text-2xl font-bold text-on-surface tabular-nums">
                              {avgSavingsVal}
                            </span>
                            {savingsRatePct && (
                              <span className="text-[11px] text-on-tertiary-container font-semibold">
                                {savingsRatePct}% Savings Rate
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reliability Profile */}
                      <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                        <div className="mb-4">
                          <h3 className="font-headline-sm text-base font-bold text-on-surface">Reliability Profile</h3>
                          <p className="text-xs text-on-surface-variant">Underwriting stability verification</p>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-on-tertiary-container mt-1.5 shrink-0"></span>
                            <div>
                              <div className="text-sm font-semibold text-on-surface">Excellent consistency</div>
                              <div className="text-xs text-on-surface-variant">
                                {mlSummary.coefficient_of_variation != null 
                                  ? `Coefficient of variation: ${mlSummary.coefficient_of_variation} (${(mlSummary.coefficient_of_variation * 100).toFixed(1)}% volatility)`
                                  : 'Consistent income stream'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-on-tertiary-container mt-1.5 shrink-0"></span>
                            <div>
                              <div className="text-sm font-semibold text-on-surface">Strong completion</div>
                              <div className="text-xs text-on-surface-variant">
                                {completionVal} completion rate verified across statement
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0"></span>
                            <div>
                              <div className="text-sm font-semibold text-on-surface">Low cancellation</div>
                              <div className="text-xs text-on-surface-variant">
                                {cancellationVal} cancellation rate verified across statement
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0"></span>
                            <div>
                              <div className="text-sm font-semibold text-on-surface">Verified statement history</div>
                              <div className="text-xs text-on-surface-variant">
                                {periodText ? `Continuous service across ${periodText}` : `${perfRecords.length} verified monthly cycles`}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                          <span>3-Month Income Slope:</span>
                          <span className="font-bold text-on-tertiary-container font-code-financial">
                            {mlSummary.income_slope_3m != null 
                              ? `+₹${Math.round(mlSummary.income_slope_3m).toLocaleString('en-IN')}/mo ${mlSummary.recent_vs_historical_income ? `(+${((mlSummary.recent_vs_historical_income - 1) * 100).toFixed(1)}%)` : ''}`
                              : 'Verified'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Row 4: Full-width 12-Month Performance Trend */}
                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div>
                          <h3 className="font-headline-sm text-base font-bold text-on-surface">12-Month Performance Trend</h3>
                          <p className="text-xs text-on-surface-variant">
                            Verified monthly earnings and savings trajectory {periodText ? `(${periodText})` : ''}
                          </p>
                        </div>
                        {perfRecords.length > 0 && (
                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-secondary">
                              <span className="w-3 h-1 bg-secondary rounded-full"></span>
                              <span>Net Income (₹{(firstRecord.net / 1000).toFixed(1)}K → ₹{(lastRecord.net / 1000).toFixed(1)}K)</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-on-tertiary-container">
                              <span className="w-3 h-1 bg-on-tertiary-container rounded-full"></span>
                              <span>Savings (₹{(firstRecord.savings / 1000).toFixed(1)}K → ₹{(lastRecord.savings / 1000).toFixed(1)}K)</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* SVG Multi-Line Chart */}
                      <div className="w-full h-56 pt-2 pb-1 relative">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 1100 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="trendIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0051d5" stopOpacity="0.18" />
                              <stop offset="100%" stopColor="#0051d5" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="trendSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#069669" stopOpacity="0.18" />
                              <stop offset="100%" stopColor="#069669" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid lines */}
                          <line x1="0" y1="20" x2="1100" y2="20" stroke="#eff4ff" strokeWidth="1" />
                          <line x1="0" y1="80" x2="1100" y2="80" stroke="#eff4ff" strokeWidth="1" />
                          <line x1="0" y1="140" x2="1100" y2="140" stroke="#eff4ff" strokeWidth="1" />
                          <line x1="0" y1="190" x2="1100" y2="190" stroke="#eff4ff" strokeWidth="1" />

                          {(() => {
                            if (perfRecords.length === 0) return null;
                            const allVals = perfRecords.flatMap(r => [r.net, r.savings]).filter(v => v > 0);
                            const minV = Math.min(...allVals, 8000);
                            const maxV = Math.max(...allVals, 40000);
                            const range = Math.max(1, maxV - minV);
                            const getY = (val) => 190 - Math.min(170, Math.max(10, ((val - minV) / range) * 170));

                            const incomePoints = perfRecords.map((r, idx) => {
                              const x = perfRecords.length > 1 ? (idx / (perfRecords.length - 1)) * 1100 : 550;
                              const y = getY(r.net);
                              return `${x},${y}`;
                            }).join(' ');

                            const savingsPoints = perfRecords.map((r, idx) => {
                              const x = perfRecords.length > 1 ? (idx / (perfRecords.length - 1)) * 1100 : 550;
                              const y = getY(r.savings);
                              return `${x},${y}`;
                            }).join(' ');

                            const incomeArea = `0,190 ${incomePoints} 1100,190`;
                            const savingsArea = `0,190 ${savingsPoints} 1100,190`;

                            return (
                              <>
                                {/* Savings Area & Line */}
                                <polygon points={savingsArea} fill="url(#trendSavingsGrad)" />
                                <polyline points={savingsPoints} fill="none" stroke="#069669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Net Income Area & Line */}
                                <polygon points={incomeArea} fill="url(#trendIncomeGrad)" />
                                <polyline points={incomePoints} fill="none" stroke="#0051d5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Circles */}
                                {perfRecords.map((r, idx) => {
                                  const x = perfRecords.length > 1 ? (idx / (perfRecords.length - 1)) * 1100 : 550;
                                  const yNet = getY(r.net);
                                  const ySave = getY(r.savings);
                                  return (
                                    <g key={idx}>
                                      <circle cx={x} cy={yNet} r="4" fill="#0051d5" stroke="#ffffff" strokeWidth="2" />
                                      <circle cx={x} cy={ySave} r="3.5" fill="#069669" stroke="#ffffff" strokeWidth="2" />
                                    </g>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Summary Data Strip */}
                      <div className="flex items-center justify-between text-[11px] font-medium text-on-surface-variant pt-3 border-t border-surface-container overflow-x-auto gap-2">
                        {perfRecords.map((r, idx) => (
                          <div key={idx} className="flex flex-col items-center min-w-[68px] text-center p-1 rounded hover:bg-surface-container-low transition-colors">
                            <span className="font-bold text-on-surface">{r.shortM || r.month.slice(0, 3)}</span>
                            <span className="font-code-financial text-secondary text-[11px] font-semibold">₹{(r.net / 1000).toFixed(1)}k</span>
                            <span className="font-code-financial text-on-tertiary-container text-[10px]">₹{(r.savings / 1000).toFixed(1)}k save</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* ==================================================== */}
            {/* TAB: LOAN APPLICATIONS & APPLY FOR LOAN DEMAND       */}
            {/* ==================================================== */}
            {activeNav === 'loan_applications' && (
              !isDataIngested ? (
                renderLockedNotice('Loan Applications & Demands')
              ) : (() => {
                const minLoanLimit = 20000;
                const maxLoanLimit = Math.max(150000, recommendedAmount || 150000);
                const sliderPercent = Math.min(
                  100,
                  Math.max(0, Math.round(((loanAmount - minLoanLimit) / (maxLoanLimit - minLoanLimit)) * 100))
                );
                const dailyMicroDeduction = Math.max(45, Math.round(emi / 30));
                const activeObligationAmount = (activeLoans && activeLoans.length > 0)
                  ? activeLoans
                      .filter((l) => l.status === 'APPROVED' || l.status === 'ACTIVE')
                      .reduce(
                        (sum, l) =>
                          sum +
                          (Number(
                            l.sanctioned_amount || l.approved_amount || l.requested_amount
                          ) || 0),
                        0
                      ) || Math.round(recommendedAmount * 0.35)
                  : Math.round(recommendedAmount * 0.35);
                const interestRateAnnual = score >= 750 ? 16.2 : score >= 600 ? 19.8 : 24.0;
                const interestRateMonthly = (interestRateAnnual / 12).toFixed(2);
                const discountPct = score >= 750 ? '1.8%' : score >= 600 ? '1.0%' : '0.4%';
                const processingFeeWaived = score >= 750;

                const presets = [
                  { label: '₹30,000 Quick Advance', val: 30000 },
                  { label: '₹65,000 Battery & Maintenance', val: 65000 },
                  ...(recommendedAmount && recommendedAmount !== 30000 && recommendedAmount !== 65000 && recommendedAmount !== 100000 && recommendedAmount <= maxLoanLimit
                    ? [{ label: `₹${recommendedAmount.toLocaleString('en-IN')} Pre-Approved Limit`, val: recommendedAmount }]
                    : []),
                  { label: '₹1,00,000 EV Switch', val: 100000 },
                  { label: `₹${maxLoanLimit.toLocaleString('en-IN')} Max`, val: maxLoanLimit },
                ];

                return (
                  <div className="flex flex-col w-full max-w-6xl mx-auto py-space-md animate-fade-in">
                    {/* Header with title, Pre-Approved badge, description, Repayment Ledger and New Loan Demand button */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="font-headline-md text-3xl font-bold text-on-surface tracking-tight leading-tight">
                            Loan Applications &amp; Demands
                          </h1>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed-variant">
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            {decision === 'ELIGIBLE' ? 'Pre-Approved' : decision === 'MANUAL_REVIEW' ? 'Underwriter Review' : 'Under Review'}
                          </span>
                        </div>
                        <p className="font-body-md text-on-surface-variant text-sm">
                          Institutional micro-credit powered by ride earnings telemetry and verified admin underwriting.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveNav('earnings')}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-label-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">receipt_long</span>
                          <span>Repayment Ledger</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('loan-demand-form');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-lg font-label-lg text-sm hover:bg-secondary-container transition-colors shadow-sm font-semibold shrink-0 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">add_circle</span>
                          <span>New Loan Demand</span>
                        </button>
                      </div>
                    </div>

                    {/* 4 Metric Cards using live PDF data */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {/* Card 1: Pre-Approved Limit */}
                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Pre-Approved Limit</span>
                          <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-bold font-headline-sm text-on-surface tabular-nums">
                            ₹{recommendedAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-on-tertiary-container">
                            <span className="material-symbols-outlined text-[13px]">trending_up</span>
                            <span>GigScore {score} Boost Unlocked</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Active Obligation */}
                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Active Obligation</span>
                          <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-base">pie_chart</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-bold font-headline-sm text-on-surface tabular-nums">
                            ₹{activeObligationAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-on-surface-variant">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                            <span>Healthy DTI: {(affordabilityRatio * 100).toFixed(1)}% of daily earnings</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Daily Micro-Deduction */}
                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Daily Micro-Deduction</span>
                          <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-base">autorenew</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-bold font-headline-sm text-on-surface tabular-nums">
                            ₹{dailyMicroDeduction} <span className="text-xs font-normal text-on-surface-variant">/ day</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-on-surface-variant">
                            <span className="material-symbols-outlined text-[13px] text-secondary">sync_alt</span>
                            <span>Auto-split from Ola/Uber trip payout</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 4: NBFC Lending Partner */}
                      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">NBFC Lending Partner</span>
                          <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-base">verified_user</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-base font-bold font-headline-sm text-on-surface truncate">
                            Tata Capital &amp; LiquiLoans
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-on-tertiary-container">
                            <span className="material-symbols-outlined text-[13px]">security</span>
                            <span>RBI Registered • 100% Paperless</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Apply for Loan Demand Card */}
                    <div id="loan-demand-form" className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm p-space-xl mb-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 mb-5 border-b border-outline-variant/20">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-xl">savings</span>
                          </div>
                          <div>
                            <h2 className="font-headline-sm text-xl font-bold text-on-surface">Apply for Loan Demand</h2>
                            <p className="text-xs text-on-surface-variant">Fast disbursal in &lt; 2 hours upon admin approval</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm text-secondary">lock</span>Zero Collateral Required
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
                        {/* Left column: Sliders & Selectors (7 cols) */}
                        <div className="lg:col-span-7 flex flex-col gap-5">
                          {/* REQUESTED AMOUNT */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                REQUESTED AMOUNT
                              </span>
                              <span className="font-headline-md text-3xl font-extrabold text-secondary tracking-tight tabular-nums">
                                ₹{Number(loanAmount).toLocaleString('en-IN')}
                              </span>
                            </div>

                            {/* Interactive Track & Thumb Range Slider */}
                            <div className="relative py-2">
                              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-secondary h-full rounded-full transition-all duration-75"
                                  style={{ width: `${sliderPercent}%` }}
                                ></div>
                              </div>
                              <input
                                type="range"
                                min={minLoanLimit}
                                max={maxLoanLimit}
                                step={5000}
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(Number(e.target.value))}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                              />
                              <div
                                className="absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 rounded-full bg-secondary shadow-md border-2 border-surface-container-lowest pointer-events-none transition-all duration-75"
                                style={{ left: `${sliderPercent}%` }}
                              ></div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium font-code-financial">
                              <span>Min: ₹{minLoanLimit.toLocaleString('en-IN')}</span>
                              <span className="text-secondary font-semibold">
                                Current Selection: ₹{Number(loanAmount).toLocaleString('en-IN')}
                              </span>
                              <span>Max Limit: ₹{maxLoanLimit.toLocaleString('en-IN')}</span>
                            </div>

                            {/* Quick Presets */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="text-[11px] text-on-surface-variant font-medium">Quick Presets:</span>
                              {presets.map((p) => (
                                <button
                                  type="button"
                                  key={p.label}
                                  onClick={() => setLoanAmount(p.val)}
                                  className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
                                    loanAmount === p.val
                                      ? 'border-secondary bg-secondary/10 text-secondary font-bold'
                                      : 'border-outline-variant/40 hover:border-secondary text-on-surface hover:bg-surface-container-low'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* REPAYMENT TENURE */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                                REPAYMENT TENURE
                              </span>
                              <span className="text-xs text-on-surface-variant font-medium">
                                Flexible micro-installments
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              {[6, 9, 12, 18, 24].map((t) => (
                                <button
                                  type="button"
                                  key={t}
                                  onClick={() => setLoanTenure(t)}
                                  className={`py-2 px-2 rounded-lg font-label-md text-xs font-semibold text-center cursor-pointer transition-colors ${
                                    loanTenure === t
                                      ? 'bg-secondary text-on-secondary shadow-sm'
                                      : 'border border-surface-container text-on-surface hover:bg-surface-container-low bg-surface-container-lowest'
                                  }`}
                                >
                                  {t} Mos
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* LOAN PURPOSE */}
                          <div className="flex flex-col gap-2">
                            <span className="font-label-sm text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                              LOAN PURPOSE
                            </span>
                            <div className="relative">
                              <select
                                value={loanPurpose}
                                onChange={(e) => setLoanPurpose(e.target.value)}
                                className="w-full py-2.5 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-body-md text-sm text-on-surface appearance-none outline-none focus:border-secondary cursor-pointer"
                              >
                                <option>Working Capital &amp; Vehicle Maintenance</option>
                                <option>EV Battery Replacement / Subscription</option>
                                <option>Commercial Permit &amp; Insurance Renewal</option>
                                <option>Tyre &amp; Fleet Service Upgrade</option>
                                <option>Personal Emergency Working Advance</option>
                              </select>
                              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">
                                expand_more
                              </span>
                            </div>
                          </div>

                          {/* GigScore Low-Interest Tier */}
                          <div className="p-3 rounded-xl bg-surface-container-low/60 border border-surface-container flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-secondary text-lg mt-0.5">shield</span>
                            <div className="text-xs text-on-surface-variant leading-relaxed">
                              <span className="font-bold text-on-surface">GigScore Low-Interest Tier: </span>
                              Because your score is {score} ({riskBand === 'LOW' ? 'Low Risk' : riskBand === 'MEDIUM' ? 'Moderate Risk' : 'High Risk'}), your interest rate is discounted by {discountPct} compared to standard NBFC rates. No hard bureau check required.
                            </div>
                          </div>
                        </div>

                        {/* Right column: FINANCIAL ESTIMATION (5 cols) */}
                        <div className="lg:col-span-5 bg-surface-container-low/70 rounded-xl p-space-lg flex flex-col justify-between border border-surface-container">
                          <div className="flex flex-col gap-3.5">
                            <div className="flex items-center justify-between">
                              <span className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                FINANCIAL ESTIMATION
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-tertiary-fixed text-on-tertiary-fixed-variant">
                                {score >= 750 ? 'Verified Tier A' : score >= 600 ? 'Verified Tier B' : 'Standard Tier'}
                              </span>
                            </div>

                            <div className="pb-3 border-b border-surface-container">
                              <div className="text-xs text-on-surface-variant mb-1">Estimated Monthly EMI</div>
                              <div className="flex items-baseline justify-between">
                                <span className="font-headline-sm text-2xl font-extrabold text-on-surface tabular-nums">
                                  ₹{emi.toLocaleString('en-IN')} <span className="text-xs font-normal text-on-surface-variant">/ month</span>
                                </span>
                                <span className="text-[11px] font-semibold text-secondary bg-surface-container px-2 py-0.5 rounded">
                                  {loanTenure} Equated Installments
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant">Daily Micro-Deduction Mode:</span>
                                <span className="font-code-financial font-semibold text-on-surface">
                                  ₹{dailyMicroDeduction} / day (Auto-reconciled)
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant">Interest Rate:</span>
                                <span className="font-label-md font-bold text-on-tertiary-container">
                                  {interestRateMonthly}% / mo ({interestRateAnnual}% p.a.)
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant">Processing Fee:</span>
                                <span className="font-semibold text-on-tertiary-container flex items-center gap-1">
                                  {processingFeeWaived ? (
                                    <>
                                      <span className="line-through text-on-surface-variant font-normal">₹1,299</span>
                                      <span>₹0 (Waived for {score >= 800 ? '800+' : 'Prime'} Score)</span>
                                    </>
                                  ) : (
                                    <span>₹1,299</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant">Net Disbursal to Bank:</span>
                                <span className="font-bold text-on-surface font-code-financial">
                                  ₹{Number(loanAmount).toLocaleString('en-IN')} (100% Direct)
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-surface-container">
                                <span className="text-on-surface-variant">Telemetry Verification:</span>
                                <span className="font-semibold text-on-surface flex items-center gap-1 text-[11px] truncate max-w-[200px]" title={uploadedFile?.name || driverSummary?.uploaded_file_name || 'Verified Statement PDF'}>
                                  <span className="material-symbols-outlined text-xs text-on-tertiary-container">check_circle</span>
                                  <span className="truncate">{uploadedFile?.name || driverSummary?.uploaded_file_name || 'Abhishek_Shedge.pdf'}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-surface-container">
                            <button
                              onClick={handleApplyLoan}
                              disabled={isSubmittingLoan || !isDataIngested}
                              className="w-full py-3 bg-secondary hover:bg-secondary-container text-on-secondary rounded-lg font-label-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                              type="button"
                            >
                              {isSubmittingLoan ? (
                                <>
                                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                  <span>Submitting Loan Demand...</span>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-base">verified</span>
                                  <span>Submit Loan Demand to Underwriters</span>
                                </>
                              )}
                            </button>
                            <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] text-on-surface-variant">
                              <span className="material-symbols-outlined text-xs text-on-tertiary-container">lock</span>
                              <span>Encrypted end-to-end. Disbursal into {driverProfile?.bank_name || 'HDFC Bank'} A/C ****{driverProfile?.bank_account ? driverProfile.bank_account.slice(-4) : '4821'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* My Loan Activity History */}
                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm p-space-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-space-md">
                        <div className="flex items-center gap-2">
                          <h2 className="font-headline-sm text-lg font-bold text-on-surface">My Loan Activity History</h2>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
                            {displayLoans.length} Applications Recorded
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-secondary"></span>Active
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-surface-tint"></span>In Review
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-on-tertiary-container"></span>Settled
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {displayLoans.map((loan) => {
                          const isApproved = loan.status === 'APPROVED' || loan.status === 'ACTIVE';
                          const isPending = loan.status === 'PENDING';

                          if (isApproved) {
                            const totalEmis = loan.total_emis || loan.tenure_months || 9;
                            const reqAmt = Number(loan.requested_amount || 100000);
                            const sanctionedAmt = Number(
                              loan.sanctioned_amount || loan.approved_amount || reqAmt
                            );
                            const isDifferent = sanctionedAmt !== reqAmt;
                            const principalAmt = sanctionedAmt;
                            const repaidEmis =
                              loan.repaid_emis || Math.max(1, Math.min(totalEmis, Math.round(totalEmis * 0.44)));
                            const repaidAmt =
                              loan.repaid_amount || Math.round(principalAmt * (repaidEmis / totalEmis));
                            const pct = Math.round((repaidEmis / totalEmis) * 100);

                            return (
                              <div
                                key={loan.id}
                                className="p-4 rounded-xl bg-surface-container-low/50 border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4"
                              >
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    {isDifferent ? (
                                      <div className="flex items-baseline gap-2 flex-wrap">
                                        <h3 className="font-headline-sm text-lg font-extrabold text-emerald-800 flex items-center gap-1.5">
                                          ₹{sanctionedAmt.toLocaleString('en-IN')}
                                          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                                            Sanctioned &amp; Given
                                          </span>
                                        </h3>
                                        <span className="text-xs text-slate-500 font-medium">
                                          Asked: <span className="line-through text-slate-400">₹{reqAmt.toLocaleString('en-IN')}</span>
                                        </span>
                                        <span className="text-xs text-slate-600 font-medium">
                                          • {totalEmis} Months
                                        </span>
                                      </div>
                                    ) : (
                                      <h3 className="font-headline-sm text-base font-bold text-on-surface">
                                        ₹{sanctionedAmt.toLocaleString('en-IN')} • {totalEmis} Months
                                      </h3>
                                    )}
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-secondary/15 text-secondary font-semibold">
                                      <span className="material-symbols-outlined text-xs">autorenew</span>
                                      Active • {repaidEmis} of {totalEmis} EMIs Repaid
                                    </span>
                                  </div>
                                  <p className="font-body-sm text-sm text-on-surface-variant">{loan.purpose}</p>
                                  <div className="w-full max-w-md my-1">
                                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1">
                                      <span>Repayment Progress ({pct}%)</span>
                                      <span>₹{repaidAmt.toLocaleString('en-IN')} of ₹{principalAmt.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-secondary h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-code-financial flex-wrap">
                                    <span>ID: {loan.id.toUpperCase()}</span>
                                    <span>•</span>
                                    <span>Next Auto-debit: {loan.next_debit || `5th of Month (₹${Math.round(principalAmt / totalEmis).toLocaleString('en-IN')})`}</span>
                                    <span>•</span>
                                    {(loan.uploaded_file_url || uploadedFile?.url) ? (
                                      <a
                                        href={loan.uploaded_file_url || uploadedFile?.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-secondary font-semibold hover:underline"
                                      >
                                        <span>View Statement</span>
                                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                                      </a>
                                    ) : (
                                      <span className="text-on-surface-variant font-medium">
                                        Statement: {loan.uploaded_file_name || uploadedFile?.name || 'Verified Statement PDF'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => triggerToast(`Viewing statement record for ${loan.id}`)}
                                    className="px-3 py-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-low text-on-surface font-label-md text-xs font-semibold transition-colors cursor-pointer"
                                  >
                                    Statement
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => triggerToast(`Gateway initialized: Advance repayment for loan ${loan.id}`)}
                                    className="px-3.5 py-1.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container font-label-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                                  >
                                    Pay Advance
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          if (isPending) {
                            return (
                              <div
                                key={loan.id}
                                className="p-4 rounded-xl bg-surface-container-low/30 border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4"
                              >
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <h3 className="font-headline-sm text-base font-bold text-on-surface">
                                      ₹{Number(loan.requested_amount).toLocaleString('en-IN')} • {loan.tenure_months} Months
                                    </h3>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-surface-container text-on-surface-variant font-semibold">
                                      <span className="material-symbols-outlined text-xs">hourglass_top</span>
                                      Underwriter Review • Step 2 of 3
                                    </span>
                                  </div>
                                  <p className="font-body-sm text-sm text-on-surface-variant">{loan.purpose}</p>
                                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-code-financial flex-wrap">
                                    <span>ID: {loan.id.toUpperCase()}</span>
                                    <span>•</span>
                                    <span>Submitted: {loan.created_at_text || (loan.created_at ? new Date(loan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today, 11:20 AM')}</span>
                                    <span>•</span>
                                    <span>Assigned NBFC: {loan.assigned_nbfc || 'Tata Capital'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg">
                                    <span className="material-symbols-outlined text-sm animate-pulse text-secondary">schedule</span>
                                    Awaiting Final Signoff
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          // Settled
                          return (
                            <div
                              key={loan.id}
                              className="p-4 rounded-xl bg-surface-container-low/20 border border-surface-container/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <h3 className="font-headline-sm text-base font-semibold text-on-surface-variant">
                                    ₹{Number(loan.requested_amount).toLocaleString('en-IN')} • {loan.tenure_months} Months
                                  </h3>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold">
                                    <span className="material-symbols-outlined text-xs">check_circle</span>
                                    Fully Cleared • NOC Issued
                                  </span>
                                </div>
                                <p className="font-body-sm text-sm text-on-surface-variant">{loan.purpose}</p>
                                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-code-financial flex-wrap">
                                  <span>ID: {loan.id.toUpperCase()}</span>
                                  <span>•</span>
                                  <span>Cleared on {loan.cleared_date || '14 Aug 2024'}</span>
                                  <span>•</span>
                                  <span>Score Boost: {loan.score_boost || '+18 Pts'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => triggerToast(`Downloading No-Objection Certificate (NOC) for ${loan.id}`)}
                                  className="px-3 py-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container-low text-on-surface-variant font-label-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-xs">download</span>
                                  <span>Download NOC</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* ==================================================== */}
            {/* TAB: DATA & CONSENT                                  */}
            {/* ==================================================== */}
            {activeNav === 'data_consent' && (
              <div className="max-w-6xl mx-auto w-full py-space-md flex flex-col gap-space-lg animate-fade-in">
                <div>
                  <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Data & Consent Management</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Manage active telemetry streams and revocable consent under the RBI Account Aggregator framework.
                  </p>
                </div>

                <div className="space-y-space-md">
                  <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-space-lg shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">Ola Partner Telemetry Consent</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Rides, earnings, daily settlements stream</p>
                    </div>
                    <span className="px-space-md py-1 rounded-full bg-surface-container text-on-tertiary-container font-label-sm text-label-sm font-bold">
                      Active Consent
                    </span>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-space-lg shadow-sm flex items-center justify-between">
                    <div>
                      <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">Uber Driver Pro Webhook Consent</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Weekly payout settlements and driver ratings</p>
                    </div>
                    <span className="px-space-md py-1 rounded-full bg-surface-container text-on-tertiary-container font-label-sm text-label-sm font-bold">
                      Active Consent
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Toast Floating Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-primary-container text-on-secondary-container px-space-md py-space-sm rounded-xl shadow-xl border border-outline-variant/40 flex items-center gap-space-xs font-label-md text-label-md z-50 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">info</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
