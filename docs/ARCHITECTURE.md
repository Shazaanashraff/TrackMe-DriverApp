# Driver App — Target Architecture

> Target structure the restructure TODOs move toward. Source of truth cited by every
> restructure/UI TODO. The driver app's **hero feature is broadcasting GPS** (not consuming a
> map), so the realtime/location layer is first-class — see LOCATION_TRACKING.md.

## Stack (as installed)

- Expo SDK ~54, React Native 0.81, React 19; React Navigation v7.
- Location: `expo-location` (`watchPositionAsync`). Realtime: `socket.io-client`.
- Storage: `@react-native-async-storage/async-storage`. Fonts: `expo-font` (UberMove).
- **No maps library** (driver broadcasts position; optionally shows own dot).
- **Added by restructure:** `@tanstack/react-query` (+ persister), TypeScript (incremental),
  Maestro (E2E, dev tooling).

## Layering rules (enforced by review + lint)

```
screens / components     UI only. No fetch(), no api.* calls, no AsyncStorage token reads.
        │ (calls hooks)
        ▼
hooks                    useXQuery / useXMutation; useTrackingSession; useLocationBroadcast.
        │
        ▼
services/api  +  services/socket (tracking transport)  +  services/location
        │
        ▼
backend
```

- Screens never call `api.*` directly (today 7+ screens do).
- Hooks never embed fetch/socket emit logic directly except via the typed service.
- Only `AuthContext` + the api transport touch tokens.
- No cross-app imports (`user-app`, `web-admin`, `backend`).
- New files TypeScript; convert a `.js` only when a TODO edits it.

## Target folder structure

```
src/
  app/
    App.tsx               # Providers: QueryClientProvider, AuthProvider, NavigationContainer, fonts/splash
    queryClient.ts        # QueryClient + AsyncStorage persister
  config.ts               # API_URL, SOCKET_URL (env-driven)
  constants/theme.ts      # COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS
  lib/
    errors.ts             # AppError, normalizeError, userMessage (+ location/permission kinds)
    queryKeys.ts          # central query-key registry
    logger.ts             # __DEV__-gated logging (no token material)
  services/
    api/
      transport.ts        # requestJson: timeout, size guard, single read, error normalize
      authHeaders.ts
      auth.ts  bus.ts  routes.ts  earnings.ts
      index.ts            # re-export as `api` (stable surface)
    socket.ts             # Socket.IO: connect + driver:location/start-tracking/stop-tracking
    location.ts           # expo-location watch wrapper (permissions, throttle, buffer)
    backendStatus.ts
    notificationService.ts
  context/
    AuthContext.tsx       # tokens, role-gated login, authenticatedRequest()
  hooks/
    auth/                 # useLogin (driver-gated), useRegister, useLogout
    bus/                  # useMyBusQuery, useRegisterBus, useUpdateBus
    routes/               # useRoutesQuery, useRoutesManagementQuery, useCreateRoute
    earnings/             # useEarningsStatsQuery, useEarningsHistoryQuery, useDailyBreakdownQuery, useRequestPayout
    useTrackingSession.ts # start/stop tracking lifecycle (socket acks)
    useLocationBroadcast.ts # watch position → throttle/batch → emit; offline buffer
  helpers/
    formatters.ts         # formatCurrency/Date/Time/DateTime (exists)
    locationUtils.ts      # (new) distance, throttle, coord validation
  components/
    ui/                   # FormInput, PrimaryButton, ScreenHeader, InfoRow, SectionCard,
                          #   LoadingScreen + ErrorState, InlineError, OfflineBanner
    ShiftBusIcon.tsx, OfflineScreen.tsx, ErrorBoundary.tsx
  features/
    dashboard/            # TrackingToggle, TrackingStatusCard, AssignedBusCard, LiveStatsBar
    earnings/             # EarningsSummary, PayoutRequestForm, EarningsHistoryList, DailyBreakdownChart
    route-management/     # RouteForm, RouteList, RouteListItem
    bus-registration/     # BusRegistrationForm, RoutePicker
  navigation/AppNavigator.tsx
  screens/                # thin: compose features + hooks
```

## Screen size budget (drives UI-split TODOs)

| Screen | Current LOC | Target | Action |
|---|---|---|---|
| DriverDashboard | 657 | ≤250 | split into `features/dashboard/*` + tracking hooks |
| DriverEarningsScreen | 613 | ≤250 | split into `features/earnings/*` |
| RouteManagementScreen | 490 | ≤250 | split into `features/route-management/*` |
| BusRegistrationScreen | 335 | ≤250 | split into `features/bus-registration/*` |
| TripHistoryScreen | 253 | ≤250 | migrate to hooks; trim |

## Industry-standard bar
Same as user-app: UI/data separation, one cache/fetch layer, typed contracts, test pyramid,
explicit error UX — **plus** a robust, battery-aware, offline-tolerant location broadcaster
(LOCATION_TRACKING.md) since that is the driver app's core job.
