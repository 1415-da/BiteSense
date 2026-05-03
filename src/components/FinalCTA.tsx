import React from 'react';
import { motion } from 'framer-motion';

interface FinalCTAProps {
  onPrimaryClick: () => void;
}

const FinalCTA: React.FC<FinalCTAProps> = ({ onPrimaryClick }) => {
  return (
    <section id="cta-scan" className="section" style={{ background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', scrollMarginTop: '5rem' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(41,201,139,0.1) 0%, rgba(11,15,20,0) 70%)', zIndex: 0 }}></div>
      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Make healthier ordering decisions in seconds.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Stop guessing and start knowing. Get the app today and take control of your diet, even when dining out.
          </p>
          <button type="button" className="btn btn-primary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.25rem', borderRadius: '2rem' }} onClick={onPrimaryClick}>Start Scanning Now</button>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
