import React from 'react';

export type SparkTrend = 'up' | 'down' | 'flat' | 'warn';

const PATHS: Record<SparkTrend, string> = {
  up: 'M0,28 C12,22 18,8 34,12 S58,4 72,2',
  down: 'M0,8 C14,14 24,26 38,22 S52,32 72,28',
  flat: 'M0,18 L18,16 36,19 54,15 72,17',
  warn: 'M0,22 Q20,10 36,18 T72,12',
};

const COLORS: Record<SparkTrend, string> = {
  up: 'var(--accent-primary)',
  down: 'var(--accent-danger)',
  flat: 'var(--text-secondary)',
  warn: '#f6c760',
};

interface SparklineMiniProps {
  trend: SparkTrend;
  /** Optional 0–100 hint to nudge curve shape (higher = ends higher on chart). */
  value?: number;
  width?: number;
  height?: number;
}

function pathForValue(value: number | undefined, trend: SparkTrend): string {
  if (value == null || Number.isNaN(value)) {
    return PATHS[trend];
  }
  const v = Math.max(0, Math.min(100, value));
  if (v >= 72) return PATHS.up;
  if (v >= 45) return PATHS.flat;
  if (v >= 28) return PATHS.warn;
  return PATHS.down;
}

/** Mini sparkline driven by metric level and trend. */
const SparklineMini: React.FC<SparklineMiniProps> = ({ trend, value, width = 72, height = 32 }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 72 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, opacity: 0.9 }}
    aria-hidden
  >
    <path
      d={pathForValue(value, trend)}
      stroke={COLORS[trend]}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      opacity={0.95}
    />
  </svg>
);

export default SparklineMini;
