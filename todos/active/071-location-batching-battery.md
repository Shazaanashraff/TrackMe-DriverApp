# TODO 071 — Location batching + battery (the big one)

**Phase:** 7 · **Priority:** P2 · **Depends on:** 019
**Cite:** docs/OPTIMISATION.md (Location batching & battery), docs/LOCATION_TRACKING.md

## Goal
Make the GPS broadcaster battery-friendly without losing accuracy where it matters.

## Step-by-step
1. In `useLocationBroadcast` (019): `Accuracy.High` default + a high-accuracy toggle.
2. **Adaptive interval**: faster updates when moving, slower when stationary (compare last fix
   via `locationUtils.distance`); **skip emits below a min distance delta** (min-distance +
   min-time gate).
3. Batch fixes into one emit per N seconds if the backend accepts arrays (else send latest);
   document which the backend supports (Blocked if unknown).
4. Ensure the watcher stops instantly on `stop()` (no leak).
5. Tests: adaptive interval picks faster/slower per movement; min-distance skip; batch groups
   fixes (fake timers). `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-071.sh` — `useLocationBroadcast`/location service references
adaptive interval + min-distance (grep `Accuracy`/`minDistance`/`shouldEmit`); a test covers
skip + adaptive; tests green.

## Blocked
