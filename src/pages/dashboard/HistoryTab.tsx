import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, MapPin, ScanLine } from 'lucide-react';

import type { DashboardTab } from './types';
import type { MenuScanSummaryDto } from '../../api/workspace';
import AnimatedGlassCard from './AnimatedGlassCard';
import AnimatedMetricTile from './AnimatedMetricTile';
import DashboardTabShell from './DashboardTabShell';
import MatchScorePill from './MatchScorePill';
import { staggerContainer, springGentle } from './dashboardMotion';

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
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <AnimatedMetricTile>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Total scans: <b style={{ color: 'var(--text-primary)' }}>{stats.total}</b>
          </p>
        </AnimatedMetricTile>
        <AnimatedMetricTile delay={0.05}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Avg confidence: <b style={{ color: 'var(--accent-primary)' }}>{stats.avgConf}</b>
          </p>
        </AnimatedMetricTile>
        <AnimatedMetricTile delay={0.1}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Last scan: <b style={{ color: 'var(--text-primary)' }}>{stats.last}</b>
          </p>
        </AnimatedMetricTile>
      </motion.div>

      <AnimatedGlassCard padding="0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1rem 0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Recent activity</h3>
          <motion.button
            type="button"
            className="btn btn-outline"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('Scan Menu')}
          >
            <ScanLine size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
            New scan
          </motion.button>
        </div>
        <div style={{ display: 'grid' }}>
          {scans.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: '1.25rem', margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}
            >
              No scans yet. Run your first menu analysis from the Scan Menu tab.
            </motion.p>
          )}
          {scans.map((row, i) => (
            <motion.div
              key={row.id}
              className="dashboard-history-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springGentle, delay: 0.08 + i * 0.05 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                padding: '1rem',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              <motion.div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{row.restaurant_label}</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} /> {row.location_label}
                </p>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} /> {new Date(row.scanned_at).toLocaleString()} · {row.item_count} items
                </p>
              </motion.div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                {row.confidence != null && (
                  <MatchScorePill
                    icon={ScanLine}
                    variant={row.confidence >= 75 ? 'accent' : row.confidence >= 55 ? 'warn' : 'muted'}
                  >
                    {row.confidence}% confidence
                  </MatchScorePill>
                )}
                <motion.button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('Recommendations')}
                >
                  View picks
                  <ChevronRight size={14} style={{ marginLeft: '0.2rem' }} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedGlassCard>
    </DashboardTabShell>
  );
};

export default HistoryTab;
