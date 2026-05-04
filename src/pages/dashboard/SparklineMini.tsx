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
  width?: number;
  height?: number;
}

/** Placeholder trend line for health-tech metrics (static SVG). */
const SparklineMini: React.FC<SparklineMiniProps> = ({ trend, width = 72, height = 32 }) => (
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
      d={PATHS[trend]}
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
