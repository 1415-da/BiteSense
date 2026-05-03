import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import type { LegalDialogKind } from './InfoDialog';

interface NavbarProps {
  onAuthClick: (type: 'signin' | 'signup') => void;
  onLegalOpen: (kind: LegalDialogKind) => void;
}

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Navbar: React.FC<NavbarProps> = ({ onAuthClick, onLegalOpen }) => {
  const { user, loading, logout } = useAuth();
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
      <a
        href="#top"
        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}
      >
        <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--accent-primary)' }}></div>
        Bite Sense
      </a>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <a href="#features" onClick={(e) => { e.preventDefault(); scrollToId('features'); }} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Features</a>
        <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToId('how-it-works'); }} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>How It Works</a>
        <a href="#privacy-policy" onClick={(e) => { e.preventDefault(); onLegalOpen('privacy'); }} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Privacy</a>
        <a href="#contact" onClick={(e) => { e.preventDefault(); onLegalOpen('contact'); }} style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Contact</a>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {loading ? (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', minWidth: '5rem', textAlign: 'right' }}>…</span>
        ) : user ? (
          <>
            <span
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                maxWidth: '10rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={user.email}
            >
              {user.full_name}
            </span>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => void logout()}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-outline" onClick={() => onAuthClick('signin')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Sign In</button>
            <button type="button" className="btn btn-primary" onClick={() => onAuthClick('signup')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Sign Up</button>
          </>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
