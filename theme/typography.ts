/**
 * DESIGN SYSTEM - TYPOGRAPHY
 */

export const typography = {
  xl: { size: 32, weight: '700', spacing: -0.32 },
  lg: { size: 26, weight: '600', spacing: 0 },
  section: { size: 20, weight: '600', spacing: 0 },
  cardTitle: { size: 18, weight: '500', spacing: 0 },
  body: { size: 15, weight: '400', spacing: 0 },
  label: { size: 13, weight: '500', spacing: 0 },
  tiny: { size: 11, weight: '500', spacing: 0.5 },
  lineHeight: 1.3,

  // Legacy Font Scale (Compatibility)
  size: {
    xs: 11, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 32,
  },
  
  // Legacy Mappings for OnboardingShell etc.
  headingXL: { fontSize: 32, fontWeight: '700' },
  heading: { fontSize: 24, fontWeight: '600' },
  number: { fontSize: 28, fontWeight: '700' },
};
