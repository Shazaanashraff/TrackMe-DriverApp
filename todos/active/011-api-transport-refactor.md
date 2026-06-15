# TODO 011 — API transport refactor + split endpoints

**Phase:** 1 · **Priority:** P1 · **Depends on:** 001, 005
**Cite:** docs/DATA_LAYER.md (transport, endpoint fns)

## Goal
Replace the monolithic `services/api.js` transport with `services/api/transport.ts` (timeout,
size guard, single read, **`AppError` that preserves server `code`**), add `authHeaders`, split
endpoints into domain files, keep the `api` surface stable.

## Step-by-step
1. `src/services/api/transport.ts`: `requestJson<T>(url, options)` per DATA_LAYER.md —
   AbortController timeout (15s), single body read + 5MB size guard, `markBackendOnline()` on
   success, throw `normalizeError`/`AppError.fromHttp(status, body)` (todo 005) **carrying
   `code`/`message`/`fields`** (fixes today's loss).
2. `src/services/api/authHeaders.ts`: `authHeaders(token)`.
3. Split current methods into `auth.ts`, `bus.ts`, `routes.ts`, `earnings.ts` using
   `requestJson` + `authHeaders`. Preserve every URL/method/body exactly (see api.js). Note
   `getRoutesManagementList` is **public** (no auth header).
4. `src/services/api/index.ts` re-exports as default `api` with the same method names.
5. Make `services/api` import path keep working (re-export or update imports).
6. Smoke test: `api` exposes login/getMyBus/registerBus/getDriverEarningsStats/... as functions.
7. `typecheck` + `test:unit`.

## Out of scope
Hooks (012+), screen migration (Phase 2), full transport tests (040).

## Completion test
`todos/completion-tests/todo-011.sh` — transport.ts + authHeaders.ts + auth/bus/routes/earnings
+ index exist; `api` still exports core methods; transport references AbortController + code
preservation; typecheck+unit green.

## Blocked
