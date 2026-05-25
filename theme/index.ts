// Re-export everything from the centralized theme in constants/
export { theme, COLORS, FONT_SIZE, RADIUS, SPACING } from '../constants/theme';
export type { Theme } from '../constants/theme';

// Named convenience re-exports
import { theme } from '../constants/theme';
export const colors = theme.colors;
export const typography = theme.typography;
export const spacing = theme.spacing;
export const radius = theme.radius;
export const shadows = theme.shadow;
