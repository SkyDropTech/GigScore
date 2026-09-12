import React, { useState, useEffect } from 'react';
import {
  Car,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  ChevronRight,
  Sparkles,
  Info,
  Lock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import { api } from '../services/api';

export default function DriverDashboard({ currentPersona, onRefreshUser }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, earnings, loan_sim, applications, consent
  const [summary, setSummary] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [loans, setLoans] = useState([]);
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Loan Simulator State
  const [loanAmount, setLoanAmount] = useState(50000);
  const [loanTenure, setLoanTenure] = useState(12);
  const [loanPurpose, setLoanPurpose] = useState('Vehicle Maintenance & Working Capital');
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);
  const [loanSuccessMsg, setLoanSuccessMsg] = useState(null);

  // Load Driver Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, earnRes, loansRes, consentsRes] = await Promise.all([
        api.getDriverSummary().catch(() => null),
        api.getDriverEarnings().catch(() => []),
        api.getLoans().catch(() => []),
        api.getConsents().catch(() => []),
      ]);
      setSummary(sumRes);
      setEarnings(earnRes || []);
      setLoans(loansRes || []);
      setConsents(consentsRes || []);
    } catch (err) {
      console.error('Error loading driver data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPersona]);

  // Calculate live EMI (18% p.a. standard rate)
  const annualRate = 0.18;
  const monthlyRate = annualRate / 12;
  const n = loanTenure;
  const emi = Math.round(
    loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1)
  );

  const avgMonthlyIncome = summary?.avg_monthly_net_income || 45000;
  const disposableIncome = Math.round(avgMonthlyIncome * 0.5);
  const emiRatio = emi / Math.max(1, disposableIncome);
  const isAffordable = emiRatio <= 0.35;

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingLoan(true);
      setLoanSuccessMsg(null);
      const result = await api.submitLoan(loanAmount, loanTenure, loanPurpose);
      setLoanSuccessMsg(`Application ${result.id} submitted! Evaluated Status: ${result.status}`);
      await loadData();
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      alert(`Loan submission failed: ${err.message}`);
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  const handleToggleConsent = async () => {
    try {
      const activeConsent = consents.find((c) => c.is_active);
      if (activeConsent) {
        await api.revokeConsent(activeConsent.id);
      } else {
        await api.grantConsent(
          'Gig-economy work and earnings data access for alternative credit assessment',
          'rides,earnings,ratings,tenure'
        );
      }
      await loadData();
    } catch (err) {
      alert(`Consent update failed: ${err.message}`);
    }
  };

  // Latest loan & assessment
  const latestLoan = loans.length > 0 ? loans[0] : null;
  const latestAssessment = latestLoan?.latest_assessment;

  const positiveFactors = latestAssessment?.factors?.filter((f) => f.direction === 'positive') || [];
  const negativeFactors = latestAssessment?.factors?.filter((f) => f.direction === 'negative') || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Driver Header Profile Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-indigo))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '22px',
              fontWeight: '800',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
            }}
          >
            {currentPersona?.full_name?.charAt(0) || 'D'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800' }}>{currentPersona?.full_name}</h2>
              <span className="badge badge-low" style={{ fontSize: '11px' }}>
                KYC VERIFIED
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '3px' }}>
              🚗 {currentPersona?.driver_meta?.platform || 'Uber & Ola'} • {currentPersona?.driver_meta?.vehicle_type || 'Sedan'} • {currentPersona?.driver_meta?.city || 'Bengaluru'} • {summary?.tenure_months || 24} Months Platform Tenure
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: summary?.consent_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${summary?.consent_active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '600',
              color: summary?.consent_active ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            }}
          >
            <ShieldCheck size={14} />
            {summary?.consent_active ? 'Data Consent Active' : 'Consent Revoked'}
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="nav-tabs" style={{ alignSelf: 'flex-start' }}>
        <button
          className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Sparkles size={15} /> Credit Score & Assessment
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          <TrendingUp size={15} /> Work & Income Analytics
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'loan_sim' ? 'active' : ''}`}
          onClick={() => setActiveTab('loan_sim')}
        >
          <IndianRupee size={15} /> Loan Simulator & Apply
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          <Clock size={15} /> Applications ({loans.length})
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'consent' ? 'active' : ''}`}
          onClick={() => setActiveTab('consent')}
        >
          <Lock size={15} /> Data Privacy & Consent
        </button>
      </div>

      {/* TAB 1: Credit Score & Assessment Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-2">
            {/* Left: Score Gauge Card */}
            <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Your GigScore Assessment</h3>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Model: {latestAssessment?.model_version || 'xgb-v3.2-calibrated'}
                </span>
              </div>

              <ScoreGauge
                score={summary?.latest_score || latestAssessment?.score || 650}
                riskBand={summary?.latest_risk_band || latestAssessment?.risk_band || 'MEDIUM'}
                defaultProb={latestAssessment?.probability_of_default || 0.12}
                maxLimit={latestAssessment?.recommended_amount || 75000}
              />

              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Underwriting Decision:</span>
                <strong
                  style={{
                    color:
                      latestAssessment?.decision === 'ELIGIBLE'
                        ? 'var(--risk-low)'
                        : latestAssessment?.decision === 'MANUAL_REVIEW'
                        ? 'var(--risk-med)'
                        : 'var(--risk-high)',
                  }}
                >
                  {latestAssessment?.decision || 'ELIGIBLE'}
                </strong>
              </div>
            </div>

            {/* Right: SHAP Explainability & Factor Attribution */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Zap size={18} color="var(--accent-blue)" />
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Why did you get this score? (TreeSHAP)</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '18px' }}>
                Explainable AI factor attributions mathematically computed from your verified work patterns.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                {positiveFactors.slice(0, 3).map((f, i) => (
                  <div key={`pos-${i}`} className="shap-factor-row factor-positive">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ArrowUpRight size={18} color="var(--accent-emerald)" />
                      <span style={{ fontSize: '13.5px', fontWeight: '500' }}>{f.display_reason}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                      +POSITIVE
                    </span>
                  </div>
                ))}

                {negativeFactors.slice(0, 3).map((f, i) => (
                  <div key={`neg-${i}`} className="shap-factor-row factor-negative">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ArrowDownRight size={18} color="var(--accent-rose)" />
                      <span style={{ fontSize: '13.5px', fontWeight: '500' }}>{f.display_reason}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)' }}>
                      -NEGATIVE
                    </span>
                  </div>
                ))}

                {positiveFactors.length === 0 && negativeFactors.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Submit a loan application to view instant SHAP reason codes.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Score Coach Card */}
          <div
            className="glass-panel"
            style={{
              padding: '24px 28px',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
              borderLeft: '4px solid var(--accent-cyan)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Sparkles size={18} color="var(--accent-cyan)" />
              <h4 style={{ fontSize: '16px', fontWeight: '700' }}>GigScore Coach: Actionable Roadmap to 800+ Score</h4>
            </div>
            <div className="grid-3" style={{ marginTop: '14px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px' }}>
                <strong style={{ fontSize: '13.5px', color: '#38bdf8' }}>1. Minimize Cancellations</strong>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Keeping driver cancellation rate below 5% boosts alternative credit scores by up to +25 points.
                </p>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px' }}>
                <strong style={{ fontSize: '13.5px', color: '#34d399' }}>2. Maintain Working Consistency</strong>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Completing trips across at least 22 active days per month signals dependable income stability.
                </p>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px' }}>
                <strong style={{ fontSize: '13.5px', color: '#a78bfa' }}>3. Build Platform Tenure</strong>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Every 6 months of continuous active gig history unlocks higher credit limits and lower APR.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Work & Income Analytics */}
      {activeTab === 'earnings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-4">
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>AVG MONTHLY NET</div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', color: 'var(--accent-emerald)' }}>
                ₹{(summary?.avg_monthly_net_income || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Net after fuel & fees
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>INCOME STABILITY (CV)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', color: (summary?.income_volatility_cv || 0) < 0.25 ? 'var(--risk-low)' : 'var(--risk-med)' }}>
                {summary?.income_volatility_cv?.toFixed(2) || '0.15'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Coefficient of variation
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>TOTAL TRIPS (12M)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px' }}>
                {(summary?.total_trips_12m || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                ~{summary?.avg_trips_per_month || 0} rides / month
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontWeight: '600' }}>COMPLETION & RATING</div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', color: 'var(--accent-blue)' }}>
                {((summary?.completion_rate || 0.95) * 100).toFixed(0)}% • {summary?.avg_rating?.toFixed(1) || '4.8'}★
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Cancellation: {((summary?.cancellation_rate || 0.04) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Monthly Earnings Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>12-Month Earnings & Trip Records</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Gross Income</th>
                    <th>Platform Fees</th>
                    <th>Fuel / Costs</th>
                    <th>Net Take-Home</th>
                    <th>Active Days</th>
                    <th>Trips</th>
                    <th>Completion</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{r.month}</td>
                      <td>₹{Math.round(r.gross_income).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--accent-rose)' }}>-₹{Math.round(r.platform_fee).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--accent-amber)' }}>-₹{Math.round(r.other_costs).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>
                        ₹{Math.round(r.net_income).toLocaleString('en-IN')}
                      </td>
                      <td>{r.active_days} days</td>
                      <td>{r.trips}</td>
                      <td>{(r.completion_rate * 100).toFixed(1)}%</td>
                      <td>{r.avg_rating.toFixed(2)} ★</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Loan Simulator & Apply */}
      {activeTab === 'loan_sim' && (
        <div className="grid-2">
          {/* Simulator Form */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Interactive Loan Simulator</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '24px' }}>
              Configure your requested loan amount and tenure. Our decision engine instantly checks affordability.
            </p>

            <form onSubmit={handleApplyLoan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600' }}>Loan Amount</label>
                  <strong style={{ fontSize: '18px', color: 'var(--accent-cyan)' }}>
                    ₹{loanAmount.toLocaleString('en-IN')}
                  </strong>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="250000"
                  step="5000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>₹10,000</span>
                  <span>₹250,000</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Tenure: {loanTenure} Months
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[3, 6, 9, 12, 18, 24].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`btn btn-sm ${loanTenure === t ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setLoanTenure(t)}
                    >
                      {t} Mo
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Loan Purpose
                </label>
                <select
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                >
                  <option value="Vehicle Maintenance & Working Capital">Vehicle Maintenance & Working Capital</option>
                  <option value="CNG Retrofit / Battery Upgrade">CNG Retrofit / Battery Upgrade</option>
                  <option value="Annual Insurance & Fitness Renewal">Annual Insurance & Fitness Renewal</option>
                  <option value="Smartphone & GPS Equipment">Smartphone & GPS Equipment</option>
                  <option value="Family Medical / Personal Cushion">Family Medical / Personal Cushion</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmittingLoan}
                style={{ marginTop: '10px', padding: '14px' }}
              >
                {isSubmittingLoan ? 'Evaluating ML Assessment...' : 'Submit Loan Application'}
                <Send size={16} />
              </button>

              {loanSuccessMsg && (
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: 'var(--accent-emerald)',
                    fontSize: '13.5px',
                  }}
                >
                  ✅ {loanSuccessMsg}
                </div>
              )}
            </form>
          </div>

          {/* Real-time Affordability Card */}
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>
                Affordability & EMI Preview
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Estimated Monthly EMI:</span>
                  <strong style={{ fontSize: '22px', color: 'var(--accent-cyan)' }}>
                    ₹{emi.toLocaleString('en-IN')} / mo
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Indicative Annual Interest:</span>
                  <strong style={{ color: '#fff' }}>18.0% p.a.</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Estimated Monthly Disposable Surplus:</span>
                  <strong style={{ color: '#fff' }}>₹{disposableIncome.toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>EMI to Disposable Income Ratio:</span>
                  <strong style={{ color: isAffordable ? 'var(--risk-low)' : 'var(--risk-high)' }}>
                    {(emiRatio * 100).toFixed(1)}% (Threshold: 35%)
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '24px',
                padding: '16px',
                borderRadius: '12px',
                background: isAffordable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                border: `1px solid ${isAffordable ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '14px', color: isAffordable ? 'var(--risk-low)' : 'var(--risk-high)' }}>
                {isAffordable ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {isAffordable ? 'Affordability Policy Passed' : 'Affordability Alert: EMI Exceeds Comfort Threshold'}
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                {isAffordable
                  ? 'Your requested loan parameters are well cushioned by your verified platform net earnings.'
                  : 'Consider extending tenure to 18 or 24 months to lower your monthly installment.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Applications History */}
      {activeTab === 'applications' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '18px' }}>Application History & Status Timeline</h3>
          {loans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No loan applications submitted yet. Use the simulator tab to apply.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {loans.map((app) => (
                <div
                  key={app.id}
                  style={{
                    padding: '20px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ fontSize: '16px' }}>₹{app.requested_amount.toLocaleString('en-IN')}</strong>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>for {app.tenure_months} Months</span>
                      <span className={`badge badge-${app.status.toLowerCase()}`}>
                        {app.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Purpose: {app.purpose} • ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{app.id}</span>
                    </div>
                    {app.reviewer_notes && (
                      <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#93c5fd', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 12px', borderRadius: '6px' }}>
                        Underwriter Note: {app.reviewer_notes} (by {app.reviewed_by || 'Reviewer'})
                      </div>
                    )}
                  </div>

                  {app.latest_assessment && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assessed GigScore</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-blue)' }}>
                        {app.latest_assessment.score}
                      </div>
                      <span className={`badge badge-${app.latest_assessment.risk_band.toLowerCase()}`} style={{ fontSize: '10px' }}>
                        {app.latest_assessment.risk_band} RISK
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Data Privacy & Consent Controls */}
      {activeTab === 'consent' && (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Connected Platforms & Consent Controls</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '4px' }}>
                You have 100% data sovereignty. Revoking consent immediately disconnects automated underwriting ingestion.
              </p>
            </div>

            <button
              className={`btn ${summary?.consent_active ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleToggleConsent}
            >
              {summary?.consent_active ? 'Revoke Platform Consent' : 'Grant Data Consent'}
            </button>
          </div>

          <div className="grid-3" style={{ marginTop: '20px' }}>
            {['Uber Driver Partner', 'Ola Cabs Fleet', 'Swiggy Delivery Partner'].map((pName, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '15px' }}>{pName}</strong>
                  <span
                    style={{
                      fontSize: '11px',
                      color: summary?.consent_active ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      fontWeight: '700',
                    }}
                  >
                    {summary?.consent_active ? '● SYNCED' : '○ REVOKED'}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Scope: Rides, Net Income, Ratings, Working Days.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                  Last Synced: Today at 01:00 AM
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
