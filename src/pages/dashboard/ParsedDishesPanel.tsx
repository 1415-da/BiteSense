import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, List, Pencil } from 'lucide-react';

import type { MenuDishDto } from '../../api/workspace';
import { fadeUp, scaleIn, springGentle } from './dashboardMotion';
import { inputStyle } from './styles';

import './dashboard-animations.css';

interface ParsedDishesPanelProps {
  items: MenuDishDto[];
  selectedIdx: number;
  onSelectIdx: (idx: number) => void;
  onChangeItems: React.Dispatch<React.SetStateAction<MenuDishDto[]>>;
}

function ingredientLabel(row: MenuDishDto): string {
  if (row.ingredients.length > 0) return row.ingredients.join(', ');
  return row.description?.trim() || 'No ingredients listed';
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

const ParsedDishesPanel: React.FC<ParsedDishesPanelProps> = ({
  items,
  selectedIdx,
  onSelectIdx,
  onChangeItems,
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const idx = Math.min(selectedIdx, Math.max(0, items.length - 1));
  const item = items[idx];

  return (
    <motion.div
      className="parsed-dishes-panel"
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      transition={springGentle}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Parsed dishes ({items.length})</h3>
      </div>

      <label
        htmlFor="parsed-dish-picker"
        style={{
          display: 'block',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.35rem',
        }}
      >
        Select dish
      </label>
      <motion.div
        className="parsed-dishes-select-wrap"
        style={{ position: 'relative', marginBottom: '0.5rem' }}
        whileTap={{ scale: 0.995 }}
      >
        <ChevronDown
          size={18}
          style={{
            position: 'absolute',
            right: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
          }}
        />
        <select
          id="parsed-dish-picker"
          className="parsed-dishes-select"
          value={idx}
          onChange={(e) => onSelectIdx(Number(e.target.value))}
          style={{ ...inputStyle, paddingRight: '2.25rem', appearance: 'none' }}
        >
          {items.map((d, i) => (
            <option key={`pick-${i}`} value={i}>
              {d.name} — {truncate(ingredientLabel(d), 48)}
            </option>
          ))}
        </select>
      </motion.div>

      <AnimatePresence mode="wait">
        {item && (
          <motion.div
            key={`preview-${idx}-${item.name}`}
            className="parsed-dishes-preview"
            initial={scaleIn.initial}
            animate={scaleIn.animate}
            exit={scaleIn.exit}
            transition={{ duration: 0.22 }}
          >
            <strong>{item.name}</strong>
            <br />
            {ingredientLabel(item)}
          </motion.div>
        )}
      </AnimatePresence>

      <details className="parsed-dishes-details glass-card-interactive" style={{ marginTop: '0.75rem', borderRadius: '0.65rem', padding: '0.65rem 0.85rem' }}>
        <summary style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <List size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
          View full menu table
        </summary>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          style={{ marginTop: '0.75rem' }}
        >
          <motion.div className="parsed-dishes-table-wrap">
            <table className="parsed-dishes-table">
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Ingredients used</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, rowIdx) => (
                  <tr
                    key={`dish-row-${rowIdx}`}
                    className={rowIdx === idx ? 'is-selected' : undefined}
                    onClick={() => onSelectIdx(rowIdx)}
                  >
                    <td>{row.name}</td>
                    <td className="col-ingredients">{ingredientLabel(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      </details>

      {item && (
        <div style={{ marginTop: '0.65rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
            onClick={() => setEditOpen((o) => !o)}
          >
            <Pencil size={14} />
            {editOpen ? 'Hide edit fields' : 'Edit selected dish'}
          </button>

          <AnimatePresence>
            {editOpen && (
              <motion.div
                className="glass-card-interactive"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={springGentle}
                style={{
                  overflow: 'hidden',
                  marginTop: '0.65rem',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  border: '1px solid var(--border)',
                  background: 'rgba(0,0,0,0.15)',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <motion.div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      justifyContent: 'flex-end',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                      onClick={() => onChangeItems((current) => current.filter((_, i) => i !== idx))}
                    >
                      Remove dish
                    </button>
                  </motion.div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Dish name
                    </label>
                    <input
                      value={item.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        onChangeItems((cur) => {
                          const n = [...cur];
                          n[idx] = { ...n[idx], name: v };
                          return n;
                        });
                      }}
                      style={inputStyle}
                    />
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Description
                    </label>
                    <textarea
                      value={item.description ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        onChangeItems((cur) => {
                          const n = [...cur];
                          n[idx] = { ...n[idx], description: v.trim() ? v : null };
                          return n;
                        });
                      }}
                      rows={2}
                      placeholder="Preparation, sides, sauces…"
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '2.75rem' }}
                    />
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Details
                    </label>
                    <input
                      value={item.details ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        onChangeItems((cur) => {
                          const n = [...cur];
                          n[idx] = { ...n[idx], details: v.trim() ? v : null };
                          return n;
                        });
                      }}
                      placeholder="Portion / calories (e.g. 456g / 585 kcal)"
                      style={inputStyle}
                    />
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Ingredients
                    </label>
                    <input
                      value={item.ingredients.join(', ')}
                      onChange={(e) => {
                        const ing = e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        onChangeItems((cur) => {
                          const n = [...cur];
                          n[idx] = { ...n[idx], ingredients: ing };
                          return n;
                        });
                      }}
                      placeholder="Comma-separated (e.g. paneer, tomato, cream)"
                      style={inputStyle}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default ParsedDishesPanel;
