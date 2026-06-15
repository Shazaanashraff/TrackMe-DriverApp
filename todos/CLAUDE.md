# driver-app/todos — Routine Rules

Read with `ROUTINE.md`. Non-negotiable guardrails for any todo run.

## Scope discipline
- One todo per run; implement only its *Step-by-step*. Extras → PR-body suggestion or
  `## Blocked`. Never redesign. Phase 2 UI todos are behavior-preserving.

## Architecture guardrails (../docs/ARCHITECTURE.md, ../docs/LOCATION_TRACKING.md)
- Screens/feature components never call `api.*`, `fetch(`, read tokens, or run
  `watchPositionAsync`/socket emits. They call hooks.
- Hooks call endpoint fns via the transport, or the typed socket/location services.
- Only `AuthContext` + the api transport touch tokens.
- Keep the `api` import surface stable until a screen migrates; delete dead code then.
- No cross-app imports. New files TypeScript; convert a JS file only when your todo edits it.

## Testing policy (../docs/IMPLEMENTATION_GUIDE.md + root CLAUDE.md)
- New/changed helper, hook, component ships with its unit test.
- Backend-contract change → integration test + a TESTING_GUIDE row.
- Two bars: **feature tests** (`npm test` green) and the **completion test**
  (`todos/completion-tests/todo-NNN.sh`). Never weaken a feature test to pass the completion test.

## Quality gates (every PR)
- `lint`, `typecheck`, `test` green; no skipped/`.only`.
- No token material logged; debug logs `__DEV__`-gated.
- Tracking status must stay unambiguous; never leak a location watcher.
- Conventional Commit; not self-merged.

## When unsure
- Genuine unknown (schema, ack contract, server code, background-tracking decision) →
  `## Blocked`, no functional commit, no PR, report. Don't guess.

## File map
- `ROUTINE.md` · `todo-list.md` · `active/NNN-slug.md` · `complete/NNN-slug.md` ·
  `completion-tests/todo-NNN.{sh,test.js}`.
