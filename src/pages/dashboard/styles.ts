import type { CSSProperties } from 'react';

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem 0.9rem',
  borderRadius: '0.625rem',
  border: '1px solid var(--border)',
  background: 'rgba(11, 15, 20, 0.45)',
  color: 'var(--text-primary)',
  outline: 'none',
};

export const quickMetricStyle: CSSProperties = {
  border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(22, 28, 36, 0.32)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: '0.875rem',
  padding: '0.9rem 1rem',
};

export const sectionSubtitle: CSSProperties = {
  color: 'var(--text-secondary)',
  marginBottom: '1.5rem',
  fontSize: '1rem',
};
