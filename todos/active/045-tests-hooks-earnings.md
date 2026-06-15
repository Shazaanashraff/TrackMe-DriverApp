# TODO 045 — Unit tests: earnings hooks

**Phase:** 4 · **Priority:** P3 · **Depends on:** 016
**Cite:** docs/TEST_PLAN_UNIT.md, docs/DATA_LAYER.md (invalidation)

## Step-by-step
1. stats/dailyBreakdown data; history pagination + keepPreviousData; useRequestPayout
   invalidates `['earnings']` (spy); error path.
2. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-045.sh` — earnings hook tests exist referencing `invalidateQueries`;
`npx jest src/hooks/earnings` green.

## Blocked
