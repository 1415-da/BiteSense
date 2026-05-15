import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2 } from 'lucide-react';

import type { DashboardTab } from './types';
import AnimatedGlassCard from './AnimatedGlassCard';
import DashboardTabShell from './DashboardTabShell';
import type { SavedMealDto } from '../../api/workspace';
import { staggerContainer, staggerItem, springGentle } from './dashboardMotion';
import { inputStyle, quickMetricStyle } from './styles';

interface SavedMealsTabProps {
  onNavigate: (tab: DashboardTab) => void;
  meals: SavedMealDto[];
  onAdd: (body: { dish_name: string; restaurant: string; note: string }) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}

const SavedMealsTab: React.FC<SavedMealsTabProps> = ({ onNavigate, meals, onAdd, onRemove }) => {
  const [draftName, setDraftName] = useState('');
  const [draftRestaurant, setDraftRestaurant] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <DashboardTabShell
      title="Saved Meals"
      subtitle="Bookmark dishes you want to order again—notes stay with each save."
    >
      <motion.div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }} variants={staggerContainer} initial="initial" animate="animate">
        <AnimatedGlassCard>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Add a save manually</h3>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            <input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Dish name" style={inputStyle} />
            <input value={draftRestaurant} onChange={(e) => setDraftRestaurant(e.target.value)} placeholder="Restaurant" style={inputStyle} />
            <input value={draftNote} onChange={(e) => setDraftNote(e.target.value)} placeholder="Note (optional)" style={inputStyle} />
          </div>
          <motion.button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '0.85rem' }}
            disabled={busy}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              void (async () => {
                if (!draftName.trim()) return;
                setError(null);
                setBusy(true);
                try {
                  await onAdd({
                    dish_name: draftName.trim(),
                    restaurant: draftRestaurant.trim() || 'Unknown',
                    note: draftNote.trim(),
                  });
                  setDraftName('');
                  setDraftRestaurant('');
                  setDraftNote('');
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not save meal.');
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            Save meal
          </motion.button>
          {error && <p style={{ marginTop: '0.65rem', marginBottom: 0, fontSize: '0.85rem', color: 'var(--accent-danger)' }}>{error}</p>}
        </AnimatedGlassCard>

        <AnimatedGlassCard delay={0.06}>
          <motion.div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Heart size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Library</h3>
          </motion.div>
          <div style={quickMetricStyle}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Saved meals: <b style={{ color: 'var(--text-primary)' }}>{meals.length}</b>
            </p>
          </div>
          <motion.button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: '0.85rem', width: '100%' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('Recommendations')}
          >
            Browse recommendations
          </motion.button>
        </AnimatedGlassCard>
      </motion.div>

      <motion.div style={{ display: 'grid', gap: '0.75rem' }} variants={staggerContainer} initial="initial" animate="animate">
        {meals.map((meal) => (
          <motion.div
            key={meal.id}
            className="glass glass-card-interactive"
            variants={staggerItem}
            transition={springGentle}
            whileHover={{ y: -2 }}
            style={{ borderRadius: '1rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>{meal.dish_name}</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{meal.restaurant}</p>
              {meal.note && <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>{meal.note}</p>}
            </div>
            <motion.button
              type="button"
              className="btn btn-outline"
              style={{ alignSelf: 'flex-start', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)', gap: '0.35rem' }}
              disabled={busy}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    await onRemove(meal.id);
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              <Trash2 size={16} />
              Remove
            </motion.button>
          </motion.div>
        ))}
      </motion.div>
    </DashboardTabShell>
  );
};

export default SavedMealsTab;
