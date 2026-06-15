# TODO 076 — Hermes + bundle + startup

**Phase:** 7 · **Priority:** P3 · **Depends on:** 010
**Cite:** docs/OPTIMISATION.md (Bundle & startup)

## Step-by-step
1. Verify Hermes enabled (SDK 54 default); document how to confirm.
2. Lazy-load heavy screens (DriverEarnings charts) via navigation.
3. Defer post-navigation work with `InteractionManager.runAfterInteractions`.
4. Keep UberMove font load lean at splash; audit deps on the critical path.
5. Document bundle audit (before/after) in `docs/perf-notes.md`.
6. `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-076.sh` — a heavy screen is lazy-loaded (grep `lazy`/dynamic
import in navigator); `docs/perf-notes.md` exists; typecheck green.

## Blocked
