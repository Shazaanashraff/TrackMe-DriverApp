# Driver App Testing Guide (Traceability)

> Maps each unit/flow to test type, file, cases, and update trigger. Paths reflect the target
> structure. Rows added as the creating TODO lands. "exists ✓" = already in repo.
> Types: **unit** (Jest+RTL), **int** (contract, mocked network/socket), **e2e** (Maestro).

## Auth
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| api/auth.login + useLogin | int+unit | __integration__/auth.int.test.tsx + hooks/auth/__tests__ | URL/method/body, **driver role-gate**, 401 | login/role changes |
| auth.register/refresh/logout | int | __integration__/auth.int.test.tsx | body, expired refresh→logout | auth flow changes |
| AuthContext | unit | context/__tests__/AuthContext.test.tsx | load/save/logout/401-refresh/role-gate | auth logic changes |
| Login + role-gate + logout | e2e | .maestro/auth-*.yaml | driver in, non-driver rejected, logout | auth UI changes |

## Bus & Routes
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| useMyBusQuery / registerBus / updateBus | unit+int | hooks/bus/__tests__ + __integration__/bus.int.test.tsx | keys, duplicate plate, 403 other bus | bus schema changes |
| routes (get/management/create) | unit+int | hooks/routes/__tests__ + __integration__/routes.int.test.tsx | public vs protected, create payload | route schema changes |
| Register bus / create route | e2e | .maestro/bus-registration.yaml, route-management.yaml | register→details, create→list | UI changes |

## Tracking (hero)
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| services/socket | unit | services/__tests__/socket.test.ts | emitLocation payload, startTracking ack, stop, cleanup | socket contract changes |
| useTrackingSession | unit | hooks/__tests__/useTrackingSession.test.ts | start ack ok/fail, stop, cleanup | session logic changes |
| useLocationBroadcast | unit | hooks/__tests__/useLocationBroadcast.test.ts | permission, throttle, min-distance, offline buffer/replay, stop removes watcher | GPS logic changes |
| location service / locationUtils | unit | services/__tests__/location.test.ts, helpers/__tests__/locationUtils.test.ts | permission branches, distance/throttle | location logic changes |
| tracking socket contract | int | __integration__/tracking.int.test.tsx | start/location/stop payloads, ack, reconnect replay | contract changes |
| Start→broadcast→stop, permission, offline | e2e | .maestro/tracking-*.yaml | core lifecycle + permission + offline | tracking UI changes |

## Earnings
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| earnings hooks (stats/history/daily/payout) | unit+int | hooks/earnings/__tests__ + __integration__/earnings.int.test.tsx | pagination, payout 409, invalidation | earnings schema changes |
| Earnings view / payout | e2e | .maestro/earnings.yaml | stats+history, request payout | earnings UI changes |

## Cross-cutting
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| api transport | unit | services/api/__tests__/transport.test.ts | timeout, size, single read, **code preserved** | transport changes |
| lib/errors | unit | lib/__tests__/errors.test.ts | kinds incl permission/tracking, no leak | taxonomy changes |
| ErrorState/InlineError/OfflineBanner | unit | components/ui/__tests__ | states, Retry, offline | error UX changes |
| backendStatus | unit | services/__tests__/backendStatus.test.ts | monitor, subscribe, patterns | health logic changes |
| Offline cold start | e2e | .maestro/offline-*.yaml | cached + banner | offline behavior changes |

## Custom Route Recording (school/work shuttles)
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| helpers/geo.js (haversine/distance/elapsed) | unit | src/helpers/__tests__/geo.test.js | distance calc, degenerate input, elapsed formatting | geo math changes |
| CustomRouteRecorder | unit (Jest+RTL) | src/components/__tests__/CustomRouteRecorder.test.js | coach-mark first-run gating, Track/Add Stop/Complete state machine, breadcrumb accumulation + AsyncStorage persistence, crash/background recovery (resume/submit/discard), add-stop guards (no fix yet, too-close dedupe), record POST payload shape, **update mode** (Phase 2): update-specific copy, no onboarding tour, submits via recordRouteUpdate with routeId, mode-specific AsyncStorage buffer key | recording flow, coach-marks, update mode, or AsyncStorage buffer shape changes |
| DriverDashboard — Update Route banner (Phase 2) | unit (Jest+RTL) | src/screens/__tests__/DriverDashboard.test.js | banner hidden for normal/no-flag routes, shown when an ACTIVE custom route has a pending change request, tapping it opens CustomRouteRecorder in update mode with the right routeId | off-route flag banner or Update Route entry point changes |

## Existing tests (keep green)
- helpers/__tests__/formatters.test.js ✓
- helpers/__tests__/geo.test.js ✓
- components/ui/__tests__/components.test.js ✓
- components/__tests__/CustomRouteRecorder.test.js ✓
- screens/__tests__/DriverDashboard.test.js ✓
- components/__tests__/CustomRouteRecorder.test.js ✓
