import React, { useMemo } from 'react';
import { Calendar, ChevronRight, MapPin, ScanLine } from 'lucide-react';

import type { DashboardTab } from './types';
import type { MenuScanSummaryDto } from '../../api/workspace';
import DashboardTabShell from './DashboardTabShell';
import MatchScorePill from './MatchScorePill';
import { quickMetricStyle } from './styles';

interface HistoryTabProps {
  onNavigate: (tab: DashboardTab) => void;
  scans: MenuScanSummaryDto[];
}

const HistoryTab: React.FC<HistoryTabProps> = ({ onNavigate, scans }) => {
  const stats = useMemo(() => {
    if (scans.length === 0) {
      return { total: 0, avgConf: '—', last: '—' };
    }
    const withConf = scans.filter((s) => s.confidence != null);
    const avg =
      withConf.length > 0
        ? Math.round(withConf.reduce((a, s) => a + (s.confidence ?? 0), 0) / withConf.length)
        : null;
    const last = new Date(scans[0].scanned_at).toLocaleString();
    return { total: scans.length, avgConf: avg != null ? `${avg}%` : '—', last };
  }, [scans]);

  return (
    <DashboardTabShell
      title="History"
      subtitle="Every menu you have scanned, with quick access to results and metadata."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={quickMetricStyle}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Total scans: <b style={{ color: 'var(--text-primary)' }}>{stats.total}</b>
          </p>
        </div>
        <div style={quickMetricStyle}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Avg confidence: <b style={{ color: 'var(--accent-primary)' }}>{stats.avgConf}</b>
          </p>
        </div>
        <div style={quickMetricStyle}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Last scan: <b style={{ color: 'var(--text-primary)' }}>{stats.last}</b>
          </p>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: '1rem', padding: '0' }}>
        <div style={{ padding: '1rem 1rem 0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem' }}>Recent activity</h3>
          <button type="button" className="btn btn-outline" style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }} onClick={() => onNavigate('Scan Menu')}>
            <ScanLine size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
            New scan
          </button>
        </div>
        <div style={{ display: 'grid' }}>
          {scans.length === 0 && (
            <p style={{ padding: '1.25rem', margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              No scans yet. Run your first menu analysis from the Scan Menu tab.
            </p>
          )}
          {scans.map((row) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                padding: '1rem',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{row.restaurant_label}</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} /> {row.location_label}
                </p>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} /> {new Date(row.scanned_at).toLocaleString()} · {row.item_count} items
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                {row.confidence != null && (
                  <MatchScorePill
                    icon={ScanLine}
                    variant={row.confidence >= 75 ? 'accent' : row.confidence >= 55 ? 'warn' : 'muted'}
                  >
                    {row.confidence}% confidence
                  </MatchScorePill>
                )}
                <button type="button" className="btn btn-outline" style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }} onClick={() => onNavigate('Recommendations')}>
                  View picks
                  <ChevronRight size={14} style={{ marginLeft: '0.2rem' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardTabShell>
  );
};

export default HistoryTab;
