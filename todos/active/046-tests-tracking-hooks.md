# TODO 046 — Unit tests: tracking hooks (hero)

**Phase:** 4 · **Priority:** P3 · **Depends on:** 018, 019
**Cite:** docs/LOCATION_TRACKING.md (Testing), docs/TEST_PLAN_UNIT.md

## Step-by-step
1. `useTrackingSession` (mock socket service): start ack ok→`tracking`; ack fail→`error`;
   stop→`idle`; unmount stops cleanly; connection drop reflected.
2. `useLocationBroadcast` (mock expo-location + socket): permission granted/denied branches;
   throttle limits emit frequency (fake timers); min-distance skip; offline → buffer queues,
   reconnect → replays in order; **stop removes the watcher** (no leak).
3. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-046.sh` — tests for useTrackingSession + useLocationBroadcast exist
referencing `ack`/`tracking` and `throttle`/`buffer`; `npx jest useTrackingSession
useLocationBroadcast` green.

## Blocked
