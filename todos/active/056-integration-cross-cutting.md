# TODO 056 — Integration: cross-cutting

**Phase:** 5 · **Priority:** P3 · **Depends on:** 050, 011
**Cite:** docs/TEST_PLAN_INTEGRATION.md (Cross-cutting)

## Step-by-step
`src/__integration__/cross-cutting.int.test.tsx`:
- 401 on a protected call → exactly one refresh + one retry; refresh fail → logout + clear.
- Offline (network error): query returns cached + offline state; mutation pauses + resumes on
  reconnect.
- Timeout aborts at the limit → `timeout` AppError.
- Payload: no protected endpoint puts the token in the body; JSON endpoints send Content-Type;
  **server `code` preserved** end-to-end.
- Size: oversized response guarded.
- UI smoke: a failed load renders `ErrorState` + working Retry; offline → `OfflineBanner`.

## Completion test
`todos/completion-tests/todo-056.sh` — test exists referencing `refresh`+`offline`+`timeout`+
`ErrorState`; `npx jest cross-cutting.int` green.

## Blocked
