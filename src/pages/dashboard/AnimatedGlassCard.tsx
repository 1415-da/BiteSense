import React from 'react';
import { motion } from 'framer-motion';

import { springGentle, staggerItem } from './dashboardMotion';

interface AnimatedGlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Stagger delay when inside a stagger container */
  delay?: number;
  hoverLift?: boolean;
  padding?: string;
}

const AnimatedGlassCard: React.FC<AnimatedGlassCardProps> = ({
  children,
  className = '',
  style,
  delay = 0,
  hoverLift = true,
  padding = '1rem',
}) => (
  <motion.div
    className={`glass glass-card-interactive ${className}`.trim()}
    variants={staggerItem}
    transition={{ ...springGentle, delay }}
    whileHover={hoverLift ? { y: -3, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } } : undefined}
    style={{ borderRadius: '1rem', padding, ...style }}
  >
    {children}
  </motion.div>
);

export default AnimatedGlassCard;
