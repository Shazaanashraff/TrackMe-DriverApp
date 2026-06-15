# TODO 060 — E2E: driver login + role-gate + logout

**Phase:** 6 · **Priority:** P3 · **Depends on:** 006, 021
**Cite:** docs/TEST_PLAN_E2E.md (Auth)

## Step-by-step
1. `testID`s on login fields/button.
2. `.maestro/auth-login.yaml`: valid driver creds → dashboard.
3. `.maestro/auth-non-driver.yaml`: passenger creds → role-gate error shown, stays on login.
4. `.maestro/auth-logout.yaml`: logout → back to login.
5. `--dry-run` parses (or manual-verify documented).

## Completion test
`todos/completion-tests/todo-060.sh` — the 3 flow files exist with login + error + logout steps;
`--dry-run` parses.

## Blocked
