# TODO 052 — Integration: bus

**Phase:** 5 · **Priority:** P3 · **Depends on:** 050, 014
**Cite:** docs/TEST_PLAN_INTEGRATION.md (Bus)

## Step-by-step
`src/__integration__/bus.int.test.tsx`: getMyBus/registerBus/updateBus contract. Edge:
duplicate plate (409), invalid route id (400), update another driver's bus (403), no bus
assigned (empty → EmptyState if screen-level), oversized field (size guard). Mutations
invalidate `myBus`.

## Completion test
`todos/completion-tests/todo-052.sh` — `bus.int.test.tsx` exists referencing `409`+`403`+
`plate`; `npx jest bus.int` green.

## Blocked
