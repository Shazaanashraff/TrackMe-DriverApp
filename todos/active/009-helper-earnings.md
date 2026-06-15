# TODO 009 — earnings helpers

**Phase:** 0 · **Priority:** P2 · **Depends on:** 001, 002
**Cite:** docs/TEST_PLAN_UNIT.md, docs/RESTRUCTURE_PLAN.md (helper extraction)

## Goal
Extract any earnings shaping/derivation out of DriverEarningsScreen into a pure helper so the
split (023) stays thin. Keep `formatters.ts` as-is (currency/date).

## Step-by-step
1. Inspect `src/screens/DriverEarningsScreen.js` for derived values (totals, daily grouping,
   available-balance, payout eligibility).
2. `src/helpers/earnings.ts` with pure fns, e.g. `sumEarnings(list)`,
   `groupByDay(list)`, `availableBalance(stats)`, `canRequestPayout(earning)`. Use
   `formatters.formatCurrency` for display only (keep math separate from formatting).
3. `src/helpers/__tests__/earnings.test.ts` — totals, empty list, grouping, payout eligibility
   edges.
4. `npm run typecheck` + `npm run test:unit`.

## Out of scope
Editing the screen (todo 023 consumes these).

## Completion test
`todos/completion-tests/todo-009.sh` — earnings.ts + test exist; test names include `empty`/
`payout`; jest green; typecheck green.

## Blocked
