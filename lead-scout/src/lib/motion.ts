import { Variants, Transition } from 'framer-motion';

// Curva cúbica ultra-suave (padrão Apple / Linear / Raycast)
export const smoothEasing = [0.22, 1, 0.36, 1] as const;

// Transições padrão
export const pageTransition: Transition = {
  duration: 0.28,
  ease: smoothEasing,
};

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 24,
};

// Variantes para troca suave de páginas/módulos
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: pageTransition,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// Container para revelação em cascata (Stagger)
export const createStaggerContainer = (staggerDelay = 0.045, delayChildren = 0.02): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
});

export const staggerContainer = createStaggerContainer();

// Item individual para listas, grids e tabelas
export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 14,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: smoothEasing,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// Linhas de tabela com entrada lateral suave
export const tableRowVariants: Variants = {
  initial: {
    opacity: 0,
    x: -8,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      ease: smoothEasing,
    },
  },
  exit: {
    opacity: 0,
    x: 8,
    transition: {
      duration: 0.15,
    },
  },
};

// Efeitos interativos para botões e cards
export const buttonPressProps = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.02 },
  transition: { type: 'spring', stiffness: 500, damping: 25 },
} as const;

export const iconButtonPressProps = {
  whileTap: { scale: 0.88 },
  whileHover: { scale: 1.1 },
  transition: { type: 'spring', stiffness: 500, damping: 25 },
} as const;

export const cardHoverProps = {
  whileHover: {
    y: -3,
    transition: { duration: 0.2, ease: smoothEasing },
  },
} as const;

// Efeito de Modal / Dialog Pop
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: gentleSpring,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] },
  },
};
