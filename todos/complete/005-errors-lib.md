# TODO 005 — Error taxonomy lib

**Phase:** 0 · **Priority:** P1 · **Depends on:** 001, 002
**Cite:** docs/ERROR_HANDLING.md (taxonomy)

## Goal
`src/lib/errors.ts` — single error type, **including driver-specific `permission` and
`tracking` kinds** — with full tests.

## Step-by-step
1. `src/lib/errors.ts`:
   - `AppErrorKind = 'offline'|'timeout'|'http'|'parse'|'unknown'|'permission'|'tracking'`.
   - `class AppError extends Error` { kind, status?, code?, details? }.
   - `AppError.fromHttp(status, body)` — **copies `code`/`message`/`fields` from body** (fixes
     the current `parseResponse` that drops `code`).
   - `normalizeError(err)` — AbortError→timeout; network→offline; AppError passthrough; bad
     JSON→parse; else unknown.
   - `isOfflineError`, `userMessage` (safe copy per kind/code incl. permission/tracking; never
     leak raw 5xx body).
2. `src/lib/__tests__/errors.test.ts` — every kind incl. permission/tracking; userMessage no-leak.
3. `npm run typecheck` + `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-005.sh` — errors.ts exports AppError/normalizeError/isOfflineError/
userMessage and references `permission`+`tracking`; test names include those; jest green.

## Blocked
