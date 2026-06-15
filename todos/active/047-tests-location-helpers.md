# TODO 047 — Unit tests: location helpers + service

**Phase:** 4 · **Priority:** P3 · **Depends on:** 008
**Cite:** docs/TEST_PLAN_UNIT.md

## Step-by-step
1. `locationUtils`: distance known value + symmetry; invalid coords; throttle/shouldEmit
   min-distance + min-time (if not fully covered by todo 008, complete here).
2. If a `services/location.ts` wrapper exists (from 019), test permission-request branches +
   watch start/stop (mock expo-location).
3. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-047.sh` — locationUtils test (and location service test if present)
green via `npx jest locationUtils location`.

## Blocked
