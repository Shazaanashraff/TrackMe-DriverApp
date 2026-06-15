# Driver App Restructure Plan

> Planning doc; execution via `todos/` (Phases 0–2, 7). Targets in ARCHITECTURE.md (structure),
> DATA_LAYER.md (fetching), LOCATION_TRACKING.md (GPS), ERROR_HANDLING.md (UX).

## Decisions (locked, same as user-app)
- Data/caching: TanStack Query + AsyncStorage persister.
- E2E: Maestro (native flows), **not Playwright** (the old plan named Playwright; it can't
  test native location/socket — corrected in TEST_PLAN_E2E.md).
- Language: incremental TypeScript (`allowJs`, convert on touch, new files TS).
- TODO home: `driver-app/todos/`.

## Current state (verified 2026)
- 7+ screens call `api.*` via `authenticatedRequest` with hand-rolled loading/error; no
  caching/dedup/background refresh.
- `services/api.js` flat object; `parseResponse` **drops server `code`** (keeps only message +
  status). Auth-header boilerplate repeated ~12×.
- **Location broadcasting lives inside the 657-LOC DriverDashboard** (raw `watchPositionAsync`
  + `emitLocation`) with no batching, no offline buffer, no permission UX, no battery policy.
- `socket.js` tracks connection state but has **no token-refresh on `connect_error`** (rely on
  AuthContext, or add it).
- Oversized screens: Dashboard 657, Earnings 613, RouteManagement 490, BusRegistration 335,
  TripHistory 253.
- Plain JS; only a `test` script. **Missing**: `.env`, `.env.example`, `.gitignore`, `e2e/`.
- config exports `API_URL`/`SOCKET_URL` (CLAUDE.md wrongly says `API_BASE_URL`).

## Phase 0 — Foundation (P1)
TS config, Jest+coverage, ESLint+layering, aliases+`features/`, `lib/errors.ts` (+permission/
tracking kinds), Maestro, `.gitignore`+`.env.example`+CLAUDE.md drift fix, location/earnings
helpers.

## Phase 1 — Central data layer + tracking (P1)
1. Query provider + persister.
2. Transport refactor (timeout/size/single-read, **preserve server `code`**), `authHeaders`,
   split endpoints (auth/bus/routes/earnings), stable `api`.
3. `queryKeys`.
4. Hooks: auth (driver role-gated), bus, routes, earnings.
5. Typed `socket.ts`; `useTrackingSession`; `useLocationBroadcast` (the hero — extracts GPS
   logic out of the dashboard per LOCATION_TRACKING.md).

## Phase 2 — UI restructure + error UX (P2, behavior-preserving)
Error-UX + tracking/permission states; then split each big screen into `features/*`, migrate
to hooks, render 4 states, ≤250 LOC; migrate Login (driver role-gate) + small screens
(TripHistory, DriverProfile).

## Phase 7 — Optimisation + UX (P2/P3)
List virtualization; **location batching/battery**; **background tracking**; **offline GPS
buffer/replay**; skeletons; driver-glanceable dashboard UX; Hermes/bundle; haptics; a11y.
(See OPTIMISATION.md + UX_GUIDELINES.md.)

## Helper extraction
- `helpers/formatters.ts` stays (currency/date/time) — already tested.
- `helpers/locationUtils.ts` (new) — distance, throttle, coord validation (for the GPS pump).

## Guardrails
UI behavior unchanged across Phase 2; never bypass the data layer in screens; **no location/
socket logic in screens**; no cross-app imports; keep `api` surface stable until a screen
migrates.

## Exit criteria
`grep -r "api\.\|fetch(\|watchPositionAsync" src/screens src/features` → empty; all target
screens ≤250 LOC; data-layer + location + error DoD met; `lint`/`typecheck`/`test` green.
