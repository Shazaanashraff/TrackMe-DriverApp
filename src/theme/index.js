// Assembled theme object + ergonomic helpers. Import this everywhere:
//   import { theme, textStyle } from '../theme';
//   color={theme.color.accent[500]}  padding={theme.space[4]}
import {
  palette, fontFamilies, fontFallback, fontSize, lineHeightRatio,
  space, radius, borderWidth, elevation, motion, minTapTarget,
} from './tokens';

// Resolve a font family for a weight. Driver app is English-only.
export function fontFamily(weight = 'regular') {
  return fontFamilies.en[weight] || fontFallback[weight] || fontFallback.regular;
}

// Build a complete text style for a role (display/h1/h2/body/label/caption/overline).
// Sentence case is a content rule, enforced in copy — not here.
export function textStyle(role = 'body', { weight = 'regular', color } = {}) {
  const size = fontSize[role] ?? fontSize.body;
  return {
    fontFamily: fontFamily(weight),
    fontSize: size,
    lineHeight: Math.round(size * (lineHeightRatio[role] ?? 1.4)),
    ...(color ? { color } : null),
  };
}

export const theme = {
  color: palette,
  space,
  radius,
  borderWidth,
  elevation,
  motion,
  minTapTarget,
  font: { families: fontFamilies, fallback: fontFallback, size: fontSize, lineHeightRatio },
  fontFamily,
  textStyle,
};

export default theme;
export { palette, space, radius, fontSize };
