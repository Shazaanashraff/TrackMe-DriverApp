# TODO 019 — useLocationBroadcast (the GPS pump)

**Phase:** 1 · **Priority:** P1 · **Depends on:** 008, 017, 018
**Cite:** docs/LOCATION_TRACKING.md (useLocationBroadcast — the hero), docs/ERROR_HANDLING.md

## Goal
Extract all GPS acquisition + emit logic **out of DriverDashboard** into a hook that runs only
while `useTrackingSession` is `tracking`. This is the core reliability win.

## Step-by-step
1. `src/hooks/useLocationBroadcast.ts`:
   - Request permissions first; expose `permission: 'granted'|'denied'|'undetermined'`.
   - `watchPositionAsync` with tuned accuracy; on each fix use `locationUtils` (todo 008) to
     **throttle / skip below min distance**, then `emitLocation({busId,routeId,lat,lng}, ack)`.
   - **Offline buffer**: when disconnected or emit fails, queue fixes (cap size, drop oldest);
     **replay in order on reconnect** (basic version here; richer buffer is todo 073).
   - Cleanup: remove the watcher on stop/unmount — never leak it.
   - Active only while session `tracking`; idle otherwise.
2. Keep `services/location.ts` thin if you extract the raw watch wrapper there.
3. Tests: permission branches; throttle limits emit frequency (fake timers); min-distance skip;
   offline → buffer queues, reconnect → replays; stop removes watcher. Mock expo-location +
   socket. `typecheck` + `test:unit`.

## Out of scope
Dashboard UI (todo 022); battery adaptive interval (071); background (072); full buffer (073).

## Completion test
`todos/completion-tests/todo-019.sh` — `useLocationBroadcast.ts` exists referencing
`watchPositionAsync` (or location service) + `emitLocation` + buffer/permission; a test covers
throttle + cleanup; typecheck green.

## Blocked
