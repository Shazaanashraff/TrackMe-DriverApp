# TODO 050 — Integration harness (fetch + socket mock)

**Phase:** 5 · **Priority:** P3 · **Depends on:** 002, 011
**Cite:** docs/TEST_PLAN_INTEGRATION.md (Harness)

## Goal
Reusable mocks so flow tests can assert full request/emit contracts and control
status/body/latency/failure/ack/disconnect.

## Step-by-step
1. `src/test/integration/`: `mockFetch({status,body,delay,fail})` + `lastRequest()` +
   `expectContract(req,{url,method,auth?,bodyShape})`; `mockSocket()` controlling
   ack/disconnect for `driver:location`/`start`/`stop`.
2. `renderWithProviders` (QueryClient + AuthProvider).
3. A smoke `*.int.test.ts` asserting contract assertions work (e.g. login).
4. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-050.sh` — `src/test/integration/` exports mockFetch +
expectContract/lastRequest + mockSocket; a smoke `*.int.test.*` green.

## Blocked
