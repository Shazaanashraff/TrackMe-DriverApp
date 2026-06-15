# TODO 028 — Debug log hygiene

**Phase:** 2 · **Priority:** P2 · **Depends on:** 011, 017
**Cite:** docs/ERROR_HANDLING.md (logging hygiene)

## Step-by-step
1. `src/lib/logger.ts`: `log/warn/error` that no-op (or downgrade) when `!__DEV__`; `error`
   may report in prod without secrets.
2. Replace `console.log` in `AuthContext` + `services/socket.ts` (socket state lines, ids) with
   `logger.*`; **remove any token material** from logs.
3. Migrate other noisy `console.log` in src; keep genuine `logger.error`.
4. Tests: logger no-ops when `__DEV__` false (mock global). `typecheck` + `lint` + `test:unit`.

## Completion test
`todos/completion-tests/todo-028.sh` — `src/lib/logger.ts` exists with `__DEV__`; no
`console.log` referencing `token` remains in src; typecheck+lint+unit green.

## Blocked
