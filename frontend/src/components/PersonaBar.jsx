import React, { useState } from 'react';
import { User, Shield, RefreshCw, CheckCircle2, Car, Bike, Sparkles } from 'lucide-react';
import { setAuthToken } from '../services/api';

export default function PersonaBar({
  personas = [],
  currentPersona,
  onSelectPersona,
  onResetData,
  isResetting,
}) {
  return (
    <div className="persona-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
          DEMO PERSONAS:
        </span>
        <div className="persona-chips">
          {personas.map((p) => {
            const isSelected = currentPersona?.email === p.email;
            let icon = <User size={14} />;
            let badgeClass = '';
            let label = p.full_name.split(' ')[0];

            if (p.role === 'driver') {
              if (p.driver_meta?.archetype === 'stable_high') {
                icon = <Car size={14} color="#10b981" />;
                badgeClass = 'low';
                label = `${label} (${p.driver_meta.score || 873})`;
              } else if (p.driver_meta?.archetype === 'moderate_volatile') {
                icon = <Bike size={14} color="#f59e0b" />;
                badgeClass = 'med';
                label = `${label} (${p.driver_meta.score || 727})`;
              } else {
                icon = <Car size={14} color="#f43f5e" />;
                badgeClass = 'high';
                label = `${label} (${p.driver_meta?.score || 340})`;
              }
            } else if (p.role === 'lender') {
              icon = <Shield size={14} color="#3b82f6" />;
              label = `${label} (Underwriter)`;
            } else if (p.role === 'admin') {
              icon = <Sparkles size={14} color="#a855f7" />;
              label = `${label} (MLOps)`;
            }

            return (
              <button
                key={p.email}
                className={`persona-chip ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectPersona(p)}
                title={`Switch to ${p.full_name} (${p.role})`}
              >
                {icon}
                <span>{label}</span>
                {p.driver_meta?.risk_band && (
                  <span className={`persona-chip-badge ${badgeClass}`}>
                    {p.driver_meta.risk_band}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-emerald)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', display: 'inline-block', boxShadow: '0 0 8px var(--accent-emerald)' }}></span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>FastAPI + XGBoost Live</span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onResetData}
          disabled={isResetting}
          style={{ padding: '4px 10px', fontSize: '11.5px' }}
        >
          <RefreshCw size={12} className={isResetting ? 'spin' : ''} />
          {isResetting ? 'Resetting...' : 'Reset Demo'}
        </button>
      </div>
    </div>
  );
}
