# driver-app — TrackMe Driver App

Expo React Native app (SDK ~54) for bus drivers: go on duty, broadcast real-time GPS, scan
passenger QR passes, record custom routes, and track earnings. Standalone project — shares
**no code** with `user-app`.

**This file is a router, not a manual.** It gives you the shape of the app and points you at the
one doc you need. Deep detail lives in [`docs/`](docs/README.md) — do not duplicate it here.

---

## Session start

1. Check claude-mem for prior context (`/mem-search <topic>`) before re-reading files.
2. Open [`docs/README.md`](docs/README.md) — the documentation map.
3. Doing feature / test / release work? Go straight to the matching guide:
   - **Adding a feature** → [`docs/guides/ADDING_A_FEATURE.md`](docs/guides/ADDING_A_FEATURE.md)
   - **Adding a test** → [`docs/guides/ADDING_A_TEST.md`](docs/guides/ADDING_A_TEST.md)
   - **Cutting a release** → [`docs/guides/RELEASING.md`](docs/guides/RELEASING.md)
   - **Working a GitHub issue** (agent routine/schedule or manual "finish up #N") →
     [`docs/guides/WORKING_AN_ISSUE.md`](docs/guides/WORKING_AN_ISSUE.md)
4. Before you push, append an entry to [`docs/CHANGES.md`](docs/CHANGES.md).

**One-time setup per clone:**
```bash
git config core.hooksPath .githooks
```

> **The hero path is location broadcast.** If a change touches GPS, the socket, or duty state, read
> [`docs/LOCATION_TRACKING.md`](docs/LOCATION_TRACKING.md) first — passengers see a stale or absent
> bus when this breaks, and the failure is invisible from inside this app.

---

## Where to look (the map)

| I need to… | Read |
|---|---|
| **GPS broadcast, duty state, socket emit** (the hero feature) | [`docs/LOCATION_TRACKING.md`](docs/LOCATION_TRACKING.md) |
| Driver sign-in / session / role gate | [`docs/modules/AUTH.md`](docs/modules/AUTH.md) |
| The Home/duty screen (DutyHero, GoButton, vehicle card) | [`docs/modules/DASHBOARD.md`](docs/modules/DASHBOARD.md) |
| QR scanning + boarding/alighting + the on-board roster | [`docs/modules/BOARDING.md`](docs/modules/BOARDING.md) |
| Registering / selecting a bus | [`docs/modules/BUS_REGISTRATION.md`](docs/modules/BUS_REGISTRATION.md) |
| Recording + submitting custom routes | [`docs/modules/ROUTE_MANAGEMENT.md`](docs/modules/ROUTE_MANAGEMENT.md) |
| Earnings, payouts, daily breakdown | [`docs/modules/EARNINGS.md`](docs/modules/EARNINGS.md) |
| Trip history | [`docs/modules/TRIP_HISTORY.md`](docs/modules/TRIP_HISTORY.md) |
| Driver profile | [`docs/modules/PROFILE.md`](docs/modules/PROFILE.md) |
| Offline / backend-status handling | [`docs/modules/OFFLINE_STATUS.md`](docs/modules/OFFLINE_STATUS.md) |
| Data fetching / caching | [`docs/DATA_LAYER.md`](docs/DATA_LAYER.md) |
| Error taxonomy + UI states | [`docs/ERROR_HANDLING.md`](docs/ERROR_HANDLING.md) |
| Folder structure / layering / TS policy | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| The "Signal Ink" reskin | [`docs/redesign/SIGNAL_INK_PLAN.md`](docs/redesign/SIGNAL_INK_PLAN.md) · [`STYLEGUIDE.md`](docs/redesign/STYLEGUIDE.md) |

---

## Architecture at a glance

```
src/
  screens/            One file per screen (DriverDashboard, QRScanner, BoardingRoster,
                      VehicleRegistration, TripHistory, DriverProfile, Login)
  features/<domain>/  dashboard (DutyHero, GoButton, OnBoardCard, TripProgressCard,
                      dutyHeroState.ts, useSocketConnection), boarding, vehicle-registration,
                      profile
  components/         ErrorBoundary, OfflineScreen, PermissionDeniedState, ShiftVehicleIcon (SVG
                      logo mark); components/ui/ = Signal Ink primitives
  context/
    AuthContext.js    Auth state, login/logout, token refresh, authenticatedRequest()
  navigation/          AppNavigator — auth gate → MainTabs + pushed screens
  hooks/<domain>/      auth, boarding, vehicle, route (TanStack Query)
  services/
    api/ + api.js      HTTP calls
    socket.ts          Socket.IO — emitLocation, start/stopTracking
    backendStatus.js   Health poller → online/offline
  lib/                 queryKeys, errors
  helpers/             formatters, geo (haversine), locationUtils (shouldEmit throttle)
  theme/               Signal Ink tokens + `theme` object; constants/theme.js is a compat shim
```

### Navigation flow

```
App.js
└── AppNavigator (root native stack)
    ├── [offline]      → OfflineScreen
    ├── [logged out]   → Login            (only role `driver` may sign in — enforced in LoginScreen)
    └── [logged in]    → MainTabs (bottom tabs) + pushed: VehicleRegistration, QRScanner, BoardingRoster
                           MainTabs:
                           ├── Dashboard      ("Home" tab — DutyHero + VehicleCard + OnBoardCard + TripProgressCard)
                           ├── TripHistory    ("Trips" tab)
                           └── DriverProfile  ("Profile" tab)
```

`AppNavigator` receives `backendOnline` prop from `App.js`.
Tab screen names stay `Dashboard`/`TripHistory`/`DriverProfile` so existing
`navigation.navigate('…')` call sites keep working; pushed screens (`VehicleRegistration`,
`QRScanner`, `BoardingRoster`) are registered on the root stack above the tabs, so navigating to
them from a tab bubbles up automatically.
See `docs/redesign/SIGNAL_INK_PLAN.md` for the in-progress "Signal Ink" reskin driving this.

---

## The non-negotiables

- **Location broadcast is the product.** Don't change emit cadence, throttling (`shouldEmit`), or
  duty state without reading [`docs/LOCATION_TRACKING.md`](docs/LOCATION_TRACKING.md) and adding tests.
- **No untested code.** Behaviour changes ship with tests + a
  [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) row.
- **No undocumented module.** Update the [`docs/modules/`](docs/modules/) doc, from
  [`docs/guides/_MODULE_TEMPLATE.md`](docs/guides/_MODULE_TEMPLATE.md).
- **Socket events are a backend contract.** Changing one means updating
  [`backend/docs/modules/REALTIME.md`](../backend/docs/modules/REALTIME.md) too.
- **Log the session.** Append to [`docs/CHANGES.md`](docs/CHANGES.md) before every push.

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

Used across `TripHistoryScreen` and `DriverProfileScreen`. `formatCurrency` is retained for
future use; the driver app no longer displays money anywhere (earnings removed 2026-08-07).

---

## Running tests

```bash
npm start          # expo
npm test           # jest
npm run typecheck
npm run lint
npm run test:e2e   # maestro test .maestro   (--dry-run via test:e2e:dry)
```
