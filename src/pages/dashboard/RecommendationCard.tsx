import React from 'react';
import { Check, SlidersHorizontal, Sparkles, Star, Target } from 'lucide-react';

import type { RecommendationCardData } from './recommendationModel';
import MatchScorePill from './MatchScorePill';

interface MacroRowProps {
  label: string;
  grams: number;
  fillPct: number;
}

const MacroRow: React.FC<MacroRowProps> = ({ label, grams, fillPct }) => (
  <div style={{ marginBottom: '0.45rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{grams}g</span>
    </div>
    <div
      style={{
        height: '4px',
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
          boxShadow: '0 0 10px rgba(41, 201, 139, 0.4)',
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
      className="recommendation-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(12, 16, 22, 0.5)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div
        style={{
          padding: '1rem 1rem 0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.65rem',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          {isTopMatch && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginBottom: '0.35rem',
                padding: '0.22rem 0.55rem',
                borderRadius: '999px',
                border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <Target size={11} />
              Top match
            </div>
          )}
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{data.dishName}</h3>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>{metaLine}</p>
        </div>
        <MatchScorePill icon={Star} variant="accent">
          {data.score} / 100
        </MatchScorePill>
      </div>

      <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ marginBottom: '0.45rem' }}>
          <MacroRow label="Protein" grams={data.proteinG} fillPct={data.proteinFill} />
          <MacroRow label="Carbs" grams={data.carbsG} fillPct={data.carbsFill} />
          <MacroRow label="Fat" grams={data.fatG} fillPct={data.fatFill} />
        </div>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.5rem',
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
          }}
          className="no-scrollbar"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--accent-primary)',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '0.35rem',
            }}
          >
            <Sparkles size={12} />
            Why it matches
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.35rem' }}>
            {data.whyMatch.map((line) => (
              <li key={line} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <Check size={14} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '0.08rem' }} />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--accent-primary)',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginTop: '0.55rem',
              marginBottom: '0.35rem',
            }}
          >
            <SlidersHorizontal size={12} />
            Smart modifications
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.32rem' }}>
            {data.smartMods.map((line) => (
              <li key={line} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <span
                  style={{
                    color: 'var(--accent-primary)',
                    marginTop: '0.32rem',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    flexShrink: 0,
                  }}
                />
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
