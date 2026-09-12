import React from 'react';

export default function ScoreGauge({ score = 650, riskBand = 'MEDIUM', defaultProb = 0.12, maxLimit = 100000 }) {
  // Score range: 300 to 900 (total range 600)
  const minScore = 300;
  const maxScore = 900;
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));
  const normalized = (clampedScore - minScore) / (maxScore - minScore); // 0 to 1

  // Semi-circle arc parameters (180 degrees, from -180 to 0 or 180 to 0)
  const radius = 90;
  const strokeWidth = 14;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - normalized);

  let color = 'var(--risk-med)';
  let glow = 'rgba(245, 158, 11, 0.4)';
  if (riskBand === 'LOW') {
    color = 'var(--risk-low)';
    glow = 'rgba(16, 185, 129, 0.4)';
  } else if (riskBand === 'HIGH') {
    color = 'var(--risk-high)';
    glow = 'rgba(244, 63, 94, 0.4)';
  }

  return (
    <div className="radial-meter-box">
      <svg width="240" height="145" viewBox="0 0 240 145" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={glow} />
          </filter>
        </defs>

        {/* Background Arc */}
        <path
          d="M 30 130 A 90 90 0 0 1 210 130"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Dynamic Score Arc */}
        <path
          d="M 30 130 A 90 90 0 0 1 210 130"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter="url(#gaugeGlow)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>

      {/* Score Value Overlay */}
      <div style={{ marginTop: '-45px' }}>
        <div className="radial-score-val" style={{ color }}>
          {clampedScore}
        </div>
        <div className="radial-score-range">300 — 900 Scale</div>
        
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
          <span className={`badge badge-${riskBand.toLowerCase()}`}>
            ● {riskBand} RISK
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            P(Default): {(defaultProb * 100).toFixed(1)}%
          </span>
        </div>

        {maxLimit > 0 && (
          <div style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Pre-Approved Limit: <strong style={{ color: '#fff' }}>₹{maxLimit.toLocaleString('en-IN')}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
