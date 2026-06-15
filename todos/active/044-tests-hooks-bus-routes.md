# TODO 044 — Unit tests: bus + routes hooks

**Phase:** 4 · **Priority:** P3 · **Depends on:** 014, 015
**Cite:** docs/TEST_PLAN_UNIT.md

## Step-by-step
1. bus: useMyBusQuery data + enabled; registerBus/updateBus invalidate myBus (spy).
2. routes: useRoutesQuery + useRoutesManagementQuery (public, no auth header) data; createRoute
   invalidates routes.
3. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-044.sh` — bus + routes hook tests exist; `npx jest src/hooks/bus
src/hooks/routes` green.

## Blocked
