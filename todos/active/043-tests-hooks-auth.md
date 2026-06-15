# TODO 043 — Unit tests: auth hooks

**Phase:** 4 · **Priority:** P3 · **Depends on:** 013
**Cite:** docs/TEST_PLAN_UNIT.md

## Step-by-step
1. `renderHook` with QueryClient + AuthProvider wrapper (shared util in `src/test/`).
2. useLogin success saves auth; **non-driver rejected (role-gate) without saving**; error
   surfaces AppError. useRegister + useLogout (clears cache).
3. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-043.sh` — auth hook tests exist referencing `role`/`driver` +
`error`; `npx jest src/hooks/auth` green.

## Blocked
