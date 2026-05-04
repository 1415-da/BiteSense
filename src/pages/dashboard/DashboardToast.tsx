import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

interface DashboardToastProps {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

const DashboardToast: React.FC<DashboardToastProps> = ({ message, onDismiss, durationMs = 3200 }) => {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => onDismiss(), durationMs);
    return () => window.clearTimeout(t);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="dashboard-toast dashboard-toast-enter"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.85rem 1.1rem',
        borderRadius: '0.85rem',
        border: '1px solid rgba(41, 201, 139, 0.45)',
        background: 'rgba(12, 18, 22, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        maxWidth: 'min(100vw - 2rem, 360px)',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(41, 201, 139, 0.2)',
          color: 'var(--accent-primary)',
        }}
      >
        <Check size={16} strokeWidth={3} />
      </span>
      <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>{message}</span>
    </div>
  );
};

export default DashboardToast;
