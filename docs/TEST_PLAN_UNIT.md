# Driver App Unit Test Plan

> Accurate to current code (verified 2026). **(new)** items appear after the restructure
> creates them. Runner: Jest + `@testing-library/react-native` (jest-expo). Co-locate in
> `__tests__/`.

## Coverage target
Helpers/lib 100% lines; hooks/services ≥90% branches; components render + key interaction.
Enforce via Jest `coverageThreshold` (foundation TODO).

## Helpers / lib
| Item | Test focus | Status |
|---|---|---|
| formatters.formatCurrency/Date/Time/DateTime | format + invalid inputs | exists ✓ |
| locationUtils.distance / throttle / isValidCoord | math, throttle window, bad coords | (new) |
| lib/errors.normalizeError | offline/timeout/http/parse + permission/tracking kinds | (new) |
| lib/errors.userMessage / isOfflineError | safe copy, no server-text leak | (new) |
| lib/queryKeys | stable keys | (new) |

## Services
| Item | Test focus | Status |
|---|---|---|
| api/transport.requestJson | URL/method/headers, timeout, size guard, single read, **preserves server `code`**, online/offline marks | refactor of api.js |
| api/authHeaders | Bearer header shape | (new) |
| backendStatus | monitor (interval+AppState), subscribe/unsubscribe, isBackendConnectionError, transition-only notify | exists in code, untested |
| socket | connectSocket auth, emitLocation guard+payload, startTracking ack Promise, stopTracking, onConnectionStateChange unsubscribe, disconnect cleanup | exists in code, untested |
| location (service) | permission request branches, watch start/stop, throttle, offline buffer | (new) |
| notificationService | setupSocketNotificationListeners wiring + cleanup | exists, untested |

> Endpoint fns' fetch wiring is covered by integration (contract); their hooks are unit-tested.

## Context & hooks
| Item | Test focus | Status |
|---|---|---|
| context/AuthContext | load/save, **driver role-gate on login**, logout clears + queryClient, authenticatedRequest 401→refresh→retry | exists, untested |
| hooks/auth/* (useLogin/useRegister/useLogout) | calls endpoint, role-gate, success/error | (new) |
| hooks/bus/* (useMyBusQuery/useRegisterBus/useUpdateBus) | query key, invalidation | (new) |
| hooks/routes/* (useRoutesQuery/useRoutesManagementQuery/useCreateRoute) | keys, invalidation | (new) |
| hooks/earnings/* (stats/history/dailyBreakdown/useRequestPayout) | pagination, payout invalidation | (new) |
| hooks/useTrackingSession | start ack success/failure, stop, cleanup on unmount | (new) |
| hooks/useLocationBroadcast | permission branches, throttle frequency, min-distance skip, offline buffer+replay, watcher removed on stop | (new) |

## UI components
| Item | Test focus | Status |
|---|---|---|
| ui/FormInput | render, error → InlineError | exists ✓ |
| ui/PrimaryButton | loading/disabled | exists ✓ |
| ui/ScreenHeader | title + back handler | exists ✓ (verify) |
| ui/InfoRow | label/value | exists ✓ (verify) |
| ui/SectionCard | render + title | exists ✓ (verify) |
| ui/LoadingScreen | renders | exists ✓ |
| ui/InlineError / ErrorState / OfflineBanner | states, Retry→refetch, offline toggle | (new) |
| ShiftBusIcon | render | no test yet |
| OfflineScreen | offline messaging | no test yet |
| ErrorBoundary | catches throwing child | (new) |
| features/dashboard/* | TrackingToggle, TrackingStatusCard, AssignedBusCard, LiveStatsBar | (new) |
| features/earnings/* | EarningsSummary, PayoutRequestForm, EarningsHistoryList, DailyBreakdownChart | (new) |
| features/route-management/* | RouteForm validation, RouteList | (new) |
| features/bus-registration/* | BusRegistrationForm validation, RoutePicker | (new) |

## Accuracy notes (corrections from prior version)
- config exports `API_URL`/`SOCKET_URL` (not `API_BASE_URL`).
- socket exports `emitLocation`/`startTracking`/`stopTracking` (not `startTrackingSession`).
- `parseResponse` currently drops server `code` — transport refactor must preserve it (tested).
