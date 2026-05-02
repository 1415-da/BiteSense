import React from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Crosshair, HeartPulse, MessageSquareText } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    { icon: <ScanLine size={24} />, title: 'Scan Menus', desc: 'Instantly parse menus from a URL, image, or photo.' },
    { icon: <Crosshair size={24} />, title: 'Personalized Goals', desc: 'Get recommendations based on your unique fitness goals.' },
    { icon: <HeartPulse size={24} />, title: 'Nutrition-Aware', desc: 'Score meals based on precise health and dietary decisions.' },
    { icon: <MessageSquareText size={24} />, title: 'Clear Insights', desc: 'Receive simple, actionable explanations for every suggestion.' },
  ];

  return (
    <section id="features" className="section" style={{ background: 'var(--bg-primary)' }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Smarter ordering, powered by data</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>Bite Sense uses advanced analysis to break down complex menus and highlight exactly what fits your goals.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, boxShadow: 'var(--shadow-elevated)', borderColor: 'var(--accent-primary)' }}
              className="glass"
              style={{ padding: '2rem', borderRadius: '1rem', transition: 'all 0.3s ease', cursor: 'default' }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(41, 201, 139, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-glow)' }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>{feat.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
