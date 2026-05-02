import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NavbarProps {
  onAuthClick: (type: 'signin' | 'signup') => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAuthClick }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: scrolled ? '1rem 2rem' : '1.5rem 2rem',
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(11, 15, 20, 0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--accent-primary)' }}></div>
        Bite Sense
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        {['Features', 'How It Works', 'Privacy', 'Contact'].map((item) => (
          <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {item}
          </a>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn btn-outline" onClick={() => onAuthClick('signin')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Sign In</button>
        <button className="btn btn-primary" onClick={() => onAuthClick('signup')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Sign Up</button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
