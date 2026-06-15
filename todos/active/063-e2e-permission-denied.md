# TODO 063 — E2E: location permission denied

**Phase:** 6 · **Priority:** P3 · **Depends on:** 006, 022
**Cite:** docs/TEST_PLAN_E2E.md (Tracking 7), docs/ERROR_HANDLING.md

## Step-by-step
1. `.maestro/tracking-permission-denied.yaml`: deny the location permission prompt → assert
   the `PermissionDeniedState` is shown + tracking control disabled + "Open Settings" visible.
2. Document permission-deny approach in Maestro (launch with permission denied / handle the
   OS dialog); mark manual-verify if not automatable.
3. `--dry-run` parses.

## Completion test
`todos/completion-tests/todo-063.sh` — flow file exists referencing permission/denied;
`--dry-run` parses.

## Blocked
