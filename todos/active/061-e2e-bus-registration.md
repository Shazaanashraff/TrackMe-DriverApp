# TODO 061 — E2E: bus registration

**Phase:** 6 · **Priority:** P3 · **Depends on:** 006, 025
**Cite:** docs/TEST_PLAN_E2E.md (Bus registration)

## Step-by-step
1. `testID`s on registration form + route picker.
2. `.maestro/bus-registration.yaml`: fill form → select route → submit → assigned-bus details.
3. `.maestro/bus-registration-error.yaml`: duplicate plate / invalid route → error, no bus.
4. `--dry-run` parses.

## Completion test
`todos/completion-tests/todo-061.sh` — both flow files exist with register steps; `--dry-run`
parses.

## Blocked
