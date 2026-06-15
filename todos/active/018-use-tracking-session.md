# TODO 018 — useTrackingSession (lifecycle)

**Phase:** 1 · **Priority:** P1 · **Depends on:** 017
**Cite:** docs/LOCATION_TRACKING.md (useTrackingSession)

## Goal
A hook that owns the tracking **session** lifecycle on top of the typed socket — the
unambiguous source of "are we tracking?".

## Step-by-step
1. `src/hooks/useTrackingSession.ts`:
   - State `status: 'idle' | 'starting' | 'tracking' | 'error'`, derived from connection state
     + acks; expose `error?: AppError` (kind `tracking`).
   - `start(busId)`: ensure socket connected → `startTracking(busId)`; ack success → `tracking`,
     failure → `error` with `AppError`.
   - `stop(busId)`: `stopTracking(busId)` → `idle`.
   - Subscribe `onConnectionStateChange`; if the socket drops while tracking, reflect a
     reconnecting/buffering status (coordinate with 019/073).
   - Cleanup on unmount/logout: stop cleanly.
2. Tests: start ack ok→tracking; ack fail→error; stop→idle; unmount stops; connection-drop
   reflected. Mock the socket service. `typecheck` + `test:unit`.

## Out of scope
GPS acquisition/emit (todo 019).

## Completion test
`todos/completion-tests/todo-018.sh` — `useTrackingSession.ts` exists referencing
`startTracking`/`stopTracking` + status states; a test covers ack ok/fail; typecheck green.

## Blocked
