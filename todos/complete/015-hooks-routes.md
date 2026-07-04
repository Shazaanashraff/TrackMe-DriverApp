# TODO 015 — Routes hooks

**Phase:** 1 · **Priority:** P1 · **Depends on:** 010, 011, 012
**Cite:** docs/DATA_LAYER.md

## Step-by-step
1. `src/hooks/routes/`: `useRoutesQuery` (protected, `qk.routes`),
   `useRoutesManagementQuery` (**public**, `qk.routesManagement`), `useCreateRoute` (mutation;
   `onSuccess` invalidate routes). Token via `useAuth()` for protected ones.
2. Tests: queries return data; createRoute invalidates routes. `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-015.sh` — routes hooks export useRoutesQuery/
useRoutesManagementQuery/useCreateRoute; tests green; typecheck green.

## Blocked
