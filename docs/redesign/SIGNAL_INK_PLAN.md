# Signal Ink — Driver App Redesign Plan

**Target repo:** `driver-app/` (TrackMe Driver submodule)
**Direction:** Signal Ink (locked) — user-app ShuttleGo tokens + navy duty hero + bottom tabs.
**Style authority:** [`STYLEGUIDE.md`](STYLEGUIDE.md) — read it FIRST; it wins every visual conflict.
**Preview:** `design-previews/driver-app-redesign/index.html` at the umbrella root (phone #2).
**Status:** PLAN — approved direction, ready for implementation.
**Date:** 2026-07-17

---

## 0. How to execute this plan (read this, implementer)

This plan is written to be executed **phase by phase** by an agent (Sonnet) without needing the
design conversation that produced it.

1. Work strictly in phase order. Each phase ends with a `[ ]` checklist — tick every box
   truthfully before moving on. If a box can't be ticked, stop and ask; never fake a tick.
2. **This is a reskin, not a rewrite.** All hooks, services, context, API calls, and business
   logic are untouched unless a phase explicitly names them. If you find yourself editing
   `src/services/`, `src/hooks/` (except imports), or `src/context/` — stop, you've gone off-plan.
3. **Testing policy (repo rule, non-negotiable):** every new/changed component ships with unit
   tests in a sibling `__tests__/`; renames must migrate the old tests. Run the full
   `npm test` + lint **once per 2–3 phases** (batching is the owner's preference — don't run the
   full suite after every small step), but always run the tests you just wrote.
4. Add a row to `docs/TESTING_GUIDE.md` for each phase (what changed, how it's covered).
5. When a phase changes behavior described in `CLAUDE.md`, update `CLAUDE.md` in the same phase.
6. Copy/text: use the exact strings from STYLEGUIDE §8. Don't improvise microcopy.

**Master progress tracker**

- [x] Phase 0 — Foundation: deps, tokens, fonts, compat shim
- [x] Phase 1 — UI kit primitives
- [ ] Phase 2 — Navigation (bottom tabs) + Home screen
- [x] Phase 3 — Earnings + Trips tabs
- [ ] Phase 4 — Profile tab + Bus registration + My routes + Login
- [x] Phase 5 — States, motion, copy pass
- [ ] Phase 6 — Cleanup, docs, full verification

---

## 1. Locked decisions

| # | Topic | Decision |
|---|---|---|
| 1 | Direction | **Signal Ink**: user-app token values verbatim + ink duty hero on Home/Login only |
| 2 | Color | Signal blue `#3F6FF3` replaces mint green `#10b981` everywhere; ink `#172033` |
| 3 | Font | **Inter** (400/500) replaces UberMove; no bold weight |
| 4 | Navigation | **Bottom tabs: Home · Earnings · Trips · Profile** ("earnings/trips at the bottom" — owner request). Pushed screens: Bus registration, My routes. |
| 5 | Home content | DutyHero + VehicleCard + custom-route section only. Dashboard menu is deleted — tabs replace it. |
| 6 | Audience | Non-technical drivers: plain language, ≤3 blocks/viewport, one primary action per screen (STYLEGUIDE §1, §7, §8) |
| 7 | End journey | Always confirmed via ConfirmSheet — never instant |
| 8 | RouteManagement | Currently **orphaned** (exists but unmounted, nothing navigates to it). Mount it as "My routes" pushed from Profile. |
| 9 | Earnings tabs | Simplify 3 tabs → 2 segments (**Summary** / **History**). The daily-breakdown chart folds into Summary. |
| 10 | Libraries | **No UI library.** Port user-app primitives. New deps limited to `@expo-google-fonts/inter` + `@react-navigation/bottom-tabs`. Animations via RN `Animated` (no reanimated). |
| 11 | Icons | Keep `@expo/vector-icons` (Ionicons) — no icon migration |
| 12 | Logic | Zero changes to sockets, tracking, auth, queries, custom-route journey logic |

---

## 2. Current state (inventory — verified 2026-07-17)

**Screens** (`src/screens/`): LoginScreen.tsx · DriverDashboard.tsx · DriverProfileScreen.js ·
TripHistoryScreen.js · DriverEarningsScreen.tsx · BusRegistrationScreen.js ·
RouteManagementScreen.tsx (orphaned — see decision 8).

**Navigator** (`src/navigation/AppNavigator.js`): single native stack — Login | Dashboard,
BusRegistration, DriverEarnings, TripHistory, DriverProfile. No tabs. Also contains a stray
`console.log` (remove in Phase 2).

**Dashboard features** (`src/features/dashboard/`): DashboardHeader · TrackingStatusCard ·
TrackingToggle · AssignedBusCard · CustomRouteSection · DashboardMenu · LiveStatsBar ·
LogoutModal · useCustomRouteJourney · useSocketConnection.

**Earnings features** (`src/features/earnings/`): EarningsSummary · EarningsHistoryList ·
DailyBreakdownChart · PayoutRequestForm.

**Route features** (`src/features/route-management/`): RouteForm · RouteList · RouteListItem.

**UI kit** (`src/components/ui/`): FormInput · PrimaryButton · ScreenHeader · InfoRow ·
SectionCard · LoadingScreen · ErrorState · InlineError · OfflineBanner · TrackingStatusBadge.

**Theme**: `src/constants/theme.js` (mint green, UberMove). Fonts loaded in `App.js` via
`expo-font` from `assets/fonts/`.

**Data available to the UI** (do not invent more): auth user (name/email) · my bus (name, reg,
seats, routeId) · tracking session status (`idle|tracking` + `isReconnecting`) · broadcast
`lastFix` (coords + timestamp + accuracy) + permission state · custom route + journey recorder ·
earnings stats/history/daily breakdown · payout mutation · routes CRUD. There are **no rider
counts, stop ETAs, or notifications** — never render placeholders for data that doesn't exist.

---

## 3. Target information architecture

```
App.js
└── AppNavigator (native stack)
    ├── [offline]    → OfflineScreen (restyled Phase 5)
    ├── [logged out] → Login (ink top + light form)
    └── [logged in]  → MainTabs (bottom tabs — new)
                        ├── Home     → DutyHero + VehicleCard + custom-route section
                        ├── Earnings → Summary / History segments + payout
                        ├── Trips    → trip history list
                        └── Profile  → identity + rows: My bus → BusRegistration (push)
                                                       My routes → RouteManagement (push)
                                                       Replay tutorial · Log out (ConfirmSheet)
```

Screen names stay `Dashboard`, `DriverEarnings`, `TripHistory`, `DriverProfile` inside the tab
navigator (so any `navigation.navigate('…')` call sites keep working); `BusRegistration` and
`RouteManagement` register on the root stack above the tabs.

---

## 4. Phase 0 — Foundation

**Goal:** new theme in place, fonts swapped, old screens keep rendering (recolored) untouched.

1. Install deps: `npx expo install @expo-google-fonts/inter @react-navigation/bottom-tabs`.
2. Create `src/theme/tokens.js` + `src/theme/index.js`: copy both files **from
   `user-app/src/theme/`**, then in `tokens.js` delete the Sinhala/Tamil font families (driver
   app is English-only — `fontFamilies = { en: … }`) and **add** the `ink` and `duty` groups per
   STYLEGUIDE §2.2–2.3, and an `overline` role (size 11, ratio 1.35) to `fontSize`/`lineHeightRatio`.
3. `App.js`: load `Inter_400Regular`, `Inter_500Medium` via `@expo-google-fonts/inter` alongside
   the existing splash logic; delete the UberMove `expo-font` loading (leave files in
   `assets/fonts/` until Phase 6).
4. Rewrite `src/constants/theme.js` as a **compat shim** re-exporting from the new theme so
   every unmigrated screen instantly re-colors with zero edits:
   `COLORS.primary → signal[500]` · `secondary → ink #172033` · `background → #F5F7FB` ·
   `textSecondary → #5E5E5E` · `border → #DCE3EF` · `accent → signal[300]` · status colors from
   tokens · `FONTS.bold → 'Inter_500Medium'`, `FONTS.medium → 'Inter_400Regular'` (yes: old
   "bold" maps to medium — the design has no bold) · SPACING/BORDER_RADIUS/SHADOWS mapped to
   space/radius/elevation.
5. Tests: unit tests for `theme` (token presence, `textStyle()` output, compat-shim mapping).

**Checklist**
- [x] App boots in Expo, every screen renders in Inter + signal blue with no per-screen edits
- [x] No remaining import of UberMove; no `#10b981` anywhere in `src/`
- [x] `src/theme/__tests__/` green; TESTING_GUIDE row added

---

## 5. Phase 1 — UI kit primitives

**Goal:** the component vocabulary of STYLEGUIDE §6.1 exists, tested, before any screen changes.

Port styles from `user-app/src/components/ui/` onto our existing prop names (the user-app kit
was originally ported *from* this codebase — props already align).

| Action | Component |
|---|---|
| **New** | `AppText`, `Card` (wraps/replaces SectionCard), `ListRow`, `StatusPill` (absorbs TrackingStatusBadge), `EmptyState`, `Skeleton`, `ConfirmSheet` (generalizes LogoutModal) |
| **Restyle in place** | `FormInput` → Input spec · `PrimaryButton` → Button spec (+`variant` prop, default primary; keep the old color-override-via-`style` working) · `ScreenHeader` (left-aligned title) · `InfoRow` · `LoadingScreen` · `OfflineBanner` · `InlineError` · `ErrorState` |
| **Delete later** | `SectionCard`, `TrackingStatusBadge` stay as thin aliases until Phase 6 |

Rules: components read **only** `theme` tokens (no raw hex — grep before ticking). Each has
render + interaction tests (`src/components/ui/__tests__/`), including Button variants/loading,
ConfirmSheet confirm/cancel callbacks, StatusPill variants, EmptyState CTA.

**Checklist**
- [x] All primitives implemented per STYLEGUIDE §6.1, zero hardcoded hex (grep `#[0-9a-fA-F]{3,6}` in `src/components/ui/` → only theme files)
- [x] Old tests still green; new component tests green; TESTING_GUIDE rows added
- [x] **Batch gate:** run full `npm test` + lint now (covers Phases 0–1)

---

## 6. Phase 2 — Navigation + Home

**Goal:** bottom tabs live; Home is the Signal Ink hero screen from the preview (with the
earnings/trips tiles REMOVED — the tab bar replaces them).

### 6.1 Navigation (`src/navigation/AppNavigator.js`)
- Add `MainTabs` (bottom-tabs navigator) styled per STYLEGUIDE §6.2 TabBar: Home (`home`),
  Earnings (`wallet`), Trips (`time`), Profile (`person`) — Ionicons outline variants,
  filled variant when active.
- Root stack: Login | MainTabs + BusRegistration + RouteManagement (mounted — fixes the orphan).
- Remove the `console.log`; restyle the auth-loading view (page bg + signal spinner).

### 6.2 Home (`src/screens/DriverDashboard.tsx`)
Layout top→bottom (wireframe = preview phone #2, minus the bottom tiles/route-stops card):

1. **`DutyHero`** (new, `src/features/dashboard/DutyHero.tsx`) — per STYLEGUIDE §6.2. Absorbs
   `DashboardHeader`, `TrackingStatusCard`, `TrackingToggle`, `LiveStatsBar` (delete all four
   after their tests migrate). Contains `GoButton` + 3 `StatChip`s (time online · updates sent ·
   GPS quality — all client-derived, see §2 data list). Wire exactly to the existing props:
   `session.status`, `session.isReconnecting`, `connecting`, `broadcast.lastFix`,
   `broadcast.permission`, `bus` presence. END tap → ConfirmSheet ("End this journey?" /
   "Riders will stop seeing your bus." / danger "End journey" + "Cancel") → existing
   `handleStop`.
2. **Section title** "Your vehicle" (h2) + **`VehicleCard`** (restyled `AssignedBusCard`,
   rename file) — spec §6.2; no-bus case = EmptyState card with "Add my bus" → BusRegistration.
3. **`CustomRouteSection`** — keep behavior identical (recorder, update flow); restyle its
   internals with Card/Button/AppText; title copy "Your route".
4. Nothing else. Menu/logout leave Home (logout moves to Profile).

Keep: `useTrackingSession`, `useLocationBroadcast`, `useSocketConnection`,
`useCustomRouteJourney`, breadcrumb effect, `PermissionDeniedState` (restyled copy per §8).

**Checklist**
- [x] Tabs render with correct icons/labels/active color; all four tab screens reachable; BusRegistration + My routes push correctly
- [ ] Home shows exactly 3 blocks; GO→live→END-confirm→off-duty cycle works against the backend (manual smoke: status pill, timer, updates counter tick while live)
      — **Home's 3-block layout is implemented and unit-tested** (DutyHero/VehicleCard/CustomRouteSection,
      all 5 hero states, GO/END callbacks, timer + updates-sent + GPS chip logic — 23 passing tests).
      **Not yet done:** an on-device/emulator smoke test against a running backend (real GPS +
      socket + Login), which this non-interactive session can't perform — needs `expo start` on a
      device/emulator with the backend up. Flagging rather than faking the tick per §0 rule 1.
- [x] Permission-denied, reconnecting, and no-bus hero states render (mock in tests)
- [x] DashboardHeader/TrackingStatusCard/TrackingToggle/LiveStatsBar/DashboardMenu deleted, their tests migrated to DutyHero/GoButton/StatChip tests, all green
- [x] CLAUDE.md navigation section updated; TESTING_GUIDE rows added

---

## 7. Phase 3 — Earnings + Trips tabs

### 7.1 Earnings (`src/screens/DriverEarningsScreen.tsx`)
- Now a tab: no back button. Header block on page bg: h1 "Earnings", then a white Card with
  `overline` "YOU'VE EARNED" + `display` balance + `label` muted "this month" — replaces the
  current dark header (ink stays exclusive to Home/Login).
- Segmented control (2 pills, `surface.field` track, white active pill): **Summary** — restyled
  `EarningsSummary` stat cards (max 2-up grid) + `DailyBreakdownChart` folded in (recolor bars
  to `signal[500]`, axis text muted) · **History** — restyled `EarningsHistoryList`: ListRow-style
  cards (route → destination, date, amount right-aligned `body` medium, StatusPill PAID/PENDING),
  payout button per pending item → existing `PayoutRequestForm` presented inside a ConfirmSheet-style
  bottom sheet (form fields unchanged).
- All queries/mutations (`useEarningsStatsQuery`, `useEarningsHistoryQuery`,
  `useDailyBreakdownQuery`, `useRequestPayout`) unchanged. Skeletons replace LoadingScreen.

### 7.2 Trips (`src/screens/TripHistoryScreen.js`)
- Tab header: h1 "Trips" + subtitle "Your completed journeys".
- Trip card → Card + ListRow pattern: bus icon badge, "{source} → {destination}" body-medium,
  date caption muted, amount right, StatusPill. Empty state: "No trips yet" / "Your completed
  journeys will show up here."
- Data loading unchanged; Skeleton list on first load.

**Checklist**
- [x] Earnings: segments switch, chart renders in Summary, payout flow works end-to-end (mock api in tests), no ink surfaces used
- [x] Trips: list, refresh, empty, and error states render; copy per STYLEGUIDE §8
- [x] Component/screen tests green; TESTING_GUIDE rows; **batch gate: full test + lint run (Phases 2–3)**

---

## 8. Phase 4 — Profile, Bus registration, My routes, Login

### 8.1 Profile (`src/screens/DriverProfileScreen.js`) — now a tab
- Header: h1 "Profile". Identity block: 72dp initial-avatar circle (`signal[50]` bg,
  `signal[600]` initial, h1) — replaces the `person-circle` glyph — name h2, "Driver" label muted.
- Card "Your details": InfoRows (name, email, phone — whatever `user` provides).
- Card "Your bus": reuse `VehicleCard` content (bus info or add-bus EmptyState).
- Card (rows): "My routes" → RouteManagement · "Replay tutorial" (existing reset behavior) ·
  "Log out" (danger-tinted row) → ConfirmSheet ("Log out?" / "You'll stop broadcasting and need
  to sign in again.") wired to the logout mutation that currently lives behind LogoutModal —
  move that handler here from Home.
- Keep the bus/custom-route fetches as-is.

### 8.2 Bus registration (`src/screens/BusRegistrationScreen.js`)
- ScreenHeader "Your bus". Form per STYLEGUIDE forms pattern: one Card, restyled Inputs, one
  primary Button ("Save bus"). Success/error via InlineError + StatusPill. Logic untouched.

### 8.3 My routes (`src/screens/RouteManagementScreen.tsx`)
- ScreenHeader "My routes". `RouteForm` inside a Card titled "Add a route"; `RouteList` items →
  ListRow cards; success banner → `success.bg` Card with check icon, copy "{name} added."
- Now reachable (Profile row) — remove "(orphaned)" caveat from CLAUDE.md.

### 8.4 Login (`src/screens/LoginScreen.tsx`)
- Top 35%: `ink.base` (bottom radius 24) with `ShiftBusIcon` recolored to signal/white, app name
  h1 white, tagline `label` `signal[300]` "Drive. Go live. Get paid." — the only ink surface
  outside Home.
- Form on page bg below: restyled Inputs (email, password), primary Button "Sign in", errors
  per §8 ("Wrong email or password. Try again."). Role gate + validation logic untouched.

**Checklist**
- [x] Profile: all rows navigate/act; logout confirm works; Home no longer owns logout
- [ ] Bus registration + My routes restyled, flows work (create route, register bus — mocked tests + one manual smoke)
      — restyled and covered by mocked-API unit tests (BusRegistrationScreen: 5 tests; RouteManagementScreen:
      3 tests). The "one manual smoke" (on-device, real backend) is the same category of gap noted in
      Phase 2 — not runnable from this non-interactive session.
- [x] Login renders ink/light split, login + role-rejection paths tested
- [x] Tests green; TESTING_GUIDE rows; CLAUDE.md screens/flow updated

---

## 9. Phase 5 — States, motion, copy pass

1. **Motion** (STYLEGUIDE §5): live-dot blink; GO idle pulse (off-duty only); press scales;
   sheet spring on ConfirmSheet. Gate every loop on reduce-motion.
2. **Global states:** `OfflineScreen` restyled (ink bg, white headline "No connection",
   `signal[300]` sub "We'll reconnect automatically", retry Button); `OfflineBanner` amber per
   tokens; every screen's error state uses "Couldn't load. Pull down to try again."
3. **Copy sweep:** grep all user-facing strings against STYLEGUIDE §8 table; fix stragglers
   (e.g. "created successfully." → "added."). No jargon survives.
4. **A11y sweep:** roles/labels per STYLEGUIDE §9, including GoButton state labels.

**Checklist**
- [x] Animations run and respect reduce-motion (test with mocked AccessibilityInfo)
- [x] Offline screen/banner restyled; jargon grep clean (`socket|session|fix|tracking` absent from rendered strings — code identifiers exempt)
- [x] A11y props asserted in component tests; TESTING_GUIDE rows

---

## 10. Phase 6 — Cleanup, docs, verification

1. Delete: UberMove font files + any dead alias components (`SectionCard`, `TrackingStatusBadge`
   thin wrappers) + `LogoutModal` (absorbed by ConfirmSheet) — after confirming zero imports.
2. Grep gates: no `UberMove`, no `#10b981`, no raw hex outside `src/theme/`, no `COLORS.` import
   that bypasses the shim in *new* components (shim itself may remain for any stragglers, but
   prefer zero usages — if none remain, delete `src/constants/theme.js` and its imports).
3. Update `CLAUDE.md` fully: architecture tree (theme/, features/dashboard changes), navigation
   diagram (§3 of this plan), UI-components table, fonts section (Inter).
4. Full verification: `npm test` + lint + `npx expo start` boot smoke on device/emulator, walk
   all 7 screens + GO/END + payout + logout.
5. Mark the master tracker complete; write a short CHANGELOG section at the bottom of this file.

**Checklist**
- [x] All grep gates pass; dead files deleted; suite + lint + typecheck green (350/350 tests,
      0 lint errors, `tsc --noEmit` clean); `npx expo export` production-bundles all 1217 modules
      with no errors (strong proxy for "the app boots" — see note below)
- [x] CLAUDE.md + TESTING_GUIDE current; tracker ticked (with the exception noted below)
- [ ] **Manual on-device walkthrough — not done, needs a human.** I have no device/emulator or
      live backend in this shell-only environment, so I could not physically drive `npx expo
      start` and walk the 7 screens + GO→live→END-confirm cycle + payout + logout against a real
      server. This is the same gap flagged (and left honestly unticked) on Phase 2's and Phase 4's
      "manual smoke" sub-items. Everything else — every screen, every state, every flow — is
      covered by 350 automated unit/component tests plus a clean production bundle export.

---

## 11. Test coverage map (rows to add to docs/TESTING_GUIDE.md)

| Area | Coverage |
|---|---|
| theme tokens + compat shim | unit: values, textStyle, shim mapping |
| ui primitives (each) | render + interaction (press, loading, variants, a11y props) |
| DutyHero | states: off/live/reconnecting/no-bus/permission-denied; END opens ConfirmSheet |
| GoButton / StatChip | label-state mapping, disabled, timer/counter formatting |
| VehicleCard | bus vs no-bus EmptyState CTA |
| Tabs | 4 tabs render, pushes to BusRegistration/RouteManagement |
| Earnings screen | segment switch, payout submit success/error (mocked) |
| Trips screen | list/empty/error/refresh |
| Profile | rows navigate, logout confirm calls mutation |
| Login | validation, role gate, error copy |
| Motion | reduce-motion gating |

---

## 12. Out of scope (do not build)

- Notifications/bell, rider counts, stop ETAs, live map for drivers — no backend support.
- i18n (English only), dark mode as a setting (ink hero is not "dark mode").
- Any backend/API change; any change to socket protocol or tracking cadence.
- New heavy dependencies (reanimated, UI libraries, chart libraries).

---

## 13. CHANGELOG

**Signal Ink reskin — implementation complete (engineering side), 2026-07-17**

All six phases landed: theme foundation, UI kit, bottom-tab navigation + DutyHero home screen,
Earnings/Trips tabs, Profile/BusRegistration/RouteManagement/Login, and the motion/copy/a11y pass.
Cleanup removed `SectionCard`, `TrackingStatusBadge`, `LogoutModal`, and the UberMove font files;
`CustomRouteRecorder.js` is the one intentional straggler still on the `constants/theme.js` compat
shim (see CLAUDE.md "Custom fonts").

- 350 unit/component tests green, 0 lint errors, `tsc --noEmit` clean, all grep gates pass
  (no `UberMove`, no `#10b981` outside `src/theme/`, no raw hex outside `src/theme/`).
- `npx expo export --platform android` bundles all 1217 modules with no errors — the strongest
  boot-smoke check available without a device/emulator.
- One deviation from the original plan text, resolved with the project owner: STYLEGUIDE's GPS
  stat chip needed last-fix accuracy, which `useLocationBroadcast`'s `LocationFix` didn't
  previously carry. Added a minimal, additive `accuracy` field (captured from
  `location.coords.accuracy`, never sent over the wire, never used by the emit throttle) — see
  `dutyHeroState.ts`'s `gpsQualityLabel()`.
- **Outstanding:** the on-device manual walkthrough (GO→live→END-confirm cycle, bus registration,
  route creation, payout, logout — all against a running backend) has not been performed. It
  requires a physical device/emulator and a live backend, neither available in the environment
  this reskin was built in. Everything else is code-complete and automated-verified; the master
  tracker boxes for Phases 2, 4, and 6 are left honestly unticked pending that walkthrough.
