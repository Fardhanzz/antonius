/**
 * ANTONIUS Design System Tokens
 * Source of truth: /docs/ANTONIUS_DESIGN_SYSTEM.md
 */

export const COLORS = {
  canvas: '#FFF7F2',
  surface: '#FFFFFF',
  ink: '#111111',
  muted: '#6F6A67',

  // Primary
  red: '#D94336',
  redDark: '#B83228',

  // Accents
  yellow: '#FFD447',
  blue: '#70C5E8',
  green: '#A8E063',
  purple: '#A98BE8',

  // Semantic
  success: '#2E9B68',
  warning: '#C79500',
  error: '#C7372F',
  info: '#3B82A8',
} as const;

export const SHADOWS = {
  sm: '3px 3px 0 #111111',
  default: '5px 5px 0 #111111',
  lg: '7px 7px 0 #111111',
  hero: '8px 8px 0 #111111',
} as const;

export const BORDERS = {
  thin: '2px solid #111111',
  default: '3px solid #111111',
  thick: '4px solid #111111',
} as const;

export const RADII = {
  sm: '10px',
  default: '16px',
  lg: '20px',
  hero: '24px',
} as const;
