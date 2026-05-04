import React from 'react';

const bar = (h: number, w: string | number = '100%') => (
  <div
    className="dashboard-skeleton-pulse"
    style={{ height: h, width: w, borderRadius: '0.5rem', background: 'rgba(255,255,255,0.07)' }}
  />
);

const DashboardSkeleton: React.FC = () => (
  <div
    className="dashboard-skeleton-layout"
    style={{
      width: '100%',
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '2rem',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 320px) 1fr',
      gap: '2rem',
    }}
  >
    <div className="dashboard-skeleton-pulse" style={{ borderRadius: '1rem', minHeight: 380, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }} />
    <div className="glass" style={{ borderRadius: '1rem', minHeight: 620, padding: '2rem' }}>
      {bar(36, '38%')}
      {bar(20, '72%')}
      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        {bar(120, '100%')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {bar(100, '100%')}
          {bar(100, '100%')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {bar(72, '100%')}
          {bar(72, '100%')}
          {bar(72, '100%')}
          {bar(72, '100%')}
        </div>
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;
