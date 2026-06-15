# TODO 040 — Unit tests: api transport

**Phase:** 4 · **Priority:** P2 · **Depends on:** 011
**Cite:** docs/TEST_PLAN_UNIT.md, docs/DATA_LAYER.md (transport)

## Step-by-step
1. `src/services/api/__tests__/transport.test.ts` (mock `fetch`): success + markOnline;
   **timeout** (abort→`timeout`); **offline** (network→`offline`+markOffline); **http error**
   (non-2xx→`http` with status + **`code` preserved**); **size guard**; **single read**;
   **parse** (bad JSON→`parse`).
2. `src/services/api/__tests__/authHeaders.test.ts`: Bearer header shape.
3. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-040.sh` — transport test has `timeout`/`offline`/`size`/`code`
cases; authHeaders test exists; `npx jest src/services/api` green.

## Blocked
