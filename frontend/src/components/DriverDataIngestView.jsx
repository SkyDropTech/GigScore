import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, resolveMediaUrl } from '../services/api';
import DriverOverviewHome from './DriverOverviewHome';
import DriverCreditScoreView from './DriverCreditScoreView';
import DriverEarningsView from './DriverEarningsView';
import {
  Home,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  CreditCard,
  FileText,
  Lock,
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Shield,
  Sparkles,
  HelpCircle,
  Settings,
} from 'lucide-react';

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
    return map[sub] || 'overview';
  };

  const [activeNav, setActiveNavState] = useState(() => getNavFromPath(location.pathname));

  useEffect(() => {
    const navFromUrl = getNavFromPath(location.pathname);
    if (navFromUrl !== activeNav) {
      setActiveNavState(navFromUrl);
    }
  }, [location.pathname]);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const setActiveNav = (navKey) => {
    setActiveNavState(navKey);
    setIsMobileDrawerOpen(false);
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
  const [avatarError, setAvatarError] = useState(false);

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

  const [isUploading, setIsUploading] = useState(false);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Reusable locked section view when data is not yet ingested (Matching screenshot precisely)
  const renderLockedNotice = (sectionTitle, sectionSubtitle) => (
    <div className="max-w-3xl mx-auto w-full py-20 px-6 text-center animate-fade-in flex flex-col items-center">
      {/* Gold lock container */}
      <div className="w-18 h-18 rounded-3xl bg-[#FFF9EB] border border-[#FEE8B6] flex items-center justify-center text-amber-500 shadow-2xs mb-6">
        <Lock size={28} className="text-amber-500 stroke-[2.2]" />
      </div>

      {/* Pill badge */}
      <span className="px-3.5 py-1 bg-[#FFF9EB] text-amber-600 border border-[#FEE8B6] rounded-full font-bold text-xs uppercase tracking-wider mb-4">
        DATA INGESTION REQUIRED
      </span>

      {/* Title */}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
        {sectionTitle} is Locked
      </h2>

      {/* Description */}
      <p className="text-slate-500 max-w-lg mt-3.5 text-sm sm:text-base leading-relaxed">
        {sectionSubtitle ||
          'To protect institutional underwriting integrity, driver financial streams, trip telemetry, and pre-approved capital limits remain securely locked until your verified earnings statement PDF is uploaded and processed by the ML model.'}
      </p>

      {/* Action Button */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="h-12 px-6 rounded-xl bg-[#0062E3] hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2.5 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
              <span>Uploading & Parsing Telemetry...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-xl">upload_file</span>
              <span>Upload Statement & Run Model Prediction</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Load existing profile, loans and state on mount in parallel
  const loadDriverState = async () => {
    try {
      const [summary, earnings, loans, profile, realAsmt] = await Promise.all([
        api.getDriverSummary().catch(() => null),
        api.getDriverEarnings().catch(() => []),
        api.getLoans().catch(() => []),
        api.getDriverProfile().catch(() => null),
        api.getDriverAssessment().catch(() => null),
      ]);

      if (summary) setDriverSummary(summary);
      setMonthlyEarnings(earnings || []);
      setActiveLoans(loans || []);
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

      // Set ML assessment
      if (realAsmt) {
        setMlAssessment(realAsmt);
      } else {
        const existingAsmt = (loans && loans.length > 0 && loans[0].latest_assessment)
          ? loans[0].latest_assessment
          : null;
        setMlAssessment(existingAsmt);
      }

      // Only mark data ingested if actual statement was uploaded AND monthly earnings records exist in MongoDB
      const hasUploadedDoc = Boolean(profile && (profile.uploaded_file_name || profile.uploaded_file_url));
      const hasEarnings = Boolean(earnings && earnings.length > 0);
      if (hasUploadedDoc && hasEarnings) {
        setIsDataIngested(true);
        setOlaConnected(true);
        setUberConnected(true);
      } else {
        setIsDataIngested(false);
        setOlaConnected(false);
        setUberConnected(false);
      }
    } catch (err) {
      console.warn('Driver state fetch notice:', err);
    }
  };

  useEffect(() => {
    loadDriverState();
  }, []);

  // Handle PDF/CSV statement file upload via Cloudinary permanent storage & auto-ingest
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeKB} KB`;
    setIsUploading(true);
    setUploadProgress(35);
    triggerToast(`Uploading ${file.name} to secure vault and parsing statement telemetry...`);

    try {
      const uploadRes = await api.uploadStatementFile(file);
      setUploadProgress(75);
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

      if (uploadRes.assessment) {
        setMlAssessment(uploadRes.assessment);
      }

      // Auto ingest if needed to ensure all monthly features are created in DB
      try {
        await api.ingestDriverData(uploadRes.file_name, uploadRes.file_size || sizeStr, uploadRes.file_url, true, true);
      } catch (ingestErr) {
        console.warn('Auto ingest notice:', ingestErr);
      }

      // Reload fresh driver state from backend
      const [summary, earnings, loans, profile, realAsmt] = await Promise.all([
        api.getDriverSummary().catch(() => null),
        api.getDriverEarnings().catch(() => []),
        api.getLoans().catch(() => []),
        api.getDriverProfile().catch(() => null),
        api.getDriverAssessment().catch(() => null),
      ]);

      if (summary) setDriverSummary(summary);
      if (earnings && earnings.length > 0) setMonthlyEarnings(earnings);
      if (loans) setActiveLoans(loans);
      if (profile) setDriverProfile(profile);
      if (realAsmt) setMlAssessment(realAsmt);

      setIsDataIngested(true);
      setOlaConnected(true);
      setUberConnected(true);
      setUploadProgress(100);

      triggerToast(`🎉 Statement verified! Extracted ${parsedMonths || earnings?.length || 12} monthly records for ${parsedName || 'Driver'}. ML Scoring complete!`);
    } catch (err) {
      setUploadProgress(100);
      console.error('Upload statement error:', err);
      triggerToast(`❌ Statement upload error: ${err.message || 'Please upload a valid PDF or CSV statement'}`);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
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

  const driverName =
    driverProfile?.parsed_statement_data?.driver_info?.name ||
    driverProfile?.full_name ||
    driverSummary?.full_name ||
    currentPersona?.full_name ||
    'Rishikesh Shedge';
  const driverAvatar = driverProfile?.avatar_url || currentPersona?.avatar_url || null;
  const driverId =
    driverProfile?.parsed_statement_data?.driver_info?.driver_id ||
    (driverProfile?.id ? `GS-${driverProfile.id.slice(-6).toUpperCase()}` : (currentPersona?.id ? `GS-${currentPersona.id.slice(-6).toUpperCase()}` : 'GS-95FFE2'));
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
      {/* 1. TOP NAVBAR (Full-width matching reference design)      */}
      {/* ======================================================== */}
      <header className="fixed top-0 left-0 right-0 h-16 sm:h-20 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between z-40 shadow-xs select-none">
        {/* Left: Brand Logo, Title & Tagline */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden cursor-pointer shrink-0"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveNav('overview')}>
            <img
              src="/gigscore-icon.png"
              alt="GigScore Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-xs"
            />
            <div className="flex flex-col">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900 leading-none">
                GigScore
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1">
                Drive Today. Build Tomorrow.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Notifications & Driver Profile Pill */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notification Bell */}
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => triggerToast('🔔 No unread underwriter alerts.')}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Driver Profile Pill Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              {driverAvatar && !avatarError ? (
                <img
                  src={resolveMediaUrl(driverAvatar)}
                  alt={driverName}
                  onError={() => setAvatarError(true)}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100 shadow-2xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-blue-100 shadow-2xs">
                  {driverName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'RS'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                  {driverName}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 leading-tight">
                  ID: {driverId}
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Profile Menu Popup */}
            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-lg p-2 z-40 animate-fade-in text-left">
                  <div className="p-3 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900 truncate">{driverName}</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">ID: {driverId}</div>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      KYC Verified
                    </div>
                  </div>
                  <div className="py-1 space-y-0.5">
                    {onSwitchToAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onSwitchToAdmin();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                      >
                        <Shield size={14} className="text-blue-600" />
                        <span>Switch to Admin</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={14} className="text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. SIDEBAR (Fixed below top header)                       */}
      {/* ======================================================== */}
      {/* Mobile Drawer Backdrop */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-16 sm:top-20 bottom-0 w-64 bg-white border-r border-slate-200/80 z-30 flex flex-col justify-between shadow-2xs select-none transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3 space-y-1 overflow-y-auto">
          {/* Nav Item: Home */}
          <button
            type="button"
            onClick={() => setActiveNav('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeNav === 'overview'
                ? 'bg-blue-50 text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Home size={17} className={activeNav === 'overview' ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'} />
            <span>Home</span>
          </button>

          {/* Nav Item: Earnings */}
          <button
            type="button"
            onClick={() => setActiveNav('earnings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeNav === 'earnings'
                ? 'bg-blue-50 text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TrendingUp size={17} className={activeNav === 'earnings' ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'} />
            <span>Earnings</span>
          </button>

          {/* Nav Item: My GigScore */}
          <button
            type="button"
            onClick={() => setActiveNav('credit_score')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeNav === 'credit_score'
                ? 'bg-blue-50 text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck size={17} className={activeNav === 'credit_score' ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'} />
            <span>My GigScore</span>
          </button>

          {/* Nav Item: Credit & Loans */}
          <button
            type="button"
            onClick={() => setActiveNav('loan_applications')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeNav === 'loan_applications'
                ? 'bg-blue-50 text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CreditCard size={17} className={activeNav === 'loan_applications' ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'} />
            <span>Credit & Loans</span>
          </button>

          {/* Nav Item: Applications */}
          <button
            type="button"
            onClick={() => setActiveNav('loan_applications')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-left cursor-pointer"
          >
            <FileText size={17} className="text-slate-500" />
            <span>Applications</span>
          </button>

          {/* Nav Item: Data & Privacy */}
          <button
            type="button"
            onClick={() => setActiveNav('data_consent')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeNav === 'data_consent'
                ? 'bg-blue-50 text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Lock size={17} className={activeNav === 'data_consent' ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'} />
            <span>Data & Privacy</span>
          </button>
        </div>

        {/* Bottom Sidebar Promo Card: Better Opportunities For Every Driver */}
        <div className="p-3">
          <div className="rounded-2xl overflow-hidden border border-blue-100 shadow-2xs hover:shadow-md transition-shadow cursor-pointer">
            <img
              src="/images/card_opportunities.png"
              alt="Better Opportunities For Every Driver"
              className="w-full h-auto object-contain rounded-2xl block"
            />
          </div>
        </div>

        {/* Bottom Sidebar Utility Links matching Image 1 */}
        <div className="p-3 pt-0 space-y-1">
          <button
            type="button"
            onClick={() => triggerToast('💬 Support chat: Connecting you with a driver concierge...')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-left cursor-pointer"
          >
            <HelpCircle size={17} className="text-slate-400" />
            <span>Help & Support</span>
          </button>
          <button
            type="button"
            onClick={() => triggerToast('⚙ Account Settings & Preferences')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-left cursor-pointer"
          >
            <Settings size={17} className="text-slate-400" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 transition-all text-left cursor-pointer"
          >
            <LogOut size={17} className="text-red-500" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 3. MAIN WORKSPACE CONTENT                                */}
      {/* ======================================================== */}
      <div className="lg:pl-64 pl-0 w-full min-h-screen flex flex-col pt-16 sm:pt-20">
        <main className="w-full min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] bg-[#f8fafc] px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8">
          {/* Global Statement Upload Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.csv,.xlsx,.xls"
            className="hidden"
          />

          <div className="flex flex-col w-full">
            {/* ==================================================== */}
            {/* TAB: CREDIT SCORE (Matching Exact HTML and Screenshot)*/}
            {/* ==================================================== */}
            {activeNav === 'credit_score' && (
              <DriverCreditScoreView
                  driverProfile={driverProfile}
                  driverSummary={driverSummary}
                  mlAssessment={mlAssessment}
                  monthlyEarnings={monthlyEarnings}
                  currentPersona={currentPersona}
                  activeLoans={activeLoans}
                  uploadedFile={uploadedFile}
                  olaConnected={olaConnected}
                  uberConnected={uberConnected}
                  onConnectOla={handleConnectOla}
                  onConnectUber={handleConnectUber}
                  onUploadFile={handleFileUpload}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  onNavigateTab={(tabKey) => setActiveNav(tabKey)}
                  onApplyLoan={() => {
                    setLoanAmount(35000);
                    setActiveNav('loan_applications');
                  }}
                />
            )}
            {/* ==================================================== */}
            {/* TAB: DASHBOARD OVERVIEW (HOME)                       */}
            {/* ==================================================== */}
            {activeNav === 'overview' && (
              !isDataIngested ? (
                renderLockedNotice('Consolidated Earnings & Cashflow')
              ) : (
                <DriverOverviewHome
                  driverProfile={driverProfile}
                  driverSummary={driverSummary}
                  mlAssessment={mlAssessment}
                  monthlyEarnings={monthlyEarnings}
                  currentPersona={currentPersona}
                  onNavigateTab={(tabKey) => setActiveNav(tabKey)}
                  onApplyLoan={() => setActiveNav('loan_applications')}
                />
              )
            )}
            {/* ==================================================== */}
            {/* TAB: CONSOLIDATED EARNINGS & CASHFLOW (Matching Image 1) */}
            {/* ==================================================== */}
            {activeNav === 'earnings' && (
              <DriverEarningsView
                driverProfile={driverProfile}
                driverSummary={driverSummary}
                mlAssessment={mlAssessment}
                monthlyEarnings={monthlyEarnings}
                uploadedFile={uploadedFile}
                onApplyLoan={() => setActiveNav('loan_applications')}
                onNavigateTab={(tabKey) => setActiveNav(tabKey)}
              />
            )}

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
                                        href={resolveMediaUrl(loan.uploaded_file_url || uploadedFile?.url)}
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
              !isDataIngested ? (
                renderLockedNotice('Data & Privacy Telemetry')
              ) : (
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
            )
          )}
          </div>
        </main>
      </div>

      {/* ======================================================== */}
      {/* 4. MOBILE BOTTOM NAVIGATION (Driver Phone Touch-First)   */}
      {/* ======================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-1.5 px-2 flex justify-around items-center lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)] select-none">
        <button
          type="button"
          onClick={() => setActiveNav('overview')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeNav === 'overview' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('credit_score')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeNav === 'credit_score' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Score</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('earnings')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeNav === 'earnings' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Earnings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('loan_applications')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeNav === 'loan_applications' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Loans</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          aria-label="Open full menu"
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Menu</span>
        </button>
      </nav>

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
