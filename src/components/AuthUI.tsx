import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AuthUIProps {
  initialView: 'signin' | 'signup';
  onClose: () => void;
}

const AuthUI: React.FC<AuthUIProps> = ({ initialView, onClose }) => {
  const [view, setView] = useState<'signin' | 'signup'>(initialView);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11, 15, 20, 0.9)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ background: 'var(--surface)', padding: '3rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', border: '1px solid var(--border)', position: 'relative' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-secondary)' }}>
            <X size={24} />
          </button>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            {view === 'signin' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.875rem' }}>
            {view === 'signin' ? 'Sign in to access your saved profile.' : 'Join Bite Sense and start eating smarter.'}
          </p>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={(e) => e.preventDefault()}>
            {view === 'signup' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" placeholder="John Doe" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email Address</label>
              <input type="email" placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" placeholder="••••••••" style={inputStyle} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
              {view === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
            <button type="button" className="btn btn-outline" style={{ width: '100%' }}>
              Continue with Google
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {view === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setView(view === 'signin' ? 'signup' : 'signin')} style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              {view === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.2s'
};

export default AuthUI;
