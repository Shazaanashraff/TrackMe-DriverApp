# TODO 053 — Integration: routes

**Phase:** 5 · **Priority:** P3 · **Depends on:** 050, 015
**Cite:** docs/TEST_PLAN_INTEGRATION.md (Routes)

## Step-by-step
`src/__integration__/routes.int.test.tsx`: getRoutes (protected — auth header present),
**getRoutesManagementList (public — NO auth header)**, createRoute contract. Edge: invalid
route payload (400), 404, empty list → EmptyState. createRoute invalidates routes.

## Completion test
`todos/completion-tests/todo-053.sh` — `routes.int.test.tsx` exists referencing `management`+
`404`; `npx jest routes.int` green.

## Blocked
