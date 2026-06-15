# Driver App — Implementation Guide

> How to execute each TODO type and how to prove it's done. Mirrors user-app's guide; adds
> location/tracking specifics. The per-TODO `todos/active/NNN-slug.md` gives specifics.

## Golden rules
1. Behavior-preserving unless the TODO says otherwise (all UI splits).
2. Stay in scope; extras → `## Blocked` or a suggested new TODO.
3. No layering violations: screens never call `api.*`; location/socket logic lives in
   services/hooks, never in screens.
4. Tests ship with code (new/changed helper, hook, component → its test).
5. Green before done: `lint`, `typecheck`, `test`, the completion test (+ `test:e2e` for E2E).

## Verification commands
```bash
npm run lint
npm run typecheck
npm test
bash todos/completion-tests/todo-NNN.sh
npm run test:e2e   # E2E TODOs (or maestro --dry-run)
```

## Completion tests — what they are (NOT the feature tests)
A completion test proves the TODO's *work product* exists and is wired in (file exists, key
exports/cases present via grep, scoped run green). Distinct from the feature's own correctness
tests. Never weaken a feature test to pass a completion test. (Same definition + examples as
user-app/docs/IMPLEMENTATION_GUIDE.md.)

## Recipe per TODO type
- **A Foundation** (tsconfig/jest/eslint/aliases/maestro): add config + script + smallest real
  usage; completion = files/settings present + script green.
- **B Data layer** (transport/endpoints/hooks): build per DATA_LAYER.md; keep `api` stable;
  add hook test; completion = exports present + test green.
- **C Tracking/location** (services/socket, useTrackingSession, useLocationBroadcast,
  locationUtils): build per LOCATION_TRACKING.md; mock socket + expo-location; test acks,
  throttle, permission branches, offline buffer/replay, cleanup; completion = hook/service +
  required behaviors present (grep `throttle`/`buffer`/`startTracking`) + tests green.
- **D UI restructure** (split a screen): extract `features/<screen>/*`, replace api/socket
  calls with hooks, add 4 error states, screen ≤250 LOC; completion = feature files exist,
  no `api.`/`fetch(`/raw `watchPositionAsync` in screen, LOC ≤250, tests green.
- **E Error UX**: build/wire InlineError/ErrorState/OfflineBanner/ErrorBoundary + tracking/
  permission states; completion = components exist + screens import them + tests green.
- **F Unit tests**: cover the listed unit/cases; completion = file + case names + green.
- **G Integration**: mock-server harness; assert URL/method/headers/payload+size + edge cases
  (401/403/404/409/timeout/offline/malformed) + socket emit contracts; completion = harness +
  edge names + green.
- **H E2E (Maestro)**: author `.maestro/<flow>.yaml`; add `testID`s; completion = flow file +
  required steps + `--dry-run` parse.

## When blocked
Genuine unknown (backend payload shape, server `code`, background-tracking product decision,
ack contract) → write into `## Blocked`, no functional commit, no PR, report.

## PR conventions
Branch `todo/NNN-slug`; Conventional Commit `feat(todo-NNN): …`; PR `todo-NNN: <slug>`;
move `active/NNN`→`complete/NNN`; tick `todo-list.md`; do not self-merge.
