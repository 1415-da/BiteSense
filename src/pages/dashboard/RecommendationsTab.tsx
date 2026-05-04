import React, { useMemo, useState } from 'react';
import { Filter, ScanLine, Sparkles } from 'lucide-react';

import type { DashboardTab } from './types';
import DashboardTabShell from './DashboardTabShell';
import RecommendationCard from './RecommendationCard';
import type { ScanRecommendationsPayload } from './recommendationModel';
import { inputStyle, quickMetricStyle } from './styles';

interface RecommendationsTabProps {
  onNavigate: (tab: DashboardTab) => void;
  scanRecommendations: ScanRecommendationsPayload | null;
}

const RecommendationsTab: React.FC<RecommendationsTabProps> = ({ onNavigate, scanRecommendations }) => {
  const [query, setQuery] = useState('');
  const [minScore, setMinScore] = useState(70);

  const filtered = useMemo(() => {
    if (!scanRecommendations) return [];
    return scanRecommendations.rows.filter((r) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || r.dishName.toLowerCase().includes(q);
      return matchesQuery && r.score >= minScore;
    });
  }, [scanRecommendations, query, minScore]);

  if (!scanRecommendations || scanRecommendations.rows.length === 0) {
    return (
      <DashboardTabShell
        title="Recommendations"
        subtitle="Your top-ranked dishes from the latest menu scan will appear here."
      >
        <div
          className="glass"
          style={{
            borderRadius: '1rem',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            maxWidth: '32rem',
            margin: '0 auto',
            border: '1px dashed var(--border)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1rem',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(41, 201, 139, 0.1)',
              border: '1px solid rgba(41, 201, 139, 0.35)',
              color: 'var(--accent-primary)',
            }}
          >
            <ScanLine size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Scan a menu to get recommendations</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem', lineHeight: 1.55 }}>
            Upload a PDF or image, or paste a menu link on the Scan Menu tab. When processing finishes, open recommendations
            to see cards for your best matches.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('Scan Menu')}>
            Go to Scan Menu
          </button>
        </div>
      </DashboardTabShell>
    );
  }

  const subtitle = `From your latest scan${scanRecommendations.restaurantLabel ? ` · ${scanRecommendations.restaurantLabel}` : ''}${
    scanRecommendations.location ? ` · ${scanRecommendations.location}` : ''
  }.`;

  return (
    <DashboardTabShell title="Recommendations" subtitle={subtitle}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Filter size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Filters</h3>
          </div>
          <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Search dishes</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. salmon, salad…" style={{ ...inputStyle, marginBottom: '1rem' }} />
          <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Minimum match score: {minScore}</label>
          <input type="range" min={60} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Scan summary</h3>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div style={quickMetricStyle}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Showing <b style={{ color: 'var(--text-primary)' }}>{filtered.length}</b> of {scanRecommendations.rows.length} ranked dishes
              </p>
            </div>
            <div style={quickMetricStyle}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Last processed: <b style={{ color: 'var(--text-primary)' }}>{scanRecommendations.lastScanAt}</b>
              </p>
            </div>
            {scanRecommendations.confidence != null && (
              <div style={quickMetricStyle}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Parse confidence: <b style={{ color: 'var(--accent-primary)' }}>{scanRecommendations.confidence}%</b>
                </p>
              </div>
            )}
          </div>
          <button type="button" className="btn btn-outline" style={{ marginTop: '0.85rem', width: '100%' }} onClick={() => onNavigate('Scan Menu')}>
            New scan
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {filtered.map((row) => (
          <RecommendationCard key={row.id} data={row} isTopMatch={row.rank === 1} />
        ))}
        {filtered.length === 0 && (
          <div className="glass" style={{ borderRadius: '1rem', padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No dishes match your filters. Try lowering the minimum score or clearing search.
          </div>
        )}
      </div>
    </DashboardTabShell>
  );
};

export default RecommendationsTab;
