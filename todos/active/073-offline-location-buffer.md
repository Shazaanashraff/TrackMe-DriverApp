# TODO 073 — Offline GPS buffer + replay

**Phase:** 7 · **Priority:** P2 · **Depends on:** 019
**Cite:** docs/OPTIMISATION.md (Offline buffer), docs/LOCATION_TRACKING.md

## Goal
Never lose location data across network blips; replay in order on reconnect.

## Step-by-step
1. Promote the basic buffer from 019 to a robust ring buffer (e.g. last 500 fixes) in memory +
   optional AsyncStorage spill; cap size, drop oldest.
2. On reconnect, **replay in timestamp order** (backend dedupes); throttle replay so it doesn't
   flood.
3. Surface a "buffering offline — N queued" indicator (used by TrackingStatusCard).
4. Tests: buffer caps + drops oldest; replay order preserved; indicator count correct (fake
   timers, mock socket). `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-073.sh` — buffer module/logic references ring/cap + replay order;
a test covers cap + replay order; tests green.

## Blocked
