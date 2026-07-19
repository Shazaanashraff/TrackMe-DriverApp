// Companion declaration for theme/index.js — the driver-app UI kit's .tsx
// components import `theme` and need proper types for textStyle()'s options
// (TS can't fully infer a destructured-with-defaults JS function signature).
export interface Theme {
  color: {
    primary: Record<number, string>;
    accent: Record<number, string>;
    secondary: Record<number, string>;
    success: { bg: string; main: string; text: string };
    warning: { bg: string; main: string; text: string };
    danger: { bg: string; main: string; text: string };
    text: { primary: string; secondary: string; muted: string; onAccent: string };
    surface: { page: string; card: string; raised: string; field: string; tile: string };
    border: { hairline: string; strong: string };
    ink: { base: string; raised: string; line: string };
    duty: { on: string; off: string; stop: string; warn: string };
    white: string;
    black: string;
  };
  space: Record<number, number>;
  radius: { tag: number; control: number; card: number; sheet: number; pill: number };
  borderWidth: { hairline: number; strong: number };
  elevation: {
    none: Record<string, never>;
    card: object;
    sheet: object;
  };
  motion: {
    pulseMs: number;
    goPulse: number;
    fastMs: number;
    sheetSpring: { damping: number; stiffness: number; mass: number };
  };
  minTapTarget: number;
  font: {
    families: { en: { regular: string; medium: string } };
    fallback: { regular: string; medium: string };
    size: Record<string, number>;
    lineHeightRatio: Record<string, number>;
  };
  fontFamily: (weight?: 'regular' | 'medium') => string;
  textStyle: (
    role?: 'display' | 'h1' | 'h2' | 'body' | 'label' | 'caption' | 'overline',
    options?: { weight?: 'regular' | 'medium'; color?: string }
  ) => { fontFamily: string; fontSize: number; lineHeight: number; color?: string };
}

export const theme: Theme;
export const palette: Theme['color'];
export const space: Theme['space'];
export const radius: Theme['radius'];
export const fontSize: Record<string, number>;
export default theme;
