import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import previewImage from '../assets/image.png';

const Personalization: React.FC = () => {
  const chips = ['Weight loss', 'Muscle gain', 'Low sodium', 'High protein', 'Diabetic-friendly', 'Vegetarian', 'Gluten-free'];

  return (
    <section className="section" style={{ background: 'var(--bg-primary)' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Tailored to your unique body.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '2rem' }}>No two diets are the same. Customize your Bite Sense profile to filter out what you don't want, and highlight what you need.</p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {chips.map((chip, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(41, 201, 139, 0.15)', borderColor: 'var(--accent-primary)', transition: { duration: 0.4 } }}
                style={{ padding: '0.5rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '2rem', fontSize: '0.875rem', color: i < 3 ? 'var(--accent-primary)' : 'var(--text-secondary)', borderColor: i < 3 ? 'var(--accent-primary)' : 'var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.4s ease' }}
              >
                {i < 3 && <Check size={14} />}
                {chip}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
           <img 
             src={previewImage} 
             alt="Bite Sense Personalization Preview" 
             style={{ width: '100%', height: 'auto', borderRadius: '1rem', boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--border)' }} 
           />
        </motion.div>
      </div>
    </section>
  );
};

export default Personalization;
