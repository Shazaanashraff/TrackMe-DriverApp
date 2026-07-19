# Signal Ink — Driver App Design System & Style Guide

**App:** `driver-app` (TrackMe Driver)
**Direction:** "Signal Ink" — the user-app's ShuttleGo token set, with the tracking control
restructured into a dark navy hero. Locked 2026-07-17.
**Preview:** `../../..//design-previews/driver-app-redesign/index.html` (phone #2) — run the
`design-previews` config in `.claude/launch.json` → http://localhost:4173
**Companion doc:** [`SIGNAL_INK_PLAN.md`](SIGNAL_INK_PLAN.md) — the phased implementation plan.

This document is the single source of truth for every visual decision. If a screen spec in the
plan ever conflicts with this guide, this guide wins.

---

## 1. Who this app is for (design principles)

The driver is often **not technical**, is **outdoors in sunlight**, and checks the phone
**while parked at a stop for a few seconds**. Every rule below follows from that.

1. **Glanceable, not dense.** The home screen answers one question — *"am I live?"* — in under
   a second. Max **3 content blocks** visible per viewport. Generous whitespace is a feature.
2. **One big action per screen.** Each screen has exactly one primary (accent-filled) control.
   Everything else is quiet (white card, ink text).
3. **Plain language.** No jargon, ever. "Socket connected" → "Connected". "GPS fixes" →
   "updates". "Session" → "journey". See the copy table in §8.
4. **Huge tap targets.** Primary action ≥ 72 dp (the GO button is 86 dp). Everything
   interactive ≥ 48 dp. Drivers wear gloves, phones are mounted.
5. **Same family as the passenger app.** We reuse the user-app's exact token values so the two
   apps read as siblings and future re-themes propagate to both.

---

## 2. Color tokens

Copy the user-app's `src/theme/tokens.js` verbatim, then add the `ink` and `duty` groups below.
Screens import from `src/theme` and contain **no hardcoded hex**.

### 2.1 Signature ramp — "Signal" blue (identical to user-app)

| Token | Hex | Use |
|---|---|---|
| `signal[50]`  | `#E9EFFF` | tint background for icon badges, avatar circles |
| `signal[100]` | `#C7D6FE` | icons on ink surfaces (secondary) |
| `signal[300]` | `#8FA9F8` | muted text/labels **on ink surfaces** |
| `signal[500]` | `#3F6FF3` | GO button, primary buttons, active tab, live accents |
| `signal[600]` | `#2F59D6` | pressed state, GO button ring |
| `signal[900]` | `#172033` | navy ink — headings, and the hero/ink surface |

### 2.2 Ink surfaces (driver-app addition — the hero card)

| Token | Hex | Use |
|---|---|---|
| `ink.base`   | `#172033` | hero card background (same value as `signal[900]` / `text.primary`) |
| `ink.raised` | `#232F47` | stat chips / nested cards sitting on the hero |
| `ink.line`   | `#2E3B57` | hairline separators on ink |

Text on ink: white `#FFFFFF` for primary, `signal[300]` `#8FA9F8` for secondary/labels,
`signal[100]` `#C7D6FE` for icons.

### 2.3 Duty states (driver-app addition — semantic)

| State | Color | Where |
|---|---|---|
| `duty.on`    | `success.main` `#10B981` | live dot, "you're live" accents, LIVE pill |
| `duty.off`   | `signal[300]` `#8FA9F8`  | idle dot, "off duty" sub-text on ink |
| `duty.stop`  | `danger.main` `#D9453F`  | END state of the GO button, end-journey confirm |
| `duty.warn`  | `warning.main` `#E2902A` | reconnecting, stale GPS |

### 2.4 Everything else — identical to user-app tokens

| Group | Values |
|---|---|
| `text` | primary `#172033` · secondary `#5E5E5E` · muted `#9AA3B2` · onAccent `#FFFFFF` |
| `surface` | page `#F5F7FB` · card `#FFFFFF` · field `#EDF1F7` · tile `#F5F7FB` |
| `border` | hairline `#DCE3EF` · strong `#C2CBDA` |
| `success` | bg `#E7F8F1` · main `#10B981` · text `#06412E` |
| `warning` | bg `#FBEFD9` · main `#E2902A` · text `#8A560F` |
| `danger` | bg `#FCEAEA` · main `#D9453F` · text `#8A211D` |

**Discipline: one accent.** Signal blue is the only vivid color on a light screen. Green/amber/red
appear only as status, never as decoration.

---

## 3. Typography

**Font: Inter** (`@expo-google-fonts/inter`), replacing UberMove. Two weights only —
`Inter_400Regular` and `Inter_500Medium`. There is no bold: emphasis comes from size and color,
matching the user-app.

| Role | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `display` | 34 | 41 | medium | hero status headline ("You're live"), earnings balance |
| `h1` | 22 | 28 | medium | screen titles, greeting |
| `h2` | 18 | 23 | medium | section titles ("Your vehicle") |
| `body` | 16 | 22 | regular | body text, list rows, buttons (medium) |
| `label` | 14 | 19 | regular/medium | card sub-lines, secondary info |
| `caption` | 12 | 16 | regular | timestamps, chip labels |
| `overline` | 11 | 15 | medium, +1.5 letter-spacing, UPPERCASE | kickers, stat-chip labels |

Rules:
- **Never** set `allowFontScaling={false}`. Sizes honour OS font scaling.
- Minimum rendered size 12 (captions). Nothing smaller, ever — sunlight legibility.
- Sentence case everywhere. ALL CAPS is reserved for `overline` kickers and stat-chip labels.

---

## 4. Spacing, shape, elevation

Identical to user-app tokens:

- **Spacing** — 4pt scale: `4, 8, 12, 16, 20, 24, 32`. Screen gutter = 20. Gap between cards = 16.
  Card internal padding = 16.
- **Radius** — control `8` · card `12` · sheet/hero `16` (hero bottom corners `24`) · pill `999`.
- **Borders** — hairline `1` (`#DCE3EF`) on every white card. Cards are bordered, not shadowed.
- **Elevation** — flat by default. `elevation.card` (subtle, opacity 0.05) allowed on white cards;
  `elevation.sheet` reserved for modals/bottom sheets. Nothing else casts shadow.

---

## 5. Motion

Copy user-app `motion` tokens. Use RN `Animated` (no new dependency).

| Token | Value | Use |
|---|---|---|
| `pulseMs` | 1200 | live-dot opacity blink while broadcasting |
| `goPulse` | 1600 | soft expanding ring behind the GO button **only while off duty** (invites the tap); stops when live |
| `fastMs` | 150 | press feedback, chip toggles |
| `sheetSpring` | damping 22 / stiffness 240 | modal/bottom-sheet entrance |

Respect reduce-motion: check `AccessibilityInfo.isReduceMotionEnabled()` and skip loops.

---

## 6. Component specs

### 6.1 Ported primitives (copy styles from user-app `src/components/ui/`, keep driver prop names)

| Component | Spec |
|---|---|
| `AppText` | variants = roles from §3; `variant="display" onInk` renders white |
| `Button` (replaces `PrimaryButton`) | h 52, radius 8, bg `signal[500]`, pressed `signal[600]`, text white body-medium; `variant="secondary"` = bg `surface.field`, ink text; `variant="danger"` = bg `danger.main`; loading = spinner replaces label; keep existing `PrimaryButton` props (`title`, `onPress`, `loading`, `disabled`, `style`) |
| `Card` (replaces `SectionCard`) | bg white, radius 12, border hairline, padding 16; optional `title` renders h2 above content |
| `Input` (restyles `FormInput`) | h 52, radius 8, bg `surface.field`, no border until focus (`signal[500]` 1.5), label above in `label` medium, error text `danger.text` below; keep props (`label`, `icon`, `error`, TextInput passthrough) |
| `ScreenHeader` | transparent bg, back chevron in 44dp target, h1 title left-aligned (not centered — friendlier, matches user-app) |
| `ListRow` | h ≥ 56, icon in 36dp `signal[50]` rounded-8 badge, body text, optional value label, chevron `text.muted`; hairline separator between rows inside a Card |
| `InfoRow` | label `label` secondary left, value `body` ink right, hairline bottom |
| `StatusPill` | radius 999, caption-medium; variants: neutral (field bg / secondary text), live (success bg/text), warn (warning bg/text), danger (danger bg/text) |
| `EmptyState` | centered 48dp icon in `signal[50]` circle, h2 title, label secondary subtitle, optional Button |
| `Skeleton` | `surface.field` blocks, 800ms opacity loop — replaces full-screen spinners on list screens |
| `OfflineBanner` / `InlineError` / `ErrorState` | recolor to token values only; behavior unchanged |
| `LoadingScreen` | page bg, `signal[500]` spinner |

### 6.2 Driver-specific components (new, live in `src/features/dashboard/`)

**`DutyHero`** — the signature element. Replaces `DashboardHeader` + `TrackingStatusCard`.
- Full-bleed `ink.base` surface from the top of the screen (paint the safe area ink too),
  bottom corners radius 24, padding 20, bottom padding 24.
- Row 1: `label` in `signal[300]`: "Hi {firstName} · {busName}" (bus name omitted when none).
- Row 2 (16 above): left — status headline `display` white ("You're off duty" / "You're live" /
  "Reconnecting…") + sub-line `label` `signal[300]` with an 8dp `LiveDot`; right — `GoButton`.
- Row 3 (18 above, only while live): three `StatChip`s.
- States: off duty · live · reconnecting (headline "Reconnecting…", dot `duty.warn`, GoButton
  shows END, disabled=false) · permission denied (sub-line swaps for "Location is off" + a
  secondary Button "Allow location") · no bus (GoButton disabled at 40% opacity, sub-line
  "Register your bus to go live").

**`GoButton`**
- 86dp circle. Off duty: bg `signal[500]`, 4dp ring `signal[600]`, white "GO" caption-medium
  letter-spacing 1 under a play icon (20), soft pulse ring. Live: bg `duty.stop` red, "END" +
  stop icon, no pulse. Disabled: bg `ink.raised`, ring `ink.line`, 40% content opacity.
- Press = scale 0.96 over `fastMs`. Tapping END opens `ConfirmSheet` (never ends instantly).

**`StatChip`**
- bg `ink.raised`, radius 10, padding 10×12. Value `h2`-sized white medium; label `overline`
  `signal[300]`. The three chips (locked): **time online** (local timer since start), **updates
  sent** (count of emitted fixes), **GPS** ("Good/Weak" from last fix accuracy: ≤25 m Good).

**`VehicleCard`**
- White Card. 42dp bus icon badge (`signal[50]` bg, `signal[500]` icon), bus name `body` medium,
  sub-line `label` muted "{reg} · {seats} seats{ · route}". Tap → BusRegistration. No bus →
  EmptyState variant: "No bus yet" / "Add your bus so riders can find it" / Button "Add my bus".

**`ConfirmSheet`** — generalizes `LogoutModal`.
- Bottom sheet: white, radius-16 top corners, `elevation.sheet`, h2 title, label secondary body,
  full-width danger Button + secondary Cancel Button (both h 52). Used for End journey
  ("End this journey?" / "Riders will stop seeing your bus.") and Log out.

**`TabBar`** (react-navigation bottom tabs styling)
- bg white, top hairline, height 64 + safe area. 4 items: icon 24 + caption label.
  Active = `signal[500]` icon + label medium; inactive = `text.muted`. No badges except
  Earnings (dot when an unpaid payout exists — optional, phase 5).

---

## 7. Layout patterns

- **Tab screens** (Home, Earnings, Trips, Profile): no back button. Home starts with DutyHero;
  the other three start with an h1 title block on the page background (title + one-line `label`
  secondary subtitle), 20 gutter.
- **Pushed screens** (Bus registration, My routes): `ScreenHeader` with back chevron.
- **Lists**: FlatList of white Cards, 12 gap, pull-to-refresh tinted `signal[500]`.
  First load = 3 Skeleton cards, never a full-screen spinner inside a tab.
- **Forms**: one Card per logical group, inputs stacked 16 apart, single primary Button pinned
  after the fields (not floating).
- **Congestion limits** (hard rules): ≤ 3 blocks per viewport · ≤ 1 accent-filled control per
  screen · a list row never holds more than icon + 2 text lines + 1 trailing element.

---

## 8. Copy & tone (plain language for drivers)

Sentence case. Contractions. Verb-first buttons. No exclamation marks. Never blame the driver.

| Never write | Write instead |
|---|---|
| Socket connected / disconnected | Connected / Reconnecting… |
| GPS fix / location broadcast | location update / "Riders can see your bus" |
| Tracking session active | You're live |
| Start tracking | Go online (button: **GO**) |
| Stop tracking / terminate session | End journey (button: **END**) |
| Location permission denied | Location is off |
| Payout request submitted | Payout requested |
| Error: request failed | Couldn't load. Pull down to try again. |
| Total balance | You've earned |
| Authentication failed | Wrong email or password. Try again. |

Status headlines (DutyHero): "You're off duty" · "You're live" · "Reconnecting…" · "Location is off".
Sub-lines: "Riders can't see your bus yet" · "Riders can see your bus · updated {n}s ago" ·
"Hang tight — finding the server" · "Allow location so riders can see your bus".

---

## 9. Accessibility

- Every interactive element: `accessibilityRole` + `accessibilityLabel`; GO button label
  "Go online" / "End journey" (state-dependent), `accessibilityState={{ busy }}` while connecting.
- Contrast: all pairs in §2 pass 4.5:1 (white on `signal[500]` = 4.6, `signal[300]` on ink = 5.9).
- Color is never the only signal — pair the live dot with the headline text, pills carry words.
- Honour OS font scaling and reduce-motion (§3, §5).

---

## 10. Do / Don't

| Do | Don't |
|---|---|
| One GO button, huge | Two primary buttons on one screen |
| "You're live" | "Session status: TRACKING" |
| White card + hairline | Card with heavy shadow + border + tint |
| 3 stat chips max on the hero | A 6-metric grid |
| Skeletons in lists | Full-screen spinner blocking a tab |
| Ink hero only on Home and Login | Painting every header dark |
| Reuse user-app token values verbatim | Inventing new hex values |
