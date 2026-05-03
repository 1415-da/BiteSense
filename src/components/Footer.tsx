import React from 'react';
import logo from '../assets/logo.png';
import type { LegalDialogKind } from './InfoDialog';

interface FooterProps {
  onLegalOpen: (kind: LegalDialogKind) => void;
}

const Footer: React.FC<FooterProps> = ({ onLegalOpen }) => {
  return (
    <footer style={{ background: 'var(--bg-secondary)', padding: '3rem 0 2rem', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              <img src={logo} alt="Bite Sense logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              Bite Sense
            </a>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              &copy; {new Date().getFullYear()} Bite Sense. All rights reserved. <br/>
              Not medical advice. Consult a physician for dietary restrictions.
            </div>
          </div>

          <nav aria-label="Legal" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <a href="#privacy-policy" onClick={(e) => { e.preventDefault(); onLegalOpen('privacy'); }} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Privacy Policy
            </a>
            <a href="#terms-of-service" onClick={(e) => { e.preventDefault(); onLegalOpen('terms'); }} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Terms of Service
            </a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); onLegalOpen('contact'); }} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Contact Us
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
