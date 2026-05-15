import React from 'react';
import { motion } from 'framer-motion';

import { fadeUp, springGentle, staggerContainer } from './dashboardMotion';

interface DashboardTabShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const DashboardTabShell: React.FC<DashboardTabShellProps> = ({ title, subtitle, children }) => (
  <motion.div initial="initial" animate="animate" variants={staggerContainer}>
    <motion.h1
      variants={fadeUp}
      transition={springGentle}
      style={{ fontSize: '2.1rem', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}
    >
      {title}
    </motion.h1>
    <motion.p
      variants={fadeUp}
      transition={{ ...springGentle, delay: 0.04 }}
      style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1rem', lineHeight: 1.55 }}
    >
      {subtitle}
    </motion.p>
    {children}
  </motion.div>
);

export default DashboardTabShell;
