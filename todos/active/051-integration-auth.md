# TODO 051 — Integration: auth

**Phase:** 5 · **Priority:** P3 · **Depends on:** 050, 013
**Cite:** docs/TEST_PLAN_INTEGRATION.md (Auth)

## Step-by-step
`src/__integration__/auth.int.test.tsx`: login/register/refresh/logout contract (URL/method/
headers/body; no token in body). Edge: wrong password (401), **non-driver login rejected
client-side**, expired refresh → forced logout + clear cache, malformed JSON → parse. Assert
`AppError` kind/code preserved; `userMessage` shown (not raw body).

## Completion test
`todos/completion-tests/todo-051.sh` — `auth.int.test.tsx` exists referencing `401`+`driver`/
`role`+`refresh`; `npx jest auth.int` green.

## Blocked
