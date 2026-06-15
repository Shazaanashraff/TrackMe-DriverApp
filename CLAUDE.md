# driver-app — TrackMe Driver App

Expo React Native app (SDK ~54) for bus drivers to manage journeys and broadcast real-time location.
Treat this as a standalone project — it shares no code with `user-app`.

---

## Architecture

```
src/
  components/
    ui/               # Reusable primitive UI components
    ShiftBusIcon.js   # SVG bus logo mark
    OfflineScreen.js  # Full-screen offline fallback
  config.js           # API base URL
  constants/
    theme.js          # COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS
  context/
    AuthContext.js    # Auth state, login/logout, token refresh, authenticatedRequest()
  helpers/
    formatters.js     # formatCurrency(), formatDate(), formatTime(), formatDateTime()
  navigation/
    AppNavigator.js   # Root navigator: auth gate → dashboard stack
  screens/            # One file per screen
  services/
    api.js            # All HTTP calls
    backendStatus.js  # Health-check poller, pub/sub for online/offline state
    notificationService.js
    socket.js         # Socket.IO — emit GPS location, manage tracking session
```

---

## Navigation flow

```
App.js
└── AppNavigator
    ├── [offline]      → OfflineScreen
    ├── [logged out]   → Login
    └── [logged in]    → Dashboard stack
                           ├── DriverDashboard (home)
                           ├── DriverProfile
                           ├── TripHistory
                           ├── DriverEarnings
                           ├── BusRegistration
                           └── RouteManagement
```

`AppNavigator` receives `backendOnline` prop from `App.js`.
Only `driver` role users may log in (enforced in `LoginScreen`).

---

## Key patterns

### AuthContext
- Same pattern as user-app: stores tokens in AsyncStorage, exposes `authenticatedRequest()`.
- Driver-specific: login checks `user.role === 'driver'` before calling `login()`.

### Location tracking (DriverDashboard)
- `expo-location` `watchPositionAsync` at 3 s / 3 m intervals while tracking.
- Each location update calls `emitLocation()` from `services/socket.js` which emits a `update-location` socket event to the backend.
- `startTrackingSession()` / `stopTracking()` are socket calls that tell the backend to mark the bus as live or offline.

### backendStatus service
- Identical pattern to user-app; started in `App.js`, checked via `isBackendConnectionError()` in catch blocks.

### Custom fonts
- `expo-font` loads the `UberMove` font family (Bold, Medium) from `assets/fonts/`.
- `FONTS.bold` / `FONTS.medium` constants reference these loaded families.
- `SplashScreen.preventAutoHideAsync()` keeps the splash visible until fonts are loaded.

---

## UI components (`src/components/ui/`)

| Component      | Purpose |
|----------------|---------|
| `FormInput`    | Labeled text input with optional Ionicons icon |
| `PrimaryButton`| Navy button with loading/disabled state; override color via `style` prop |
| `ScreenHeader` | Back (chevron-back) + centered title + right placeholder |
| `InfoRow`      | Horizontal label/value row with bottom border (used in DriverProfile) |
| `SectionCard`  | White card with optional title and shadow (used in DriverProfile, BusRegistration) |
| `LoadingScreen`| Full-screen centered ActivityIndicator |

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

`src/config.js` exports `API_BASE_URL`. Update for local dev vs. production.
The backend health endpoint is `GET /health`.

---

## Testing policy (no untested code)
- Any feature or behavior change must add unit tests for new or changed helpers and components.
- Any backend contract change requires updated integration tests and a new row in docs/TESTING_GUIDE.md.
- Keep test:unit and test:e2e green before marking work done.
