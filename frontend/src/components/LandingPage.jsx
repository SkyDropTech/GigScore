import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Award,
  Zap,
  Lock,
  FileCheck,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function LandingPage({ onExploreDriver, onExploreLender }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'How does GigScore compute an alternative credit score without salary slips?',
      a: 'GigScore analyzes alternative behavioral and financial indicators with explicit driver consent. By evaluating monthly net earnings consistency, platform tenure, ride completion rates, cancellation behaviors, and customer ratings, our calibrated XGBoost model accurately estimates repayment probability on a familiar 300–900 scale.',
    },
    {
      q: 'Is my gig platform data shared with third parties or sold?',
      a: 'Never. Data is collected under strict purpose-bound consent solely for lending risk assessment. You have full data sovereignty, meaning you can revoke access at any time with one click, which immediately halts underwriting data retrieval.',
    },
    {
      q: 'How does SHAP explainability benefit drivers and lenders?',
      a: 'Traditional black-box ML models make it impossible to know why an application was rejected. With TreeSHAP, GigScore breaks down the mathematical contribution of every feature into plain-English reasons (e.g., "+38 pts for 36-month tenure", "-18 pts for peak-hour cancellations"), giving drivers a roadmap to improve their score and giving lenders auditable compliance rationale.',
    },
    {
      q: 'Is this an automated loan approval engine?',
      a: 'GigScore is a prototype decision-support system. It combines ML risk probability with configurable affordability rules (EMI to net disposable income). Underwriters can inspect the score, evaluate SHAP explanations, and make informed lending decisions.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
      {/* Hero Section */}
      <div
        className="glass-panel"
        style={{
          padding: '60px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(10, 15, 30, 0.95) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <img
            src="/gigscore-horizontal.png"
            alt="GigScore Logo"
            style={{ height: '52px', objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(56,189,248,0.25))' }}
          />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#93c5fd',
            marginBottom: '20px',
          }}
        >
          <Zap size={14} /> Alternative Credit Underwriting for the 15M+ Gig Workforce
        </div>

        <h1
          style={{
            fontSize: '48px',
            fontWeight: '800',
            letterSpacing: '-1.5px',
            lineHeight: 1.15,
            maxWidth: '860px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #ffffff 30%, #93c5fd 80%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Explainable Credit Risk Assessment for Gig-Economy Workers
        </h1>

        <p
          style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '720px',
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}
        >
          Traditional credit bureaus fail hardworking gig drivers who lack monthly salary slips.
          GigScore converts consented platform work tenure, income stability, and ride quality into a
          transparent, explainable 300–900 alternative credit score.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '15px' }}
            onClick={onExploreDriver}
          >
            Launch Driver Portal <ArrowRight size={18} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '14px 28px', fontSize: '15px' }}
            onClick={onExploreLender}
          >
            Open Underwriter Console
          </button>
        </div>
      </div>

      {/* The Problem vs Solution Cards */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Why Traditional Underwriting Fails Gig Workers
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px' }}>
            Bridging the financial exclusion gap with high-fidelity behavioral data.
          </p>
        </div>

        <div className="grid-2">
          <div className="glass-panel" style={{ padding: '32px', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '10px', borderRadius: '10px' }}>
                <XCircle size={24} color="#f43f5e" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Traditional Credit Bureaus</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)', fontSize: '14.5px' }}>
              <li>❌ Requires fixed salary slips and Form 16 / tax filings</li>
              <li>❌ Punishes variable daily earnings as "unstable"</li>
              <li>❌ Ignores verified work ethic (active days, 4.8★ ratings, 1000+ completed rides)</li>
              <li>❌ Black-box rejection letters with zero actionable feedback</li>
            </ul>
          </div>

          <div className="glass-panel" style={{ padding: '32px', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '10px' }}>
                <CheckCircle2 size={24} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>The GigScore Advantage</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)', fontSize: '14.5px' }}>
              <li>✅ Uses consented platform feeds (Uber, Ola, Swiggy, Zomato)</li>
              <li>✅ Analyzes income coefficient of variation (CV) & 3-month growth trajectory</li>
              <li>✅ Rewards high completion rates, low cancellations, and strong passenger feedback</li>
              <li>✅ Explainable TreeSHAP reasons explain exactly why a score was awarded</li>
            </ul>
          </div>
        </div>
      </div>

      {/* How It Works Workflow */}
      <div className="glass-panel" style={{ padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>End-to-End Decisioning Pipeline</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px' }}>
            From raw trip records to calibrated default probability in milliseconds.
          </p>
        </div>

        <div className="grid-4">
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginBottom: '14px' }}>
              1
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Consented Ingestion</h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Driver grants granular permission to ingest trip counts, gross/net earnings, and platform tenure.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginBottom: '14px' }}>
              2
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Feature Generation</h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Calculates 18 normalized risk signals: income CV, active working days, completion ratios, and 3-month slopes.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginBottom: '14px' }}>
              3
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Calibrated ML</h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Trained XGBoost model outputs calibrated default probability mapped into an intuitive 300–900 score.
            </p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginBottom: '14px' }}>
              4
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>SHAP & Policy Rules</h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Affordability tests evaluate requested EMI against disposable income; SHAP produces plain-English reasons.
            </p>
          </div>
        </div>
      </div>

      {/* Trust & Security */}
      <div className="grid-3">
        <div className="glass-panel" style={{ padding: '28px' }}>
          <ShieldCheck size={28} color="var(--accent-blue)" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>Data Sovereignty</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Drivers hold 100% control over their data. Consent can be revoked at any time, instantly deleting active connections.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '28px' }}>
          <Lock size={28} color="var(--accent-cyan)" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>Data Minimization</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            We only ingest permitted aggregate signals. No GPS tracking, personal chats, or contact lists are ever touched.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '28px' }}>
          <FileCheck size={28} color="var(--accent-emerald)" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>Immutable Audit Trail</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Every inference, feature snapshot, consent change, and underwriting review action is immutably logged for regulatory compliance.
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="glass-panel" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '840px', margin: '0 auto' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => toggleFaq(idx)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontWeight: '600',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openFaq === idx && (
                <div style={{ padding: '0 20px 18px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
