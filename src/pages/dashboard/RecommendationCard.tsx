import React from 'react';
import { Check, SlidersHorizontal, Sparkles, Star, Target } from 'lucide-react';

import type { RecommendationCardData } from './recommendationModel';
import MatchScorePill from './MatchScorePill';

import cardFood from '../../assets/image.png';

interface MacroRowProps {
  label: string;
  grams: number;
  fillPct: number;
}

const MacroRow: React.FC<MacroRowProps> = ({ label, grams, fillPct }) => (
  <div style={{ marginBottom: '0.65rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{grams}g</span>
    </div>
    <div
      style={{
        height: '6px',
        borderRadius: '999px',
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${fillPct}%`,
          borderRadius: '999px',
          background: 'linear-gradient(90deg, #1a8f5c, var(--accent-primary))',
          boxShadow: '0 0 12px rgba(41, 201, 139, 0.45)',
        }}
      />
    </div>
  </div>
);

interface RecommendationCardProps {
  data: RecommendationCardData;
  isTopMatch: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ data, isTopMatch }) => {
  const metaLine = [data.restaurant, data.mealType, `${data.calories} kcal`].filter(Boolean).join(' · ');

  return (
    <div
      className="recommendation-card-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 340px) 1fr',
        gap: 0,
        borderRadius: '1.15rem',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(12, 16, 22, 0.42)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div style={{ position: 'relative', minHeight: '220px', background: '#0a0e12' }}>
        <img
          src={cardFood}
          alt={data.dishName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '260px' }}
        />
        <div
          style={{
            position: 'absolute',
            left: '0.85rem',
            bottom: '0.85rem',
            padding: '0.35rem 0.45rem',
            borderRadius: '0.75rem',
            background: 'rgba(8, 24, 18, 0.9)',
            border: '1px solid rgba(41, 201, 139, 0.4)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <MatchScorePill icon={Star} variant="accent">
            {data.score} / 100
          </MatchScorePill>
        </div>
      </div>

      <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {isTopMatch && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              alignSelf: 'flex-start',
              padding: '0.28rem 0.65rem',
              borderRadius: '999px',
              border: '1px solid var(--accent-primary)',
              color: 'var(--accent-primary)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.35rem',
            }}
          >
            <Target size={12} />
            Top match
          </div>
        )}

        <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{data.dishName}</h3>
        <p style={{ margin: '0.15rem 0 0.85rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>{metaLine}</p>

        <div style={{ marginBottom: '0.5rem' }}>
          <MacroRow label="Protein" grams={data.proteinG} fillPct={data.proteinFill} />
          <MacroRow label="Carbs" grams={data.carbsG} fillPct={data.carbsFill} />
          <MacroRow label="Fat" grams={data.fatG} fillPct={data.fatFill} />
        </div>

        <div style={{ marginTop: '0.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--accent-primary)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.45rem',
            }}
          >
            <Sparkles size={14} />
            Why it matches
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.45rem' }}>
            {data.whyMatch.map((line) => (
              <li key={line} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <Check size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--accent-primary)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '0.45rem',
            }}
          >
            <SlidersHorizontal size={14} />
            Smart modifications
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.4rem' }}>
            {data.smartMods.map((line) => (
              <li key={line} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <span style={{ color: 'var(--accent-primary)', marginTop: '0.35rem', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0 }} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
