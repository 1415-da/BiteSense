import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{ background: 'var(--bg-secondary)', padding: '3rem 0 2rem', borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--accent-primary)' }}></div>
              Bite Sense
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              &copy; {new Date().getFullYear()} Bite Sense. All rights reserved. <br/>
              Not medical advice. Consult a physician for dietary restrictions.
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms of Service', 'Contact Us'].map((item) => (
              <a key={item} href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
