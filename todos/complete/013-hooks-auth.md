# TODO 013 — Auth hooks (driver role-gated)

**Phase:** 1 · **Priority:** P1 · **Depends on:** 010, 011, 012
**Cite:** docs/DATA_LAYER.md, docs/ERROR_HANDLING.md, AuthContext (role-gate)

## Step-by-step
1. `src/hooks/auth/`: `useLogin`, `useRegister`, `useLogout`.
   - `useLogin`: mutation calling `api.login`; **enforce driver role-gate** — if
     `user.role !== 'driver'`, reject with an `AppError` (kind `http`, friendly message) and
     do NOT save auth (mirror current LoginScreen behavior). On success call
     `AuthContext.login`.
   - `useLogout`: `api.logout` + `AuthContext.logout` + `queryClient.clear()`.
2. Errors as `AppError`; screens map via `userMessage`/fields (todo 021).
3. At least success + role-gate-reject + error tests for `useLogin`. `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-013.sh` — `src/hooks/auth/` exports useLogin/useRegister/useLogout;
useLogin references role-gate (grep `role`/`driver`); a hooks test runs green; typecheck green.

## Blocked
