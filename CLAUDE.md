# driver-app — TrackMe Driver App

Expo React Native app (SDK ~54) for bus drivers to manage journeys and broadcast real-time location.
Treat this as a standalone project — it shares no code with `user-app`.

---

## Architecture

```
src/
  components/
    ui/               # Reusable primitive UI components (Signal Ink)
    ShiftBusIcon.js   # SVG bus logo mark
    OfflineScreen.js  # Full-screen offline fallback (ink themed)
    PermissionDeniedState.tsx # Compact "Allow location" block rendered inside DutyHero
    CustomRouteRecorder.js    # Map-free breadcrumb recorder (unrestyled — still on the
                               # constants/theme.js compat shim, see "Custom fonts" below)
  config.js           # API base URL
  constants/
    theme.js          # Compat shim re-exporting src/theme/ as COLORS/FONTS/SPACING/BORDER_RADIUS/SHADOWS
  context/
    AuthContext.js    # Auth state, login/logout, token refresh, authenticatedRequest()
  features/
    dashboard/        # DutyHero, GoButton, StatChip, VehicleCard, CustomRouteSection,
                       # dutyHeroState.ts (pure headline/subline/dot state machine),
                       # useCustomRouteJourney, useSocketConnection
    earnings/          # EarningsSummary, EarningsHistoryList, DailyBreakdownChart, PayoutRequestForm
    route-management/  # RouteForm, RouteList, RouteListItem
  helpers/
    formatters.js     # formatCurrency(), formatDate(), formatTime(), formatDateTime()
    geo.js            # haversineMeters(), totalDistanceMeters(), formatElapsed()
    locationUtils.ts  # LocationFix type (lat/lng/timestamp/accuracy), shouldEmit() throttle
  navigation/
    AppNavigator.js   # Root native stack: auth gate → MainTabs (bottom tabs) + pushed screens
  screens/            # One file per screen
  services/
    api.js            # All HTTP calls
    backendStatus.js  # Health-check poller, pub/sub for online/offline state
    notificationService.js
    socket.js         # Socket.IO — emit GPS location, manage tracking session
  theme/
    tokens.js         # Signal Ink design tokens (color/type/space/radius/motion) — ported
                       # from user-app, plus driver-only `ink` (duty hero) and `duty` (status) groups
    index.js           # Assembled `theme` object + `textStyle()`/`fontFamily()` helpers
```

---

## Navigation flow

```
App.js
└── AppNavigator (root native stack)
    ├── [offline]      → OfflineScreen
    ├── [logged out]   → Login
    └── [logged in]    → MainTabs (bottom tabs) + BusRegistration + RouteManagement
                           + QRScanner + BoardingRoster
                           MainTabs:
                           ├── Dashboard      ("Home" tab — DutyHero + VehicleCard + scan card
                           │                    + OnBoardCard ("X/Y on board") + custom-route section)
                           ├── DriverEarnings ("Earnings" tab)
                           ├── TripHistory    ("Trips" tab)
                           └── DriverProfile  ("Profile" tab)
```

`AppNavigator` receives `backendOnline` prop from `App.js`.
Only `driver` role users may log in (enforced in `LoginScreen`).
Screen names inside `MainTabs` stay `Dashboard`/`DriverEarnings`/`TripHistory`/`DriverProfile` so
existing `navigation.navigate('…')` call sites keep working; `BusRegistration`,
`RouteManagement`, `QRScanner`, and `BoardingRoster` (the enrolled on-board roster opened from the
Home `OnBoardCard`) are pushed screens registered on the root stack above the tabs — calling
`navigation.navigate('BusRegistration')` from a tab screen bubbles up automatically.
See `docs/redesign/SIGNAL_INK_PLAN.md` for the in-progress "Signal Ink" reskin driving this.

---

## Key patterns

### AuthContext
- Same pattern as user-app: stores tokens in AsyncStorage, exposes `authenticatedRequest()`.
- Driver-specific: login checks `user.role === 'driver'` before calling `login()`.

### Location tracking (DriverDashboard / DutyHero)
- `expo-location` `watchPositionAsync` at 3 s / 3 m intervals while tracking.
- Each location update calls `emitLocation()` from `services/socket.js` which emits a `update-location` socket event to the backend.
- `startTracking()` / `stopTracking()` are socket calls that tell the backend to mark the bus as live or offline.
- `useLocationBroadcast`'s `LocationFix` also carries `accuracy` (meters, from
  `location.coords.accuracy`) — UI-only, never sent over the wire or used by the emit throttle.
  It powers the DutyHero GPS stat chip (`gpsQualityLabel()` in `dutyHeroState.ts`: ≤25 m = "Good").
- "Time online" and "updates sent" on the hero are derived client-side inside `DutyHero.tsx`
  (elapsed timer since `status` becomes `'tracking'`; a counter incremented on each new `lastFix`)
  — neither is tracked by the hooks themselves.

### backendStatus service
- Identical pattern to user-app; started in `App.js`, checked via `isBackendConnectionError()` in catch blocks.

### Custom fonts
- `@expo-google-fonts/inter` loads `Inter_400Regular` / `Inter_500Medium` (no bold weight — the
  Signal Ink design uses size/color for emphasis, not font weight).
- `src/theme/` is the source of truth for typography/color/spacing. `src/constants/theme.js` is a
  compat shim re-exporting it as `COLORS`/`FONTS`/`SPACING`/`BORDER_RADIUS`/`SHADOWS` — every
  screen has migrated off it except `CustomRouteRecorder.js` (a large, already-tested breadcrumb
  state machine that was intentionally left unrestyled; it renders identically either way since
  the shim maps 1:1 onto the same Signal Ink values). New code must import from `src/theme` directly.
- `SplashScreen.preventAutoHideAsync()` keeps the splash visible until fonts are loaded.

---

## UI components (`src/components/ui/`)

| Component      | Purpose |
|----------------|---------|
| `AppText`      | Text with a type-scale `variant` (display/h1/h2/body/label/caption/overline); `onInk` for white-on-navy, `weight` to override the role's default weight |
| `Card`         | White card, radius 12, hairline border, optional `title` |
| `ListRow`      | Icon-badge + title/subtitle/value row, optional `onPress` + chevron |
| `StatusPill`   | Pill badge; variants neutral/live/warn/danger |
| `EmptyState`   | Centered icon + title/subtitle + optional action Button |
| `Skeleton`     | Pulsing placeholder block (reduce-motion aware) — replaces full-screen spinners in lists |
| `ConfirmSheet` | Bottom-sheet confirm/cancel modal (End journey, Log out) |
| `FormInput`    | Labeled text input; `icon`, `error` props; focus ring in signal blue |
| `PrimaryButton`| `variant` = primary/secondary/danger; `loading`/`disabled`; override style via `style` prop |
| `ScreenHeader` | Back (chevron-back) + left-aligned title + right placeholder |
| `InfoRow`      | Horizontal label/value row with bottom border (used in DriverProfile) |
| `LoadingScreen`| Full-screen centered ActivityIndicator, page bg + signal-blue spinner |
| `OfflineBanner` / `InlineError` / `ErrorState` | Status/error surfaces recolored to theme tokens |

All primitives read colors/type/spacing from `src/theme/` only (no hardcoded hex). See
`docs/redesign/STYLEGUIDE.md` §6.1 for the full spec each one implements.

---

## Helpers (`src/helpers/formatters.js`)

| Function | Returns |
|----------|---------|
| `formatCurrency(amount)` | `"Rs. 0.00"` format |
| `formatDate(dateString)` | `"15 Jun 2024"` format |
| `formatTime(dateString)` | `"02:30 PM"` format |
| `formatDateTime(dateString)` | date + time combined |

Used across `DriverEarningsScreen` and `TripHistoryScreen`.

---

## Running tests

```bash
npm install
npm test
```

Tests live next to the code they test in `__tests__/` subdirectories.
- `src/helpers/__tests__/formatters.test.js` — pure function unit tests
- `src/components/ui/__tests__/components.test.js` — component render tests

---

## Environment

`src/config.js` exports `API_URL` and `SOCKET_URL`, both built as `http://<host>:5000`. The
host resolves from `EXPO_PUBLIC_API_HOST` (env var, see `.env.example`), then Expo's dev-server
host (LAN dev), then falls back to `localhost`.
The backend health endpoint is `GET /health`.

Architecture/testing plans live in `docs/`; task execution lives in `todos/`.

---

## Testing policy (no untested code)
- Any feature or behavior change must add unit tests for new or changed helpers and components.
- Any backend contract change requires updated integration tests and a new row in docs/TESTING_GUIDE.md.
- Keep test:unit and test:e2e green before marking work done.
