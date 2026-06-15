# TODO 026 — Migrate TripHistoryScreen

**Phase:** 2 · **Priority:** P2 · **Depends on:** 016, 020
**Cite:** docs/DATA_LAYER.md, docs/ERROR_HANDLING.md

## Step-by-step
1. Replace direct `api.getDriverEarningsHistory`/`authenticatedRequest` with the earnings
   history hook (todo 016) + `formatters`/`earnings` helpers.
2. Render four states (loading/empty `EmptyState`/error `ErrorState`+Retry/offline banner);
   pull-to-refresh → `refetch`.
3. Behavior-preserving. No `api.`/`fetch(` left. Screen ≤250 LOC (already 253 — trim).
4. Tests: list renders (success), EmptyState (empty), ErrorState (error). `typecheck` +
   `lint` + `test:unit`.

## Completion test
`todos/completion-tests/todo-026.sh` — TripHistoryScreen imports an earnings hook + ErrorState;
no `api.`/`fetch(`; LOC ≤250; test green; typecheck+lint green.

## Blocked
