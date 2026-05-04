import React from 'react';

interface DashboardTabShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const DashboardTabShell: React.FC<DashboardTabShellProps> = ({ title, subtitle, children }) => (
  <>
    <h1 style={{ fontSize: '2.1rem', marginBottom: '0.75rem' }}>{title}</h1>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem' }}>{subtitle}</p>
    {children}
  </>
);

export default DashboardTabShell;
