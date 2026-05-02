import React from 'react';
import { motion } from 'framer-motion';
import previewImage from '../assets/image copy.png';

const Recommendation: React.FC = () => {
  return (
    <section className="section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem' }}>Understand exactly what you're eating.</h2>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', borderRadius: '1rem', borderTop: '4px solid var(--accent-secondary)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <img src={previewImage} alt="Dish Thumbnail" style={{ width: '100px', height: '100px', borderRadius: '0.75rem', objectFit: 'cover', boxShadow: 'var(--shadow-elevated)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Quinoa & Roasted Veggie Salad</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Base Match Score: <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>85%</span></p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', background: 'var(--surface)', borderRadius: '2rem', fontSize: '0.875rem', border: '1px solid var(--border)' }}>Vegan</span>
                    <span style={{ padding: '0.25rem 0.75rem', background: 'var(--surface)', borderRadius: '2rem', fontSize: '0.875rem', border: '1px solid var(--border)' }}>High Fiber</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Calories</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>380</div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Protein</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>14g</div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Carbs</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>45g</div>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Fat</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>16g</div>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-secondary)' }}>Suggested Modifications</h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong style={{ color: 'var(--text-primary)' }}>Ask for dressing on the side</strong> to control sodium and calorie intake.</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Add grilled tofu</strong> for an extra 10g of plant-based protein.</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Skip the dried cranberries</strong> if you want to reduce added sugars.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Recommendation;
