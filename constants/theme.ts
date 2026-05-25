/**
 * FitAI Design System - Premium Wellness (Lavender & Soft Minimal)
 * 
 * Inspired by modern wellness and productivity apps.
 * Scandinavian-inspired spacing, airy layouts, and calm luxury palette.
 */

const palette = {
  lavender: '#F5F3FF',
  white: '#FFFFFF',
  ghost: '#F9FAFB',
  deepPurple: '#6D28D9',
  softPurple: '#8B5CF6',
  lavenderDark: '#C4B5FD',
  pastelPink: '#FBCFE8',
  pastelBlue: '#DBEAFE',
  charcoal: '#1F2937',
  slate: '#4B5563',
  muted: '#9CA3AF',
  disabled: '#D1D5DB',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

// Define sub-objects first to avoid reference issues
const colors = {
  bg: {
    primary: palette.lavender,
    secondary: palette.white,
    tertiary: palette.ghost,
    elevated: palette.white,
    sheet: palette.white,
    overlay: 'rgba(0,0,0,0.4)',
    card: palette.white,
  },
  accent: {
    primary: palette.softPurple,
    secondary: palette.lavenderDark,
    purple: palette.softPurple,
    lavender: palette.lavenderDark,
    brand: palette.deepPurple,
    green: palette.success,
    blue: palette.info,
    red: palette.danger,
    orange: palette.softPurple,
  },
  text: {
    primary: palette.charcoal,
    secondary: palette.slate,
    muted: palette.muted,
    disabled: palette.disabled,
    onAccent: palette.white,
    onLight: palette.charcoal,
  },
  border: {
    subtle: 'rgba(109, 40, 217, 0.05)',
    soft: 'rgba(109, 40, 217, 0.08)',
    medium: 'rgba(109, 40, 217, 0.12)',
    strong: 'rgba(109, 40, 217, 0.20)',
  },
  status: {
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    info: palette.info,
  },
  gradient: {
    purple: [palette.softPurple, palette.deepPurple] as [string, string],
    orange: [palette.softPurple, palette.deepPurple] as [string, string],
    green: [palette.success, '#059669'] as [string, string],
    lavender: [palette.lavender, '#E0D7FF'] as [string, string],
  },
  // Top-level aliases
  primary: palette.softPurple,
  primaryDark: palette.deepPurple,
  primaryLight: 'rgba(139, 92, 246, 0.1)',
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
  green: palette.success,
  blue: palette.info,
  red: palette.danger,
  orange: palette.softPurple,
  purple: palette.softPurple,
  lavender: palette.lavenderDark,
  // Legacy direct text aliases
  textMuted: palette.muted,
  textSecondary: palette.slate,
  // Legacy bg aliases
  background: palette.lavender,
  surface: palette.white,
};

const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
  max: 80,
  screenPadding: 24,
};

const radius = {
  none: 0,
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
  full: 999,
  pill: 999,
};

const font = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 26,
    xxxl: 32,
    hero: 48,
    mega: 64,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  family: {
    heading: 'Inter_700Bold',
    body: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    number: 'Inter_700Bold',
    numberBold: 'Inter_700Bold',
  },
};

const shadow = {
  card: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  premium: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  },
  hero: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  orange: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  green: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  navbar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
};

const card = {
  padding: { hero: 28, medium: 22, compact: 16 },
  radius: { hero: 32, standard: 26, compact: 20 },
  height: { hero: 220, metric: 120, meal: 115, compact: 80 },
};

// Legacy Compatibility objects
export const COLORS = {
  primary: colors.accent.primary,
  primaryDark: palette.deepPurple,
  primaryLight: 'rgba(139, 92, 246, 0.1)',
  success: colors.status.success,
  successLight: 'rgba(16, 185, 129, 0.1)',
  danger: colors.status.danger,
  dangerLight: 'rgba(239, 68, 68, 0.1)',
  warning: colors.status.warning,
  warningLight: 'rgba(245, 158, 11, 0.1)',
  background: colors.bg.primary,
  bgPrimary: colors.bg.primary,
  bgSecondary: colors.bg.secondary,
  surface: colors.bg.secondary,
  card: colors.bg.card,
  border: colors.border.soft,
  text: colors.text.primary,
  textSecondary: colors.text.secondary,
  textMuted: colors.text.muted,
  protein: palette.softPurple,
  carbs: palette.lavenderDark,
  fat: palette.pastelPink,
  // Additional color aliases
  purple: palette.softPurple,
  orange: palette.softPurple,
  green: palette.success,
  blue: palette.info,
  red: palette.danger,
};

export const BACKGROUND = {
  page: colors.bg.primary,
  surface: colors.bg.secondary,
  card: colors.bg.card,
  elevated: colors.bg.elevated,
  border: colors.border.soft,
  cardBorder: colors.border.soft,
  input: 'white',
};

export const TEXT = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  muted: colors.text.muted,
  onAccent: colors.text.onAccent,
};

export const SPACING = spacing;
export const RADIUS = radius;
export const FONT_SIZE = font.size;
export const SHADOWS = shadow;

// MAIN THEME OBJECT
export const theme = {
  colors,
  spacing,
  radius,
  font,
  shadow,
  card,
  animation: {
    fast: 200,
    standard: 350,
    slow: 500,
    spring: { damping: 20, stiffness: 120, mass: 1 },
  },
  layout: {
    navbarHeight: 88,
    headerHeight: 140,
    cardGap: 24,
    sectionGap: 40,
  },
  // Legacy Proxies built into the object
  COLORS,
  BACKGROUND,
  TEXT,
  SPACING,
  RADIUS,
  FONT_SIZE,
  SHADOWS,
  family: font.family,
};

export default theme;