import React from 'react';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  const steps = [
    { num: '01', title: 'Upload a menu', desc: 'Paste a restaurant link or snap a photo of the menu.' },
    { num: '02', title: 'Set your profile', desc: 'Input your goals, restrictions, and preferences.' },
    { num: '03', title: 'Get smart picks', desc: 'Instantly view the healthiest choices and modifications.' },
  ];

  return (
    <section id="how-it-works" className="section" style={{ background: 'var(--bg-secondary)' }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 style={{ fontSize: '2.5rem' }}>How It Works</h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '2px', background: 'var(--border)', zIndex: 0 }} className="desktop-only-line"></div>

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
            >
              <div style={{ width: '48px', height: '48px', margin: '0 auto 1.5rem', background: 'var(--bg-primary)', border: '2px solid var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--accent-primary)', boxShadow: 'var(--shadow-glow)' }}>
                {step.num}
              </div>
              <motion.div 
                className="glass" 
                style={{ padding: '2rem', borderRadius: '1rem', transition: 'border-color 0.4s ease' }}
                whileHover={{ scale: 1.02, borderColor: 'var(--accent-primary)', transition: { duration: 0.4 } }}
              >
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{step.desc}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
