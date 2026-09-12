import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Sliders,
  FileText,
  AlertCircle,
  Eye,
  Send,
  PieChart,
  BarChart3,
  X,
} from 'lucide-react';
import { api } from '../services/api';

export default function LenderDashboard() {
  const [activeTab, setActiveTab] = useState('queue'); // queue, portfolio
  const [applications, setApplications] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Applicant for Review Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apps, port] = await Promise.all([
        api.getLenderApplications(statusFilter, riskFilter, searchQuery).catch(() => []),
        api.getPortfolioMetrics().catch(() => null),
      ]);
      setApplications(apps || []);
      setPortfolio(port);
    } catch (err) {
      console.error('Error loading lender data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, riskFilter, searchQuery]);

  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setReviewNotes(app.reviewer_notes || 'Income track record verified against platform receipts.');
    setReviewAction(app.status === 'REJECTED' ? 'REJECT' : 'APPROVE');
  };

  const handleCloseReview = () => {
    setSelectedApp(null);
  };

  const handleSubmitDecision = async () => {
    if (!selectedApp) return;
    try {
      setIsSubmittingReview(true);
      await api.reviewApplication(selectedApp.id, reviewAction, reviewNotes);
      await loadData();
      setSelectedApp(null);
    } catch (err) {
      alert(`Decision recording failed: ${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Lender Header Banner */}
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
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
            }}
          >
            <Shield size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800' }}>Credit Underwriting & Portfolio Hub</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '3px' }}>
              Decision-support console with calibrated default probabilities and TreeSHAP explainability.
            </p>
          </div>
        </div>

        <div className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <FileText size={15} /> Application Queue ({applications.length})
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <PieChart size={15} /> Portfolio Analytics
          </button>
        </div>
      </div>

      {/* VIEW 1: Application Queue */}
      {activeTab === 'queue' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          {/* Filters & Search Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: '260px' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Search applicant or loan ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 14px 8px 36px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    fontSize: '13.5px',
                  }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Risk Filter */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <option value="ALL">All Risk Bands</option>
                <option value="LOW">Low Risk (750+)</option>
                <option value="MEDIUM">Medium Risk (600-749)</option>
                <option value="HIGH">High Risk (&lt;600)</option>
              </select>
            </div>

            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing {applications.length} applications
            </span>
          </div>

          {/* Applications Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Platform & Vehicle</th>
                  <th>Requested Loan</th>
                  <th>GigScore</th>
                  <th>P(Default)</th>
                  <th>Model Decision</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const asmt = app.latest_assessment;
                  return (
                    <tr key={app.id}>
                      <td>
                        <strong style={{ fontSize: '14.5px', display: 'block' }}>{app.driver_name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {app.id}
                        </span>
                      </td>
                      <td>
                        <div>{app.driver_platform}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.purpose}</div>
                      </td>
                      <td>
                        <strong style={{ color: '#fff' }}>₹{app.requested_amount.toLocaleString('en-IN')}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.tenure_months} months</div>
                      </td>
                      <td>
                        {asmt ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '17px', fontWeight: '800', color: asmt.risk_band === 'LOW' ? 'var(--risk-low)' : asmt.risk_band === 'MEDIUM' ? 'var(--risk-med)' : 'var(--risk-high)' }}>
                              {asmt.score}
                            </span>
                            <span className={`badge badge-${asmt.risk_band.toLowerCase()}`} style={{ fontSize: '10px' }}>
                              {asmt.risk_band}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        {asmt ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                            {(asmt.probability_of_default * 100).toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {asmt ? (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color:
                                asmt.decision === 'ELIGIBLE'
                                  ? 'var(--risk-low)'
                                  : asmt.decision === 'MANUAL_REVIEW'
                                  ? 'var(--risk-med)'
                                  : 'var(--risk-high)',
                            }}
                          >
                            {asmt.decision}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenReview(app)}
                          style={{ gap: '6px' }}
                        >
                          <Eye size={13} /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Portfolio Analytics */}
      {activeTab === 'portfolio' && portfolio && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* KPI Cards */}
          <div className="grid-4">
            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL APPLICATIONS</div>
              <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px' }}>
                {portfolio.total_applications}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {portfolio.pending_review} pending underwriter review
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>APPROVED EXPOSURE</div>
              <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: 'var(--accent-emerald)' }}>
                ₹{portfolio.total_exposure_approved.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Total disbursed capital
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>AVERAGE GIGSCORE</div>
              <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: 'var(--accent-blue)' }}>
                {portfolio.average_score}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Across entire consented applicant pool
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '22px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>PREDICTED DEFAULT RATE</div>
              <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: 'var(--accent-amber)' }}>
                {(portfolio.predicted_portfolio_default_rate * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Approval rate: {(portfolio.approval_rate * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="grid-2">
            <div className="glass-panel" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '18px' }}>
                Risk Band Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Object.entries(portfolio.risk_band_breakdown || {}).map(([tier, count]) => {
                  const total = Math.max(1, portfolio.total_applications);
                  const pct = Math.round((count / total) * 100);
                  const color = tier === 'LOW' ? 'var(--risk-low)' : tier === 'MEDIUM' ? 'var(--risk-med)' : 'var(--risk-high)';
                  return (
                    <div key={tier}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '600' }}>{tier} RISK</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count} drivers ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '18px' }}>
                Score Bins Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {portfolio.score_distribution?.map((bin, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '14px' }}>{bin.range}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '10px' }}>{bin.risk}</span>
                    </div>
                    <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {bin.count} applications
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL: Deep Underwriter Review */}
      {selectedApp && (
        <div className="modal-overlay" onClick={handleCloseReview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Underwriting Deep-Dive</h3>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Application ID: {selectedApp.id} • {selectedApp.driver_name}
                </span>
              </div>
              <button
                onClick={handleCloseReview}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Assessment & Financial Summary */}
            {selectedApp.latest_assessment && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div className="grid-3" style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>GigScore</span>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-blue)' }}>
                      {selectedApp.latest_assessment.score}
                    </div>
                    <span className={`badge badge-${selectedApp.latest_assessment.risk_band.toLowerCase()}`} style={{ fontSize: '10px' }}>
                      {selectedApp.latest_assessment.risk_band}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>P(Default)</span>
                    <div style={{ fontSize: '24px', fontWeight: '800' }}>
                      {(selectedApp.latest_assessment.probability_of_default * 100).toFixed(1)}%
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Calibrated XGB</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Max Limit</span>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                      ₹{selectedApp.latest_assessment.recommended_amount?.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Disposable x6</span>
                  </div>
                </div>

                {/* SHAP Factor Attribution List */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>
                    Mathematical Factor Impact (TreeSHAP)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                    {selectedApp.latest_assessment.factors?.map((f, i) => (
                      <div
                        key={i}
                        className={`shap-factor-row ${f.direction === 'positive' ? 'factor-positive' : 'factor-negative'}`}
                        style={{ padding: '10px 14px', marginBottom: '0' }}
                      >
                        <span style={{ fontSize: '13px' }}>{f.display_reason}</span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            fontFamily: 'var(--font-mono)',
                            color: f.direction === 'positive' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                          }}
                        >
                          {f.direction.toUpperCase()} ({f.contribution.toFixed(2)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision Action Console */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>
                    Underwriting Action & Justification
                  </h4>

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${reviewAction === 'APPROVE' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setReviewAction('APPROVE')}
                    >
                      <CheckCircle size={14} /> Approve Loan
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${reviewAction === 'REQUEST_INFO' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setReviewAction('REQUEST_INFO')}
                    >
                      <Clock size={14} /> Request Additional Verification
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${reviewAction === 'REJECT' ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => setReviewAction('REJECT')}
                    >
                      <XCircle size={14} /> Reject Application
                    </button>
                  </div>

                  <label style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Underwriter Notes (Logged to immutable audit trail):
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter underwriting justification for compliance audit..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '13px',
                      marginBottom: '16px',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={handleCloseReview}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmitDecision}
                      disabled={isSubmittingReview || !reviewNotes.trim()}
                    >
                      <Send size={14} />
                      {isSubmittingReview ? 'Recording Action...' : 'Confirm Decision'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
