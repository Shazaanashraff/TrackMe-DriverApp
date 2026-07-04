# TODO 014 — Bus hooks

**Phase:** 1 · **Priority:** P1 · **Depends on:** 010, 011, 012
**Cite:** docs/DATA_LAYER.md

## Step-by-step
1. `src/hooks/bus/`: `useMyBusQuery` (`qk.myBus`, staleTime 5min), `useRegisterBus`,
   `useUpdateBus` (mutations; `onSuccess` invalidate `qk.myBus()`). Token via `useAuth()`.
2. Tests: query returns data; registerBus/updateBus invalidate myBus (spy). `typecheck` +
   `test:unit`.

## Completion test
`todos/completion-tests/todo-014.sh` — bus hooks export useMyBusQuery/useRegisterBus/
useUpdateBus; invalidation references myBus; tests green; typecheck green.

## Blocked
