import React from 'react';
import { motion } from 'framer-motion';
import previewImage from '../assets/image copy.png';

interface HeroProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted, onSignIn }) => {
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
            <button type="button" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }} onClick={onGetStarted}>Get Started</button>
            <button type="button" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }} onClick={onSignIn}>Sign In</button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
          style={{ position: 'relative' }}
        >
          <img src={previewImage} alt="Hero Mockup" style={{ width: '100%', height: 'auto', borderRadius: '1rem', boxShadow: 'var(--shadow-elevated)' }} />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
