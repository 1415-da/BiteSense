/** Shared Framer Motion presets for dashboard cards and panels. */

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

export const springGentle = { type: 'spring' as const, stiffness: 380, damping: 32 };

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.015, y: -3, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
};

/** Main dashboard panel when switching tabs */
export const tabPanel = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const easeSmooth = [0.22, 1, 0.36, 1] as const;
