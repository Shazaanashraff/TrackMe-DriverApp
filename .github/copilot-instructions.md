# Copilot Instructions — driver-app (TrackMe Driver App)

## Before you start

Check `claude-mem` for prior context before reading files or exploring the codebase.
This avoids re-analysing files already covered in a previous session and saves tokens.

```
/mem-search <topic>         # search observations by keyword
get_observations([IDs])     # fetch specific observations from the session reminder
```

Only read files directly when claude-mem has no relevant context, or to verify a memory is still current.

---

## Project

Expo React Native app (SDK ~54) for bus drivers to manage journeys and broadcast real-time location.
This is a **standalone project** — it shares no code with `user-app`.

---

## Architecture

```
src/
  components/
    ui/               # Reusable primitive UI components — use these before creating new ones
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
    api.js            # All HTTP calls — never call fetch directly from a screen
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
Only `driver` role users may log in — enforced in `LoginScreen`.

---

## Key patterns

### AuthContext
- Stores `user`, `token`, `refreshToken` in AsyncStorage.
- Exposes `authenticatedRequest(apiFn, ...args)` — always use this for protected endpoints.
- Login checks `user.role === 'driver'` before calling `login()`.

### Location tracking (DriverDashboard)
- `expo-location` `watchPositionAsync` at 3 s / 3 m intervals while tracking.
- Each update calls `emitLocation()` from `services/socket.js` → emits `update-location` socket event.
- `startTrackingSession()` / `stopTracking()` tell the backend to mark the bus live or offline.

### API calls
- All HTTP calls go through `src/services/api.js`.
- Never call `fetch` directly from a screen.
- Protected calls must go through `authenticatedRequest()` in `AuthContext`.

### backendStatus service
- `startBackendMonitor()` / `stopBackendMonitor()` — called in `App.js`.
- `isBackendConnectionError(error)` — check this in catch blocks before showing alerts.

### Custom fonts
- `expo-font` loads the `UberMove` font family (Bold, Medium) from `assets/fonts/`.
- Use `FONTS.bold` / `FONTS.medium` constants from `theme.js` — never reference font names as raw strings.
- `SplashScreen.preventAutoHideAsync()` keeps splash visible until fonts are loaded.

---

## UI components (`src/components/ui/`)

| Component      | Purpose |
|----------------|---------|
| `FormInput`    | Labeled text input with optional Ionicons icon |
| `PrimaryButton`| Navy button with loading/disabled state; override color via `style` prop |
| `ScreenHeader` | Back (chevron-back) + centered title + right placeholder |
| `InfoRow`      | Horizontal label/value row with bottom border (used in DriverProfile) |
| `SectionCard`  | White card with optional title and shadow |
| `LoadingScreen`| Full-screen centered ActivityIndicator |

---

## Helpers (`src/helpers/formatters.js`)

| Function | Returns |
|----------|---------|
| `formatCurrency(amount)` | `"Rs. 0.00"` |
| `formatDate(dateString)` | `"15 Jun 2024"` |
| `formatTime(dateString)` | `"02:30 PM"` |
| `formatDateTime(dateString)` | date + time combined |

---

## Environment

- `src/config.js` exports `API_BASE_URL`. Update for local dev vs. production.
- The backend health endpoint is `GET /health`.

---

## Rules

- Never share or import code from `user-app`.
- Always use existing UI components from `src/components/ui/` before creating new ones.
- Use `COLORS`, `FONTS`, `SPACING`, `BORDER_RADIUS` from `src/constants/theme.js` — no inline magic numbers.
- Do not add comments that explain *what* the code does — only add them when the *why* is non-obvious.

---

## Testing policy (no untested code)
- Any feature or behavior change must add unit tests for new or changed helpers and components.
- Any backend contract change requires updated integration tests and a new row in docs/TESTING_GUIDE.md.
- Keep test:unit and test:e2e green before marking work done.
