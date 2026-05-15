import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Flame, Pencil, Target } from 'lucide-react';

import type { GoalsDto } from '../../api/workspace';
import AnimatedGlassCard from './AnimatedGlassCard';
import AnimatedMetricTile from './AnimatedMetricTile';
import DashboardTabShell from './DashboardTabShell';
import { scaleIn, springGentle, staggerContainer } from './dashboardMotion';
import { inputStyle } from './styles';

const GOAL_OPTIONS = ['Weight loss', 'Muscle gain', 'Maintenance', 'Athletic performance'] as const;

interface ProfileGoalsTabProps {
  goals: GoalsDto;
  onSave: (body: GoalsDto) => Promise<void>;
}

const ProfileGoalsTab: React.FC<ProfileGoalsTabProps> = ({ goals, onSave }) => {
  const [editing, setEditing] = useState(true);
  const [primaryGoal, setPrimaryGoal] = useState<string>('Weight loss');
  const [targetWeight, setTargetWeight] = useState('72');
  const [activity, setActivity] = useState('4');
  const [protein, setProtein] = useState(120);
  const [carbs, setCarbs] = useState(180);
  const [fat, setFat] = useState(55);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrimaryGoal(goals.primary_goal);
    setTargetWeight(goals.target_weight_kg);
    setActivity(String(goals.workouts_per_week));
    setProtein(goals.protein_g);
    setCarbs(goals.carbs_g);
    setFat(goals.fat_g);
  }, [goals]);

  return (
    <DashboardTabShell
      title="Profile & Goals"
      subtitle="Set your targets here—saved goals are stored on your account and will feed the menu scoring / ML layer when that pipeline is connected."
    >
      <AnimatePresence mode="wait">
        {!editing ? (
          <motion.div
            key="saved"
            className="glass glass-card-interactive dashboard-success-panel"
            initial={scaleIn.initial}
            animate={scaleIn.animate}
            exit={scaleIn.exit}
            transition={springGentle}
          >
            <motion.div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <CheckCircle2 size={44} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
              <motion.div style={{ flex: '1 1 280px', minWidth: 0 }}>
                <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Your goals are saved</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.55, fontSize: '0.95rem' }}>
                  We&apos;ll use these numbers to rank meals and match portions when the recommendation model runs on your scans. You can update them anytime.
                </p>
                <AnimatedGlassCard hoverLift={false} style={{ marginBottom: '1.35rem', background: 'rgba(22, 28, 36, 0.5)' }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Primary goal:</strong> {goals.primary_goal}
                  </p>
                  <p style={{ margin: '0.65rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Target weight:</strong> {goals.target_weight_kg} kg ·{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>Activity:</strong> {goals.workouts_per_week} workouts / week
                  </p>
                  <p style={{ margin: '0.65rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Daily macros:</strong> {goals.protein_g}g protein · {goals.carbs_g}g carbs · {goals.fat_g}g fat
                  </p>
                </AnimatedGlassCard>
                <motion.button
                  type="button"
                  className="btn btn-outline"
                  style={{ gap: '0.4rem' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setEditing(true); setError(null); }}
                >
                  <Pencil size={16} />
                  Edit goals
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={springGentle}>
            <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }} variants={staggerContainer} initial="initial" animate="animate">
              <AnimatedGlassCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Target size={18} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Primary goal</h3>
                </div>
                <motion.div style={{ display: 'grid', gap: '0.5rem' }}>
                  {GOAL_OPTIONS.map((g) => {
                    const active = primaryGoal === g;
                    return (
                      <motion.button
                        key={g}
                        type="button"
                        className="dashboard-chip-btn"
                        onClick={() => setPrimaryGoal(g)}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          textAlign: 'left',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '0.65rem',
                          border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
                          background: active ? 'rgba(41, 201, 139, 0.1)' : 'transparent',
                          color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        {g}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </AnimatedGlassCard>

              <AnimatedGlassCard delay={0.06}>
                <motion.div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Flame size={18} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Body & activity</h3>
                </motion.div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target weight (kg)</label>
                <input value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} style={{ ...inputStyle, marginBottom: '0.85rem' }} />
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Workouts per week</label>
                <input type="number" min={0} max={14} value={activity} onChange={(e) => setActivity(e.target.value)} style={inputStyle} />
              </AnimatedGlassCard>
            </motion.div>

            <AnimatedGlassCard style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Daily macro targets (grams)</h3>
              <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
                <motion.div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Protein: {protein}g</label>
                  <input type="range" min={60} max={220} value={protein} onChange={(e) => setProtein(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
                </motion.div>
                <motion.div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Carbs: {carbs}g</label>
                  <input type="range" min={80} max={350} value={carbs} onChange={(e) => setCarbs(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
                </motion.div>
                <motion.div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fat: {fat}g</label>
                  <input type="range" min={35} max={120} value={fat} onChange={(e) => setFat(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
                </motion.div>
              </motion.div>
              <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.65rem', marginTop: '0.75rem' }} variants={staggerContainer} initial="initial" animate="animate">
                <AnimatedMetricTile>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Protein / day</p>
                  <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>{protein} g</p>
                </AnimatedMetricTile>
                <AnimatedMetricTile delay={0.05}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Carbs / day</p>
                  <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>{carbs} g</p>
                </AnimatedMetricTile>
                <AnimatedMetricTile delay={0.1}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fat / day</p>
                  <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>{fat} g</p>
                </AnimatedMetricTile>
              </motion.div>
            </AnimatedGlassCard>

            <motion.button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                void (async () => {
                  setError(null);
                  setSaving(true);
                  try {
                    const body: GoalsDto = {
                      primary_goal: primaryGoal,
                      target_weight_kg: targetWeight.trim() || '72',
                      workouts_per_week: Math.min(14, Math.max(0, Number(activity) || 0)),
                      protein_g: protein,
                      carbs_g: carbs,
                      fat_g: fat,
                    };
                    await onSave(body);
                    setEditing(false);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Could not save goals.');
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
            >
              {saving ? 'Saving…' : 'Save goals'}
            </motion.button>
            {error && <p style={{ marginTop: '0.85rem', marginBottom: 0, color: 'var(--accent-danger)', fontSize: '0.9rem' }}>{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardTabShell>
  );
};

export default ProfileGoalsTab;
