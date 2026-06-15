# TODO 064 — E2E: route management

**Phase:** 6 · **Priority:** P3 · **Depends on:** 006, 024
**Cite:** docs/TEST_PLAN_E2E.md (Route management)

## Step-by-step
1. `testID`s on route form + list.
2. `.maestro/route-management.yaml`: create route → assert it appears in the list.
3. `--dry-run` parses.

## Completion test
`todos/completion-tests/todo-064.sh` — flow file exists with create + list steps; `--dry-run`
parses.

## Blocked
