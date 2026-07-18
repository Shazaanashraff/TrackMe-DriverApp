# TODO 023 — Split DriverEarningsScreen

**Phase:** 2 · **Priority:** P2 · **Depends on:** 016, 020
**Cite:** docs/ARCHITECTURE.md, docs/DATA_LAYER.md

## Step-by-step
1. Extract into `src/features/earnings/`: `EarningsSummary` (stats cards),
   `EarningsHistoryList` (paginated list), `DailyBreakdownChart`, `PayoutRequestForm`.
2. Screen uses earnings hooks (todo 016) + `earnings`/`formatters` helpers (009); owns nav.
3. Four states (loading/empty/error/offline) on the list + breakdown.
4. Behavior-preserving (same tabs/sections, same payout flow). No `api.`/`fetch(` in screen.
   Screen ≤250 LOC.
5. Tests: history list renders + onPress; PayoutRequestForm validation; summary renders.
   `typecheck` + `lint` + `test:unit`.

## Completion test
`todos/completion-tests/todo-023.sh` — earnings feature files exist; screen imports an earnings
hook; no `api.`/`fetch(`; LOC ≤250; tests green; typecheck+lint green.

## Blocked
