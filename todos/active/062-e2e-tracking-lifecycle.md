# TODO 062 — E2E: tracking lifecycle (core journey)

**Phase:** 6 · **Priority:** P3 · **Depends on:** 006, 022
**Cite:** docs/TEST_PLAN_E2E.md (Tracking), docs/LOCATION_TRACKING.md

## Step-by-step
1. `testID`s on the start/stop control + status badge.
2. `.maestro/tracking-lifecycle.yaml`: grant location → tap Start → status shows "tracking" →
   (seeded backend confirms location received) → tap Stop → status "idle".
3. Document how location is provided in the emulator (mock location / Maestro location set) in
   the flow header; mark manual-verify if not automatable in CI.
4. `--dry-run` parses.

## Completion test
`todos/completion-tests/todo-062.sh` — flow file exists referencing start/stop + tracking;
`--dry-run` parses (or documented manual-verify).

## Blocked
