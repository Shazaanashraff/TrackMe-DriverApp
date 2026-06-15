# TODO 072 — Background tracking

**Phase:** 7 · **Priority:** P3 · **Depends on:** 019
**Cite:** docs/OPTIMISATION.md (Background), docs/LOCATION_TRACKING.md (Background)

## Goal
Allow location to keep broadcasting when the app is backgrounded (product decision required).

## Step-by-step
1. **Decide policy** (foreground-only vs background). If foreground-only, implement
   `expo-keep-awake` on the dashboard while tracking and document the decision — done.
2. If background required: `expo-location` `startLocationUpdatesAsync` + TaskManager task; on
   Android a foreground-service notification; iOS `UIBackgroundModes: location`. The task emits
   via socket or buffers to storage for replay.
3. Add permission UX for "Always" location; document store-compliance notes.
4. Tests: TaskManager task registered + emits/buffers (mock); keep-awake toggles with tracking.
5. `typecheck` + `test:unit`.

## Blocked
- If the product decision (background yes/no) or store-compliance constraints are unknown,
  STOP and record here.

## Completion test
`todos/completion-tests/todo-072.sh` — either keep-awake wired (grep `keepAwake`/`activateKeepAwake`)
for foreground-only, OR TaskManager background task present (grep `startLocationUpdatesAsync`/
`TaskManager`); a test exists; typecheck green.

## Blocked
