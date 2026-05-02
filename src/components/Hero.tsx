import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Salad, CheckCircle } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Background Orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'var(--accent-primary)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'var(--accent-secondary)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }}></div>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.2 }}
        >
          <motion.h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Choose healthier meals <br/>
            <span style={{ color: 'var(--accent-primary)' }}>before you order.</span>
          </motion.h1>
          <motion.p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '500px' }}>
            Bite Sense scans restaurant menus and recommends the best choices based on your unique profile, dietary restrictions, and health goals.
          </motion.p>
          <motion.div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>Get Started</button>
            <button className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>View Demo</button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
          style={{ position: 'relative' }}
        >
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(41, 201, 139, 0.1)', borderRadius: '0.5rem' }}>
                  <Salad size={24} color="var(--accent-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem' }}>Grilled Salmon Bowl</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Sweetgreen</p>
                </div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} color="var(--accent-primary)" />
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>98% Match</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, background: 'var(--surface)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Calories</p>
                <p style={{ fontWeight: 600, margin: 0 }}>420 kcal</p>
              </div>
              <div style={{ flex: 1, background: 'var(--surface)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Protein</p>
                <p style={{ fontWeight: 600, margin: 0 }}>36g</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Excellent choice for your <strong style={{ color: 'var(--text-primary)' }}>high protein</strong> and <strong style={{ color: 'var(--text-primary)' }}>low sodium</strong> goals. Ask for dressing on the side.</span>
              </p>
            </div>
          </div>

          {/* Decorative floating elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="glass"
            style={{ position: 'absolute', top: '-1rem', right: '-2rem', padding: '1rem', borderRadius: '0.75rem', zIndex: 3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-highlight)' }}></div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Menu scanned</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
