import React, { useEffect, useState } from 'react';
import { CheckCircle2, Pencil, ShieldAlert } from 'lucide-react';

import type { HealthDto } from '../../api/workspace';
import DashboardTabShell from './DashboardTabShell';
import { quickMetricStyle } from './styles';

const ALLERGEN_OPTIONS = ['Peanuts', 'Tree nuts', 'Shellfish', 'Fish', 'Eggs', 'Dairy', 'Soy', 'Gluten', 'Sesame'] as const;
const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Pescatarian', 'Keto-friendly'] as const;

interface HealthPreferencesTabProps {
  health: HealthDto;
  onSave: (body: HealthDto) => Promise<void>;
}

const HealthPreferencesTab: React.FC<HealthPreferencesTabProps> = ({ health, onSave }) => {
  const [editing, setEditing] = useState(true);
  const [allergens, setAllergens] = useState<Set<string>>(new Set());
  const [diets, setDiets] = useState<Set<string>>(new Set());
  const [maxSodium, setMaxSodium] = useState(2000);
  const [maxSugar, setMaxSugar] = useState(40);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAllergens(new Set(health.allergens));
    setDiets(new Set(health.diets));
    setMaxSodium(health.max_sodium_mg);
    setMaxSugar(health.max_sugar_g);
  }, [health]);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, label: string) => {
    set((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const allergenSummary = health.allergens.length ? health.allergens.join(', ') : 'None selected';
  const dietSummary = health.diets.length ? health.diets.join(', ') : 'None selected';

  return (
    <DashboardTabShell
      title="Health Preferences"
      subtitle="Allergens, diet style, and guardrails—saved on your account and used as hard constraints when the ML recommendation layer scores menu items."
    >
      {!editing ? (
        <div
          className="glass"
          style={{
            borderRadius: '1rem',
            padding: '1.75rem 1.5rem',
            border: '1px solid rgba(41, 201, 139, 0.45)',
            background: 'rgba(41, 201, 139, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <CheckCircle2 size={44} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div style={{ flex: '1 1 280px', minWidth: 0 }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Your health preferences are saved</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.55, fontSize: '0.95rem' }}>
                These choices are enforced as filters and safety checks when we plug in the dish-level model—so allergens stay excluded and guardrails
                stay respected.
              </p>
              <div
                style={{
                  display: 'grid',
                  gap: '0.65rem',
                  marginBottom: '1.35rem',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  background: 'rgba(22, 28, 36, 0.5)',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Allergens to avoid:</strong> {allergenSummary}
                </p>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Dietary style:</strong> {dietSummary}
                </p>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Guardrails:</strong> max {health.max_sodium_mg} mg sodium · max {health.max_sugar_g} g
                  added sugar / day
                </p>
              </div>
              <button type="button" className="btn btn-outline" style={{ gap: '0.4rem' }} onClick={() => { setEditing(true); setError(null); }}>
                <Pencil size={16} />
                Edit preferences
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <ShieldAlert size={18} color="var(--accent-danger)" />
                <h3 style={{ fontSize: '1.05rem' }}>Allergens to avoid</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Selected allergens become strict exclusions in recommendations.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {ALLERGEN_OPTIONS.map((a) => {
                  const on = allergens.has(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggle(setAllergens, a)}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '999px',
                        border: `1px solid ${on ? 'var(--accent-danger)' : 'var(--border)'}`,
                        background: on ? 'rgba(232, 124, 110, 0.12)' : 'transparent',
                        color: on ? 'var(--accent-danger)' : 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="glass" style={{ borderRadius: '1rem', padding: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Dietary style</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {DIET_OPTIONS.map((d) => {
                  const on = diets.has(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggle(setDiets, d)}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '999px',
                        border: `1px solid ${on ? 'var(--accent-primary)' : 'var(--border)'}`,
                        background: on ? 'rgba(41, 201, 139, 0.12)' : 'transparent',
                        color: on ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="glass" style={{ borderRadius: '1rem', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Daily guardrails</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Max sodium (mg): {maxSodium}</label>
                <input type="range" min={1200} max={3000} step={50} value={maxSodium} onChange={(e) => setMaxSodium(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Max added sugar (g): {maxSugar}</label>
                <input type="range" min={10} max={80} value={maxSugar} onChange={(e) => setMaxSugar(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.75rem' }}>
              <div style={quickMetricStyle}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sodium ceiling</p>
                <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>{maxSodium} mg</p>
              </div>
              <div style={quickMetricStyle}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sugar ceiling</p>
                <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>{maxSugar} g</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={saving}
            onClick={() => {
              void (async () => {
                setError(null);
                setSaving(true);
                try {
                  const body: HealthDto = {
                    allergens: [...allergens],
                    diets: [...diets],
                    max_sodium_mg: maxSodium,
                    max_sugar_g: maxSugar,
                  };
                  await onSave(body);
                  setEditing(false);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not save preferences.');
                } finally {
                  setSaving(false);
                }
              })();
            }}
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          {error && <p style={{ marginTop: '0.85rem', marginBottom: 0, color: 'var(--accent-danger)', fontSize: '0.9rem' }}>{error}</p>}
        </>
      )}
    </DashboardTabShell>
  );
};

export default HealthPreferencesTab;
