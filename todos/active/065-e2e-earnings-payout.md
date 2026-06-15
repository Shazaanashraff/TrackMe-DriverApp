# TODO 065 — E2E: earnings + payout

**Phase:** 6 · **Priority:** P3 · **Depends on:** 006, 023
**Cite:** docs/TEST_PLAN_E2E.md (Earnings)

## Step-by-step
1. `testID`s on earnings tabs + payout button.
2. `.maestro/earnings.yaml`: view stats + history (scroll/paginate).
3. `.maestro/earnings-payout.yaml`: request payout → pending state; already-pending → blocked
   with message.
4. `--dry-run` parses.

## Completion test
`todos/completion-tests/todo-065.sh` — both flow files exist with earnings/payout steps;
`--dry-run` parses.

## Blocked
