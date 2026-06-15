# TODO 016 — Earnings hooks

**Phase:** 1 · **Priority:** P1 · **Depends on:** 010, 011, 012
**Cite:** docs/DATA_LAYER.md (caching + invalidation)

## Step-by-step
1. `src/hooks/earnings/`: `useEarningsStatsQuery`, `useEarningsHistoryQuery(page)`
   (`keepPreviousData`), `useDailyBreakdownQuery`, `useRequestPayout` (mutation; `onSuccess`
   invalidate `['earnings']`). Token via `useAuth()`.
2. Tests: history pagination; payout invalidates earnings (spy). `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-016.sh` — earnings hooks export the 4 hooks; payout invalidation
references `['earnings']`; tests green; typecheck green.

## Blocked
