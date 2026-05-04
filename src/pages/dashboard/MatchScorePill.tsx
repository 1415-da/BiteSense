import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MatchScorePillProps {
  icon: LucideIcon;
  children: React.ReactNode;
  variant?: 'accent' | 'warn' | 'muted';
}

/** Consistent score / status chips (aligns with recommendation card language). */
const MatchScorePill: React.FC<MatchScorePillProps> = ({ icon: Icon, children, variant = 'accent' }) => {
  const styles: Record<typeof variant, React.CSSProperties> = {
    accent: {
      border: '1px solid rgba(41, 201, 139, 0.55)',
      background: 'rgba(41, 201, 139, 0.12)',
      color: 'var(--accent-primary)',
    },
    warn: {
      border: '1px solid rgba(246, 199, 96, 0.55)',
      background: 'rgba(246, 199, 96, 0.1)',
      color: '#f6c760',
    },
    muted: {
      border: '1px solid var(--border)',
      background: 'rgba(22, 28, 36, 0.5)',
      color: 'var(--text-secondary)',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.28rem 0.55rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.03em',
        ...styles[variant],
      }}
    >
      <Icon size={13} strokeWidth={2.5} style={{ flexShrink: 0 }} />
      {children}
    </span>
  );
};

export default MatchScorePill;
