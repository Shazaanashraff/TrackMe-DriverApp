# TODO 066 — E2E: trip history

**Phase:** 6 · **Priority:** P3 · **Depends on:** 006, 026
**Cite:** docs/TEST_PLAN_E2E.md (Trip history)

## Step-by-step
1. `.maestro/trip-history.yaml`: open trip history → list renders.
2. `.maestro/trip-history-empty.yaml`: no trips → EmptyState (seed an account with no history).
3. `--dry-run` parses.

## Completion test
`todos/completion-tests/todo-066.sh` — flow file(s) exist with history steps; `--dry-run` parses.

## Blocked
