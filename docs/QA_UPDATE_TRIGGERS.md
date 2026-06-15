# Driver App QA Update Triggers

Keep tests + `docs/TESTING_GUIDE.md` in sync with code changes.

## Update tests + TESTING_GUIDE when:
- Any endpoint fn (`services/api/*`) URL, method, headers, or body changes.
- Any hook query key, cache policy, or invalidation changes.
- `AuthContext` flow changes (login, **driver role-gate**, refresh, logout).
- Socket tracking events/payloads change (`driver:location`, `driver:start-tracking`,
  `driver:stop-tracking`) or the location service / `useLocationBroadcast` / `useTrackingSession`
  behavior changes.
- Screen/flow steps change for tracking, bus registration, route management, or earnings.
- Helper/lib behavior changes (formatters, locationUtils, errors, queryKeys).
- Error-handling or permission UX changes (InlineError, ErrorState, OfflineBanner, tracking
  status, permission state).
- Environment variable names change (`EXPO_PUBLIC_*`).
- Caching/offline or location-batching policy changes.

## Required actions
- Update the matching row(s) in `docs/TESTING_GUIDE.md`.
- Update unit + integration + E2E tests covering the change.
- Keep `lint`/`typecheck`/`test` green; run affected Maestro flow (or `--dry-run`).
- Update ARCHITECTURE/DATA_LAYER/LOCATION_TRACKING/ERROR_HANDLING if an assumption changed.
