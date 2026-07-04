# TODO 012 — Query key registry

**Phase:** 1 · **Priority:** P1 · **Depends on:** 001
**Cite:** docs/DATA_LAYER.md (Query keys)

## Step-by-step
1. `src/lib/queryKeys.ts` exporting `qk` (myBus, routes, routesManagement, earningsStats,
   earningsHistory(page), dailyBreakdown) as `as const` tuples.
2. `src/lib/__tests__/queryKeys.test.ts` — stable + distinct keys.
3. `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-012.sh` — queryKeys.ts exports `qk` with myBus/earningsHistory/
dailyBreakdown; test green; typecheck green.

## Blocked
