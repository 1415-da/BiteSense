import React from 'react';
import { motion } from 'framer-motion';

import { staggerItem, springGentle } from './dashboardMotion';
import { quickMetricStyle } from './styles';

interface AnimatedMetricTileProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  delay?: number;
}

const AnimatedMetricTile: React.FC<AnimatedMetricTileProps> = ({ children, style, delay = 0 }) => (
  <motion.div
    className="dashboard-metric-tile"
    variants={staggerItem}
    transition={{ ...springGentle, delay }}
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    style={{ ...quickMetricStyle, ...style }}
  >
    {children}
  </motion.div>
);

export default AnimatedMetricTile;
