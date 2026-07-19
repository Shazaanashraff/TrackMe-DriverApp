import { theme, textStyle, fontFamily, palette, space, radius, fontSize } from '../index';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

describe('theme tokens', () => {
  it('exposes the signal ramp', () => {
    expect(theme.color.primary[500]).toBe('#3F6FF3');
    expect(theme.color.primary[900]).toBe('#172033');
  });

  it('exposes the ink surface group', () => {
    expect(theme.color.ink.base).toBe('#172033');
    expect(theme.color.ink.raised).toBe('#232F47');
    expect(theme.color.ink.line).toBe('#2E3B57');
  });

  it('exposes the duty state group', () => {
    expect(theme.color.duty.on).toBe(theme.color.success.main);
    expect(theme.color.duty.off).toBe(theme.color.primary[300]);
    expect(theme.color.duty.stop).toBe(theme.color.danger.main);
    expect(theme.color.duty.warn).toBe(theme.color.warning.main);
  });

  it('is English-only (no Sinhala/Tamil font families)', () => {
    expect(Object.keys(theme.font.families)).toEqual(['en']);
  });

  it('includes an overline role sized between caption and label', () => {
    expect(fontSize.overline).toBe(11);
  });

  it('exposes the 4pt spacing scale', () => {
    expect(space).toEqual({ 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 });
  });

  it('exposes shape radii', () => {
    expect(radius.card).toBe(12);
    expect(radius.pill).toBe(999);
  });
});

describe('fontFamily', () => {
  it('resolves regular and medium weights to Inter', () => {
    expect(fontFamily('regular')).toBe('Inter_400Regular');
    expect(fontFamily('medium')).toBe('Inter_500Medium');
  });

  it('defaults to regular when no weight is given', () => {
    expect(fontFamily()).toBe('Inter_400Regular');
  });
});

describe('textStyle', () => {
  it('builds a display style with the correct size and line height', () => {
    const style = textStyle('display');
    expect(style).toEqual({
      fontFamily: 'Inter_400Regular',
      fontSize: 34,
      lineHeight: Math.round(34 * 1.2),
    });
  });

  it('applies the requested weight and optional color', () => {
    const style = textStyle('h1', { weight: 'medium', color: palette.text.primary });
    expect(style.fontFamily).toBe('Inter_500Medium');
    expect(style.color).toBe('#172033');
  });

  it('falls back to the body role for an unknown role', () => {
    const style = textStyle('mystery');
    expect(style.fontSize).toBe(fontSize.body);
  });
});

describe('constants/theme.js compat shim', () => {
  it('maps COLORS onto the new token values', () => {
    expect(COLORS.primary).toBe(theme.color.primary[500]);
    expect(COLORS.secondary).toBe(theme.color.ink.base);
    expect(COLORS.background).toBe(theme.color.surface.page);
    expect(COLORS.textSecondary).toBe(theme.color.text.secondary);
    expect(COLORS.border).toBe(theme.color.border.hairline);
    expect(COLORS.accent).toBe(theme.color.primary[300]);
    expect(COLORS.error).toBe(theme.color.danger.main);
    expect(COLORS.success).toBe(theme.color.success.main);
    expect(COLORS.warning).toBe(theme.color.warning.main);
  });

  it('maps old "bold" to Inter medium (there is no bold weight)', () => {
    expect(FONTS.bold).toBe('Inter_500Medium');
    expect(FONTS.medium).toBe('Inter_400Regular');
  });

  it('maps SPACING onto the 4pt scale', () => {
    expect(SPACING).toEqual({ xs: 4, sm: 8, md: 16, lg: 24, xl: 32 });
  });

  it('maps BORDER_RADIUS onto the new radius tokens', () => {
    expect(BORDER_RADIUS.sm).toBe(theme.radius.control);
    expect(BORDER_RADIUS.md).toBe(theme.radius.card);
    expect(BORDER_RADIUS.lg).toBe(theme.radius.sheet);
    expect(BORDER_RADIUS.full).toBe(theme.radius.pill);
  });

  it('maps SHADOWS onto elevation tokens', () => {
    expect(SHADOWS.sm).toBe(theme.elevation.card);
    expect(SHADOWS.md).toBe(theme.elevation.sheet);
  });
});
