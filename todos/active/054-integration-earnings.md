# TODO 054 — Integration: earnings

**Phase:** 5 · **Priority:** P3 · **Depends on:** 050, 016
**Cite:** docs/TEST_PLAN_INTEGRATION.md (Earnings)

## Step-by-step
`src/__integration__/earnings.int.test.tsx`: stats/history(pagination)/dailyBreakdown/
requestPayout contract. Edge: empty history → EmptyState, already-pending payout (409),
insufficient earnings, invalid earningId (404). Payout invalidates `['earnings']`.

## Completion test
`todos/completion-tests/todo-054.sh` — `earnings.int.test.tsx` exists referencing `payout`+
`409`+`pagination`; `npx jest earnings.int` green.

## Blocked
