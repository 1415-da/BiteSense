import React from 'react';

interface ProgressRingProps {
  /** 0–100, or null for empty state */
  value: number | null;
  size?: number;
  stroke?: number;
  /** Small line under the percentage */
  label?: string;
  caption?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ value, size = 64, stroke = 4, label, caption }) => {
  const pct = value == null ? 0 : Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - pct / 100);

  const strokeColor =
    value == null || value === 0
      ? 'rgba(255,255,255,0.12)'
      : pct >= 75
        ? 'var(--accent-primary)'
        : pct >= 45
          ? '#f6c760'
          : 'var(--accent-danger)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={value == null || value === 0 ? 'rgba(255,255,255,0.12)' : strokeColor}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.55s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: size > 60 ? '1rem' : '0.82rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {value == null ? '—' : `${Math.round(pct)}%`}
          </span>
          {label && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.05rem' }}>{label}</span>}
        </div>
      </div>
      {caption && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: size + 32 }}>{caption}</span>
      )}
    </div>
  );
};

export default ProgressRing;
