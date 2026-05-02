import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Shield, Award } from 'lucide-react';

const ValueStrip: React.FC = () => {
  const values = [
    { icon: <Target size={20} />, text: 'Personalized recommendations' },
    { icon: <Zap size={20} />, text: 'Fast menu scanning' },
    { icon: <Shield size={20} />, text: 'Private user profiles' },
    { icon: <Award size={20} />, text: 'Goal-based scoring' },
  ];

  return (
    <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '2rem 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {values.map((value, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}
          >
            <div style={{ color: 'var(--accent-primary)' }}>{value.icon}</div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ValueStrip;
