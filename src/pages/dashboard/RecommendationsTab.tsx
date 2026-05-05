import React, { useEffect, useMemo, useState } from 'react';
import { Filter, ScanLine, ShieldAlert, Target } from 'lucide-react';

import type { GoalsDto, HealthDto } from '../../api/workspace';
import type { DashboardTab } from './types';
import DashboardTabShell from './DashboardTabShell';
import RecommendationCard from './RecommendationCard';
import type { ScanRecommendationsPayload } from './recommendationModel';
import { inputStyle } from './styles';

const TOP_MATCH_LIMIT = 6;

const inputCompact = {
  ...inputStyle,
  padding: '0.5rem 0.65rem',
  fontSize: '0.875rem',
  marginBottom: '0.5rem',
} as const;

interface RecommendationsTabProps {
  onNavigate: (tab: DashboardTab) => void;
  scanRecommendations: ScanRecommendationsPayload | null;
  goals: GoalsDto;
  health: HealthDto;
}

const GoalsGuardrailsSnapshot: React.FC<{ goals: GoalsDto; health: HealthDto }> = ({ goals, health }) => (
  <div
    className="glass"
    style={{
      borderRadius: '0.75rem',
      padding: '0.6rem 0.75rem',
      flex: '1 1 260px',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.45rem',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <Target size={15} color="var(--accent-primary)" strokeWidth={2.25} />
      <h3 style={{ fontSize: '0.82rem', margin: 0, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Goals & guardrails
      </h3>
    </div>
    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
      <span style={{ color: 'var(--text-muted)' }}>Goal</span>{' '}
      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{goals.primary_goal}</span>
      {' · '}
      <span style={{ color: 'var(--text-muted)' }}>Weight</span>{' '}
      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{goals.target_weight_kg} kg</span>
      {' · '}
      <span style={{ color: 'var(--text-muted)' }}>Activity</span>{' '}
      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{goals.workouts_per_week}/wk</span>
    </p>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem',
        fontSize: '0.72rem',
        color: 'var(--text-secondary)',
      }}
    >
      <span style={{ padding: '0.25rem 0.45rem', borderRadius: '0.45rem', border: '1px solid rgba(41, 201, 139, 0.45)', background: 'rgba(41, 201, 139, 0.1)' }}>
        P {goals.protein_g}g
      </span>
      <span style={{ padding: '0.25rem 0.45rem', borderRadius: '0.45rem', border: '1px solid var(--border)', background: 'rgba(22, 28, 36, 0.45)' }}>
        C {goals.carbs_g}g
      </span>
      <span style={{ padding: '0.25rem 0.45rem', borderRadius: '0.45rem', border: '1px solid var(--border)', background: 'rgba(22, 28, 36, 0.45)' }}>
        F {goals.fat_g}g
      </span>
      <span style={{ padding: '0.25rem 0.45rem', borderRadius: '0.45rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(22, 28, 36, 0.35)' }}>
        Na ≤{health.max_sodium_mg} mg
      </span>
      <span style={{ padding: '0.25rem 0.45rem', borderRadius: '0.45rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(22, 28, 36, 0.35)' }}>
        Sugar ≤{health.max_sugar_g} g
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
      <ShieldAlert size={12} color="var(--accent-danger)" />
      <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Allergens
      </span>
      {health.allergens.length === 0 ? (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>None set</span>
      ) : (
        health.allergens.map((a) => (
          <span
            key={a}
            style={{
              padding: '0.18rem 0.45rem',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 600,
              border: '1px solid rgba(232, 124, 110, 0.55)',
              background: 'rgba(232, 124, 110, 0.12)',
              color: 'var(--accent-danger)',
            }}
          >
            {a}
          </span>
        ))
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Diets</span>
      {health.diets.length === 0 ? (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>None set</span>
      ) : (
        health.diets.map((d) => (
          <span
            key={d}
            style={{
              padding: '0.18rem 0.45rem',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 600,
              border: '1px solid rgba(41, 201, 139, 0.5)',
              background: 'rgba(41, 201, 139, 0.12)',
              color: 'var(--accent-primary)',
            }}
          >
            {d}
          </span>
        ))
      )}
    </div>
  </div>
);

const RecommendationsTab: React.FC<RecommendationsTabProps> = ({ onNavigate, scanRecommendations, goals, health }) => {
  const [queryDraft, setQueryDraft] = useState('');
  const [minScoreDraft, setMinScoreDraft] = useState(70);
  const [queryApplied, setQueryApplied] = useState('');
  const [minScoreApplied, setMinScoreApplied] = useState(70);

  useEffect(() => {
    if (!scanRecommendations) return;
    setQueryDraft('');
    setQueryApplied('');
    setMinScoreDraft(70);
    setMinScoreApplied(70);
  }, [scanRecommendations?.lastScanAt]);

  const filtered = useMemo(() => {
    if (!scanRecommendations) return [];
    return scanRecommendations.rows.filter((r) => {
      const q = queryApplied.trim().toLowerCase();
      const matchesQuery = !q || r.dishName.toLowerCase().includes(q);
      return matchesQuery && r.score >= minScoreApplied;
    });
  }, [scanRecommendations, queryApplied, minScoreApplied]);

  const gridRows = useMemo(() => filtered.slice(0, TOP_MATCH_LIMIT), [filtered]);

  const handleApply = () => {
    setQueryApplied(queryDraft.trim());
    setMinScoreApplied(minScoreDraft);
  };

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
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '0.85rem',
          alignItems: 'stretch',
        }}
      >
        <div
          className="glass"
          style={{
            borderRadius: '0.75rem',
            padding: '0.6rem 0.75rem',
            flex: '1 1 280px',
            maxWidth: '520px',
            minWidth: '240px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem' }}>
            <Filter size={15} color="var(--accent-primary)" strokeWidth={2.25} />
            <h3 style={{ fontSize: '0.82rem', margin: 0, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Filters
            </h3>
          </div>
          <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Search dishes
          </label>
          <input
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            placeholder="e.g. salmon, salad…"
            style={{ ...inputCompact }}
          />
          <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Min score · {minScoreDraft}
          </label>
          <input
            type="range"
            min={60}
            max={100}
            value={minScoreDraft}
            onChange={(e) => setMinScoreDraft(Number(e.target.value))}
            style={{ width: '100%', marginBottom: '0.5rem', height: '6px', accentColor: 'var(--accent-primary)' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
            <button type="button" className="btn btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }} onClick={handleApply}>
              Apply filters
            </button>
            <button type="button" className="btn btn-outline" style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }} onClick={() => onNavigate('Scan Menu')}>
              New scan
            </button>
          </div>
        </div>
        <GoalsGuardrailsSnapshot goals={goals} health={health} />
      </div>

      {gridRows.length > 0 && (
        <h2
          style={{
            margin: '0 0 0.65rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}
        >
          Top Matches
        </h2>
      )}

      <div className="recommendations-matches-grid">
        {gridRows.map((row) => (
          <RecommendationCard key={row.id} data={row} isTopMatch={row.rank === 1} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="glass" style={{ borderRadius: '1rem', padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          No dishes match your filters. Try lowering the minimum score or clearing search, then Apply.
        </div>
      )}
    </DashboardTabShell>
  );
};

export default RecommendationsTab;
