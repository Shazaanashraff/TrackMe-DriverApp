// Compat shim — re-exports the Signal Ink theme (src/theme/) under the old
// COLORS/FONTS/SPACING/BORDER_RADIUS/SHADOWS names so every unmigrated screen
// re-colors with zero edits. New code should import from '../theme' directly;
// this file exists only until every consumer has migrated (Phase 6).
import { theme } from '../theme';

export const COLORS = {
  primary: theme.color.primary[500],
  secondary: theme.color.ink.base,
  background: theme.color.surface.page,
  card: theme.color.surface.card,
  text: theme.color.text.primary,
  textSecondary: theme.color.text.secondary,
  accent: theme.color.primary[300],
  border: theme.color.border.hairline,
  white: theme.color.white,
  error: theme.color.danger.main,
  success: theme.color.success.main,
  warning: theme.color.warning.main,
  info: theme.color.secondary[500],
};

export const FONTS = {
  bold: 'Inter_500Medium', // the design has no bold — old "bold" maps to medium
  medium: 'Inter_400Regular',
};

export const SPACING = {
  xs: theme.space[1],
  sm: theme.space[2],
  md: theme.space[4],
  lg: theme.space[6],
  xl: theme.space[8],
};

export const BORDER_RADIUS = {
  sm: theme.radius.control,
  md: theme.radius.card,
  lg: theme.radius.sheet,
  xl: 24, // hero bottom-corner radius (STYLEGUIDE §4) — no named token
  full: theme.radius.pill,
};

export const SHADOWS = {
  sm: theme.elevation.card,
  md: theme.elevation.sheet,
};
