# Driver App TODO Backlog

Pick order: priority **P1 → P2 → P3**, then lowest number, among unchecked, not-in-flight,
not-blocked rows whose `Dep` are all `[x]`. Spec in `active/NNN-slug.md`. Tick `[x]` +
`done: DATE <sha>` on close-out.

## Phase 0 — Foundation (P1)
| ✓ | ID | Slug | Pri | Dep | One-line |
|---|----|------|-----|-----|----------|
| [x] | 001 | typescript-config | P1 | — | tsconfig (allowJs, strict) + typecheck | done: 2026-07-04 |
| [x] | 002 | jest-config-ts-coverage | P1 | 001 | Jest TS, test:unit, coverage thresholds, RTL setup | done: 2026-07-04 |
| [x] | 003 | eslint-config-layering | P1 | 001 | ESLint + lint; no api./fetch(/watchPositionAsync in screens | done: 2026-07-04 |
| [x] | 004 | path-aliases-and-folders | P1 | 001 | aliases + features/ + hooks/ + services/api skeleton | done: 2026-07-04 |
| [ ] | 005 | errors-lib | P1 | 001,002 | lib/errors.ts (+permission/tracking kinds) + tests |
| [ ] | 006 | maestro-setup | P1 | — | Maestro, .maestro/, test:e2e, smoke flow |
| [ ] | 007 | env-gitignore-doc-drift | P1 | — | add .gitignore + .env.example; fix CLAUDE.md (API_URL, socket names) |
| [ ] | 008 | helper-locationutils | P1 | 001,002 | helpers/locationUtils (distance/throttle/coord) + tests |
| [ ] | 009 | helper-earnings | P2 | 001,002 | earnings derive/format helpers + tests |

## Phase 1 — Data layer + tracking (P1)
| ✓ | ID | Slug | Pri | Dep | One-line |
|---|----|------|-----|-----|----------|
| [ ] | 010 | react-query-provider | P1 | 001,002,004 | TanStack Query provider + AsyncStorage persister |
| [ ] | 011 | api-transport-refactor | P1 | 001,005 | transport (timeout/size/single-read, **preserve code**), authHeaders, split endpoints |
| [ ] | 012 | query-keys-registry | P1 | 001 | lib/queryKeys.ts |
| [ ] | 013 | hooks-auth | P1 | 010,011,012 | useLogin (driver-gated), useRegister, useLogout |
| [ ] | 014 | hooks-bus | P1 | 010,011,012 | useMyBusQuery, useRegisterBus, useUpdateBus |
| [ ] | 015 | hooks-routes | P1 | 010,011,012 | useRoutesQuery, useRoutesManagementQuery, useCreateRoute |
| [ ] | 016 | hooks-earnings | P1 | 010,011,012 | stats/history/dailyBreakdown queries + useRequestPayout |
| [ ] | 017 | socket-service-typed | P1 | 005 | typed services/socket.ts (emitLocation/start/stop + state) |
| [ ] | 018 | use-tracking-session | P1 | 017 | useTrackingSession: start/stop lifecycle + acks |
| [ ] | 019 | use-location-broadcast | P1 | 008,017,018 | watch→throttle/batch→emit; permissions; offline buffer |

## Phase 2 — UI restructure + error UX (P2, behavior-preserving)
| ✓ | ID | Slug | Pri | Dep | One-line |
|---|----|------|-----|-----|----------|
| [ ] | 020 | error-ux-components | P2 | 002,005 | InlineError, ErrorState, OfflineBanner, ErrorBoundary, tracking/permission states |
| [ ] | 021 | migrate-login-screen | P2 | 013,020 | Login → useLogin + role-gate + inline errors |
| [ ] | 022 | split-driver-dashboard | P2 | 014,018,019,020 | features/dashboard/* + tracking hooks; ≤250 LOC; no GPS in screen |
| [ ] | 023 | split-driver-earnings | P2 | 016,020 | features/earnings/* ; ≤250 LOC |
| [ ] | 024 | split-route-management | P2 | 015,020 | features/route-management/* ; ≤250 LOC |
| [ ] | 025 | split-bus-registration | P2 | 014,015,020 | features/bus-registration/* ; ≤250 LOC |
| [ ] | 026 | migrate-trip-history | P2 | 016,020 | TripHistory → hooks + list + 4 states |
| [ ] | 027 | migrate-driver-profile | P2 | 014,020 | DriverProfile → hooks |
| [ ] | 028 | debug-log-hygiene | P2 | 011,017 | __DEV__-gate logs; no token material |

## Phase 4 — Unit tests (P2/P3)
| ✓ | ID | Slug | Pri | Dep | One-line |
|---|----|------|-----|-----|----------|
| [ ] | 040 | tests-transport | P2 | 011 | transport: timeout/size/single-read/code-preserved |
| [ ] | 041 | tests-backendstatus-socket | P2 | 017 | backendStatus + socket unit tests |
| [ ] | 042 | tests-authcontext | P2 | 002 | AuthContext load/save/logout/401/role-gate |
| [ ] | 043 | tests-hooks-auth | P3 | 013 | auth hooks + role-gate |
| [ ] | 044 | tests-hooks-bus-routes | P3 | 014,015 | bus + routes hooks |
| [ ] | 045 | tests-hooks-earnings | P3 | 016 | earnings hooks + payout invalidation |
| [ ] | 046 | tests-tracking-hooks | P3 | 018,019 | useTrackingSession + useLocationBroadcast |
| [ ] | 047 | tests-location-helpers | P3 | 008 | locationUtils + location service |
| [ ] | 048 | tests-ui-components | P3 | 002 | ScreenHeader, InfoRow, SectionCard, ShiftBusIcon, OfflineScreen |
| [ ] | 049 | tests-feature-components | P3 | 022,023,024,025 | feature/* render + interaction |

## Phase 5 — Integration / contract (P3)
| ✓ | ID | Slug | Pri | Dep | One-line |
|---|----|------|-----|-----|----------|
| [ ] | 050 | integration-harness | P3 | 002,011 | fetch + socket mock harness |
| [ ] | 051 | integration-auth | P3 | 050,013 | auth contract + role-gate + edge |
| [ ] | 052 | integration-bus | P3 | 050,014 | bus contract + edge (dup plate/403) |
| [ ] | 053 | integration-routes | P3 | 050,015 | routes contract (public vs protected) + edge |
| [ ] | 054 | integration-earnings | P3 | 050,016 | earnings contract + payout 409 |
| [ ] | 055 | integration-tracking-socket | P3 | 050,018,019 | driver:location/start/stop payloads, ack, reconnect replay |
| [ ] | 056 | integration-cross-cutting | P3 | 050,011 | refresh-retry, offline, payload/size |

## Phase 6 — E2E (Maestro) (P3)
| ✓ | ID | Slug | Pri | Dep | One-line |
|---|----|------|-----|-----|----------|
| [ ] | 060 | e2e-login-rolegate | P3 | 006,021 | driver login + non-driver rejected + logout |
| [ ] | 061 | e2e-bus-registration | P3 | 006,025 | register bus → details; dup/invalid error |
| [ ] | 062 | e2e-tracking-lifecycle | P3 | 006,022 | start → broadcast → stop (core) |
| [ ] | 063 | e2e-permission-denied | P3 | 006,022 | deny location → permission state, tracking disabled |
| [ ] | 064 | e2e-route-management | P3 | 006,024 | create route → list |
| [ ] | 065 | e2e-earnings-payout | P3 | 006,023 | view stats/history; request payout |
| [ ] | 066 | e2e-trip-history | P3 | 006,026 | open history; empty → EmptyState |
| [ ] | 067 | e2e-offline-reconnect-tracking | P3 | 006,019,020 | offline buffering → reconnect replay |

## Phase 7 — Optimisation + UX (P2/P3)
| ✓ | ID | Slug | Pri | Dep | One-line |
|---|----|------|-----|-----|----------|
| [ ] | 070 | list-virtualization | P2 | 023,026 | FlatList getItemLayout/memo on earnings + trip history |
| [ ] | 071 | location-batching-battery | P2 | 019 | adaptive interval + min-distance skip + batch emits |
| [ ] | 072 | background-tracking | P3 | 019 | background location (TaskManager + foreground service) + keep-awake |
| [ ] | 073 | offline-location-buffer | P2 | 019 | ring buffer + replay on reconnect + indicator |
| [ ] | 074 | skeleton-loaders | P3 | 020 | skeletons on earnings/history/dashboard |
| [ ] | 075 | dashboard-driver-ux | P2 | 022 | big start/stop, glanceable status, keep-awake, confirm-stop |
| [ ] | 076 | hermes-bundle-startup | P3 | 010 | verify Hermes, lazy-load earnings charts, defer work |
| [ ] | 077 | haptics-microinteractions | P3 | 021 | expo-haptics on start/stop/payout/error |
| [ ] | 078 | accessibility-pass | P2 | 022,023,025 | a11y labels/roles (esp. tracking control), 44px, contrast |

> ~57 todos across Phases 0–7. Phases 0–1 are the critical path. Cite docs/LOCATION_TRACKING.md
> for all tracking/location todos and docs/OPTIMISATION.md + UX_GUIDELINES.md for Phase 7.
