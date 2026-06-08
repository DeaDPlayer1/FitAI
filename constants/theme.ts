/**
 * FitAI Design System v3.0
 * Soft Premium Fintech Aesthetic → Applied to Fitness
 *
 * Lavender gradients, breathing space, emotional intelligence.
 * Floating cards on tinted backgrounds. Numbers as the star.
 */

const palette = {
  // PRIMARY — Lavender/Purple brand
  purple: '#6A49FA',
  purpleDeep: '#453284',
  purpleSoft: '#EDE9FE',
  purpleGlow: 'rgba(106,73,250,0.15)',

  // SECONDARY — Soft supportive colors
  skyBlue: '#C6E6FF',
  skyBlueSoft: '#EFF6FF',
  softPink: '#FEDADA',
  softPinkTint: '#FFF1F1',

  // SEMANTIC
  success: '#22C55E',
  successSoft: '#DCFCE7',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',

  // NEUTRALS
  background: '#F6F5FB',
  surface: '#FFFFFF',
  surfaceTint: '#F0EFFE',
  text: '#1B1B1F',
  textSecondary: '#6E6E73',
  textMuted: '#AEAEB2',
  border: '#E8E8ED',

  // Focus / Live mode
  focus: '#1B1B1F',
  focusElevated: '#2A2A2F',
};

const colors = {
  // Primary brand
  primary: palette.purple,
  primaryDeep: palette.purpleDeep,
  primarySoft: palette.purpleSoft,
  primaryGlow: palette.purpleGlow,

  // Secondary palette
  secondary: palette.skyBlue,
  secondarySoft: palette.skyBlueSoft,

  // Tertiary
  tertiary: palette.softPink,
  tertiarySoft: palette.softPinkTint,

  // Semantic
  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,

  // Backgrounds
  bg: {
    primary: palette.background,
    secondary: palette.surface,
    tertiary: '#F9F8FD',
    elevated: palette.surface,
    card: palette.surface,
    sheet: palette.surface,
    overlay: 'rgba(0,0,0,0.40)',
    focus: palette.focus,
    focusElevated: palette.focusElevated,
    input: palette.surfaceTint,
    // Legacy tints
    greenTint: palette.successSoft,
    orangeTint: palette.warningSoft,
    purpleTint: palette.purpleSoft,
    blueTint: palette.skyBlueSoft,
  },

  // Text
  text: {
    primary: palette.text,
    secondary: palette.textSecondary,
    muted: palette.textMuted,
    disabled: '#D1D5DB',
    onAccent: '#FFFFFF',
    onLight: palette.text,
    onFocus: '#FFFFFF',
    onFocusMuted: 'rgba(255,255,255,0.65)',
  },

  // Accent aliases (for compatibility with old components)
  accent: {
    primary: palette.purple,
    secondary: palette.skyBlue,
    purple: palette.purple,
    lavender: palette.purpleSoft,
    brand: palette.purpleDeep,
    green: palette.success,
    greenSoft: palette.successSoft,
    blue: '#60A5FA',
    blueSoft: palette.skyBlueSoft,
    red: palette.danger,
    redSoft: palette.dangerSoft,
    orange: palette.warning,
    orangeSoft: palette.warningSoft,
    pink: '#FB7185',
    pinkSoft: palette.softPinkTint,
    purpleSoft: palette.purpleSoft,
  },

  // Borders (subtle, used sparingly)
  border: {
    subtle: 'rgba(106,73,250,0.05)',
    soft: 'rgba(106,73,250,0.08)',
    medium: 'rgba(106,73,250,0.12)',
    strong: 'rgba(106,73,250,0.20)',
    solid: palette.border,
  },

  // Status (semantic)
  status: {
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    info: '#3B82F6',
  },

  // Gradients
  gradient: {
    hero: [palette.purple, palette.purpleDeep] as [string, string],
    heroSoft: [palette.purple, '#7C65FB'] as [string, string],
    heroSkyBlue: [palette.skyBlue, '#A5D4FF'] as [string, string],
    heroPink: [palette.softPink, '#FBBEBE'] as [string, string],
    heroSuccess: [palette.success, '#16A34A'] as [string, string],
    heroWarning: [palette.warning, '#F97316'] as [string, string],
    cardGlow: ['rgba(106,73,250,0.12)', 'transparent'] as [string, string],
    insightNutrition: ['#FFF8F0', '#FFF1E0'] as [string, string],
    insightRecovery: ['#F0FDF4', '#DCFCE7'] as [string, string],
    insightCoach: ['#F5F3FF', '#EDE9FE'] as [string, string],
    insightMotivation: [palette.softPinkTint, '#FEDADA'] as [string, string],
  },

  // Top-level aliases
  purple: palette.purple,
  purpleDeep: palette.purpleDeep,
  purpleSoft: palette.purpleSoft,
  skyBlue: palette.skyBlue,
  softPink: palette.softPink,
  background: palette.background,
  surface: palette.surface,
  surfaceTint: palette.surfaceTint,
  textMuted: palette.textMuted,
  textSecondary: palette.textSecondary,
  info: '#3B82F6',
  green: palette.success,
  blue: '#60A5FA',
  red: palette.danger,
  orange: '#F97316',
  card: '#FFFFFF',
  shadow: 'rgba(0,0,0,0.06)',
};

const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  '2xl': 32,
  '3xl': 40,
  xxxl: 40,
  huge: 48,
  '4xl': 48,
  '5xl': 64,
  screenPadding: 20,
  screenPaddingH: 20,
  cardPadding: 20,
  sectionGap: 24,
  cardGap: 16,
};

const radius = {
  none: 0,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  pill: 999,
  full: 999,
};

const font = {
  size: {
    micro: 11,
    caption: 13,
    body: 16,
    bodyMed: 16,
    title: 18,
    h3: 22,
    h2: 26,
    h1: 32,
    display: 40,
    // Legacy aliases for pre-v3 components
    xs: 11,
    sm: 13,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 26,
    xxxl: 32,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
  lineHeight: {
    micro: 16,
    caption: 18,
    body: 24,
    title: 26,
    h3: 30,
    h2: 34,
    h1: 40,
    display: 48,
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
  soft: {
    shadowColor: palette.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  card: {
    shadowColor: '#1B1B1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  float: {
    shadowColor: palette.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: palette.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 6,
  },
  glowGreen: {
    shadowColor: palette.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  glowWarning: {
    shadowColor: palette.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  glowDanger: {
    shadowColor: palette.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  navbar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
  premium: {
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 10,
  },
  // Legacy shadow aliases (kept for backward compatibility with existing screens)
  hero: {
    shadowColor: palette.purple,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 10,
  },
  button: {
    shadowColor: palette.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  orange: {
    shadowColor: palette.warning,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 15,
    elevation: 6,
  },
  green: {
    shadowColor: palette.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 15,
    elevation: 6,
  },
};

const card = {
  padding: { hero: 24, medium: 20, compact: 16 },
  radius: { hero: 32, standard: 24, compact: 20 },
  height: { hero: 220, metric: 120, meal: 115, compact: 80 },
};

// Legacy Compatibility objects (so existing components don't break)
export const COLORS = {
  primary: colors.primary,
  primaryDark: colors.primaryDeep,
  primaryLight: colors.primarySoft,
  success: colors.success,
  successLight: colors.successSoft,
  danger: colors.danger,
  dangerLight: colors.dangerSoft,
  warning: colors.warning,
  warningLight: colors.warningSoft,
  background: colors.bg.primary,
  bgPrimary: colors.bg.primary,
  bgSecondary: colors.bg.secondary,
  surface: colors.bg.secondary,
  card: colors.bg.card,
  border: colors.border.soft,
  text: colors.text.primary,
  textSecondary: colors.text.secondary,
  textMuted: colors.text.muted,
  protein: palette.success,
  carbs: palette.warning,
  fat: colors.primary,
  purple: colors.primary,
  orange: colors.warning,
  green: colors.success,
  blue: '#60A5FA',
  red: colors.danger,
  mint: colors.success,
  teal: '#14B8A6',
  bgCard: colors.bg.card,
  bgElevated: colors.bg.elevated,
  textPrimary: colors.text.primary,
  borderMid: colors.border.medium,
  bgInput: colors.bg.input,
};

export const BACKGROUND = {
  page: colors.bg.primary,
  surface: colors.bg.secondary,
  card: colors.bg.card,
  elevated: colors.bg.elevated,
  border: colors.border.soft,
  cardBorder: colors.border.soft,
  input: colors.bg.input,
};

export const TEXT = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  muted: colors.text.muted,
  onAccent: colors.text.onAccent,
};

export const SPACING = spacing;
export const RADIUS = radius;
export const FONT_SIZE = {
  micro: 11,
  caption: 13,
  body: 16,
  bodyMed: 16,
  title: 18,
  h3: 22,
  h2: 26,
  h1: 32,
  display: 40,
  // Legacy aliases (pre-v3 components use these names)
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 32,
  hero: 40,
  mega: 64,
};
export const SHADOWS = shadow;

// Animation presets (Reanimated 3)
const animation = {
  fast: 200,
  standard: 350,
  slow: 500,
  spring: { damping: 18, stiffness: 140, mass: 1 },
  springs: {
    snappy: { damping: 14, stiffness: 180 },
    smooth: { damping: 18, stiffness: 120 },
    gentle: { damping: 22, stiffness: 90 },
    bouncy: { damping: 10, stiffness: 200 },
  },
  stagger: 80,
};

const layout = {
  navbarHeight: 88,
  tabBarHeight: 64,
  headerHeight: 160,
  cardGap: 16,
  sectionGap: 24,
  screenPadding: 20,
  heroHeight: 280,
  heroShortHeight: 200,
  overlapCardOffset: 32,
};

// MAIN THEME OBJECT
export const theme = {
  colors,
  palette,
  spacing,
  radius,
  font,
  shadow,
  card,
  animation,
  layout,
  // Legacy Proxies (uppercase variants)
  COLORS,
  BACKGROUND,
  TEXT,
  SPACING,
  RADIUS,
  FONT_SIZE,
  SHADOW: shadow, // uppercase alias for legacy code
  SHADOWS: shadow,
  // Legacy text object (some components expect `theme.text`)
  text: colors.text,
  family: font.family,
};

export default theme;
