import { StyleSheet } from 'react-native';
import theme from '@/constants/theme';

const { colors, spacing, radius, shadow, font } = theme;

export const glassCard = {
  backgroundColor: colors.glass,
  borderRadius: radius.xl,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  ...shadow.glass,
};

export const glassCardDark = {
  backgroundColor: 'rgba(255,255,255,0.85)',
  borderRadius: radius.xl,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.6)',
  ...shadow.float,
};

export const floatingCTA = {
  position: 'absolute' as const,
  bottom: 24,
  left: spacing.screenPadding,
  right: spacing.screenPadding,
  borderRadius: radius.lg,
  height: 56,
  ...shadow.float,
};

export const macroColors = {
  protein: colors.protein,
  proteinSoft: colors.proteinSoft,
  carbs: colors.carbs,
  carbsSoft: colors.carbsSoft,
  fat: colors.fat,
  fatSoft: colors.fatSoft,
  fiber: colors.success,
  calories: colors.purple,
};

export const premiumStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...shadow.glass,
  },
  glassCardElevated: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...shadow.premium,
  },
  gradientCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.float,
  },
  sectionTitle: {
    fontSize: font.size.title,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: font.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  macroLabel: {
    fontSize: font.size.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  calorieNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1.5,
  },
  nutrientValue: {
    fontSize: font.size.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  nutrientGram: {
    fontSize: font.size.caption,
    color: colors.text.muted,
    marginLeft: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.border.solid,
    ...shadow.soft,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.solid,
    marginVertical: spacing.base,
  },
});
