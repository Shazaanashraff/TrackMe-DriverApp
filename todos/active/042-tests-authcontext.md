# TODO 042 — Unit tests: AuthContext

**Phase:** 4 · **Priority:** P2 · **Depends on:** 002
**Cite:** docs/TEST_PLAN_UNIT.md (Context & hooks)

## Step-by-step
1. `src/context/__tests__/AuthContext.test.tsx` (mock AsyncStorage + api): load stored auth;
   saveAuth/login persists; **driver role-gate** (non-driver login path); logout clears storage
   + state (+ queryClient.clear if wired); `authenticatedRequest` 401→refresh→retry once,
   refresh-fail→logout.
2. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-042.sh` — test file refs `authenticatedRequest`+`refresh`+`role`/
`driver`; `npx jest AuthContext` green.

## Blocked
