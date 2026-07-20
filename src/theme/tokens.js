// TrackMe driver app — central design tokens ("Signal Ink").
// Single source of truth for colour, type, spacing, shape, and motion.
// Ported verbatim from user-app/src/theme/tokens.js (the ShuttleGo signal-blue
// system), English-only (no Sinhala/Tamil), plus the driver-specific `ink` and
// `duty` groups for the navy duty hero. See STYLEGUIDE.md for the source spec.
//
// Screens import from '../theme' and contain NO hardcoded hex, font sizes, or
// spacing. See theme/index.js for the assembled `theme` object.

// ── Colour ──────────────────────────────────────────────────────────────────
// Signature primary. Confident blue that reads as "go / live / active".
const signal = {
  50:  '#E9EFFF', // signal-soft — tint background for icon badges / pills
  100: '#C7D6FE', // icons on ink surfaces (secondary)
  300: '#8FA9F8', // muted text/labels on ink surfaces
  500: '#3F6FF3', // GO button, primary buttons, active tab, live accents
  600: '#2F59D6', // pressed state, GO button ring
  900: '#172033', // deep navy ink — headings / text-on-light primary
};

export const palette = {
  primary: signal,
  accent:  signal,
  secondary: {
    50:  '#E8F1FE',
    500: '#2C6FD6',
    700: '#1B4E9E',
  },
  success: { bg: '#E7F8F1', main: '#10B981', text: '#06412E' },
  warning: { bg: '#FBEFD9', main: '#E2902A', text: '#8A560F' },
  danger:  { bg: '#FCEAEA', main: '#D9453F', text: '#8A211D' },

  text: {
    primary:   '#172033', // navy ink — headings & body-primary
    secondary: '#5E5E5E', // mid gray
    muted:     '#9AA3B2', // cool muted / tertiary
    onAccent:  '#FFFFFF',
  },
  surface: {
    page:   '#F5F7FB', // app background — cool light canvas
    card:   '#FFFFFF',
    raised: '#FFFFFF', // bottom sheet / elevated
    field:  '#EDF1F7', // filled inputs, secondary buttons, chips
    tile:   '#F5F7FB',
  },
  border: {
    hairline: '#DCE3EF',
    strong:   '#C2CBDA',
  },
  // Ink surfaces — the navy duty hero (driver-app addition, STYLEGUIDE §2.2).
  ink: {
    base:  '#172033', // hero card background (== signal[900] / text.primary)
    raised: '#232F47', // stat chips / nested cards sitting on the hero
    line:  '#2E3B57',  // hairline separators on ink
  },
  // Duty states — semantic (driver-app addition, STYLEGUIDE §2.3).
  duty: {
    on:   '#10B981', // success.main — live dot, "you're live", LIVE pill
    off:  '#8FA9F8', // signal[300] — idle dot, "off duty" sub-text on ink
    stop: '#D9453F', // danger.main — END state of the GO button
    warn: '#E2902A', // warning.main — reconnecting, stale GPS
  },
  white: '#FFFFFF',
  black: '#172033', // navy ink (near-black) — dark hero cards, high-contrast text
};

// ── Typography ──────────────────────────────────────────────────────────────
// Driver app is English-only. Inter is loaded in App.js.
export const fontFamilies = {
  en: { regular: 'Inter_400Regular', medium: 'Inter_500Medium' },
};

export const fontFallback = {
  regular: 'Inter_400Regular',
  medium:  'Inter_500Medium',
};

export const fontSize = {
  display:  34,
  h1:       22,
  h2:       18,
  body:     16,
  label:    14,
  caption:  12,
  overline: 11,
};

// Comfortable, legible line heights (~1.3–1.45). Multiplied by fontSize.
export const lineHeightRatio = {
  display:  1.2,
  h1:       1.25,
  h2:       1.3,
  body:     1.4,
  label:    1.35,
  caption:  1.35,
  overline: 1.35,
};

// ── Spacing — 4pt base scale ────────────────────────────────────────────────
export const space = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 };

// ── Shape ───────────────────────────────────────────────────────────────────
export const radius = {
  tag:     8,
  control: 8,
  card:    12,
  sheet:   16, // hero bottom corners are 24, set at the component level
  pill:    999,
};

export const borderWidth = {
  hairline: 1,
  strong:   1.5,
};

// ── Elevation ───────────────────────────────────────────────────────────────
export const elevation = {
  none: {},
  card: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sheet: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
};

// ── Motion — subtle, battery-aware (respect reduce-motion at call sites) ────
export const motion = {
  pulseMs:     1200, // live-dot opacity blink while broadcasting
  goPulse:     1600, // soft expanding ring behind the GO button while off duty
  fastMs:      150,  // press feedback, chip toggles
  sheetSpring: { damping: 22, stiffness: 240, mass: 0.9 },
};

// Minimum interactive target (Fitts's Law) — dp.
export const minTapTarget = 48;
