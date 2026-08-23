# CHANGES — driver-app session log

Append-only running log of what each work session changed. **Newest entry on top.**
The pre-push check ([`scripts/check-docs.mjs`](../scripts/check-docs.mjs)) expects a new entry
when source under `src/` changed. One entry per session/PR is enough.

**Before you push, add an entry using this template:**

```md
## YYYY-MM-DD — <short title>
- **Branch:** <branch>
- **Modules touched:** <link docs/modules/*>
- **What changed:** <1–4 bullets, plain English>
- **Why:** <the reason / ticket / todo id>
- **Contract impact:** <none | which backend endpoint/socket payload, + which backend doc updated>
- **Tests:** <added/updated files, or "none — docs only">
- **Docs updated:** <docs/modules/*.md, TESTING_GUIDE row — or "n/a">
- **Follow-ups / known issues:** <or "none">
```

Feeds [`CHANGELOG.md`](../CHANGELOG.md) at release time — see [`guides/RELEASING.md`](guides/RELEASING.md).

---

## 2026-08-23 — Full-journey integration tests for core driver flows (#29)
- **Branch:** issue/29-core-journey-e2e-tests
- **Modules touched:** docs/modules/AUTH.md, docs/LOCATION_TRACKING.md, docs/modules/BOARDING.md,
  docs/modules/BUS_REGISTRATION.md
- **What changed:** Added four Jest + React Testing Library full-flow integration tests under
  `__integration__/`, each rendering real screens/navigation rather than calling functions in
  isolation: `login-rolegate-flow.int.test.tsx` (non-driver rejected, then a real driver signs in
  and reaches the dashboard), `shift-lifecycle.int.test.tsx` (login → go on duty → location
  stream → end duty), `offline-scan-roster.int.test.tsx` (scan while offline → queued → reconnect
  → replays → roster updates), `bus-registration-dashboard.int.test.tsx` (register a bus →
  Dashboard reflects it after navigating back).
- **Why:** todo 060/061/062, and issue #29's test-coverage gap — every core journey was only
  unit-tested in isolated pieces, with no test walking through any of them start to finish. The
  issue explicitly allows "Maestro or RTL full-flow, whichever fits" per journey; this repo's
  environment has no Maestro binary and CI (`.github/workflows/ci.yml`) doesn't run
  `test:e2e` at all, so RTL full-flow was the only verifiable option.
- **Contract impact:** none — test-only, no `src/` behavior changed.
- **Tests:** added the 4 files above; full suite verified green (`npm test`: 69 suites / 547
  tests passed).
- **Docs updated:** none needed beyond this entry — the 4 covered journeys' module docs already
  describe current behavior accurately.
- **Follow-ups / known issues:**
  - Issue #29's items 5 (route-recording end-to-end) and 6 (payout end-to-end) are **stale, not
    implemented**: both features were removed from the app before this session (commits
    `eba9229`/`e69eeac` removed custom-route recording; earnings/payout UI was removed
    2026-08-07 per this file's own CLAUDE.md note). No `RouteManagementScreen`/
    `CustomRouteRecorder`/`DriverEarningsScreen` exist in `src/`. Writing tests for either would
    mean fabricating UI that doesn't exist, so they were skipped rather than faked.
  - `docs/modules/ROUTE_MANAGEMENT.md` and `docs/modules/EARNINGS.md` (and this repo's top-level
    `CLAUDE.md` map, which still links both) are now stale/misleading — they describe shipped
    features that were since removed. Not fixed here (cross-cutting doc cleanup, out of scope for
    #29); worth its own follow-up issue.
  - Todos `060`/`061`/`062` are **not** moved to `todos/complete/` — their own completion criteria
    are Maestro `.yaml` flow files specifically, which this change does not add (Maestro itself
    remains unavailable in this environment). The underlying journeys they describe are now
    covered by the integration tests above, but the todos themselves stay open pending real
    Maestro infra. Todos `064`/`065` (route recording / earnings E2E) are now moot given the
    feature removals above, not just blocked — worth closing as won't-do in a follow-up rather
    than left implying pending work.
  - `todos/active/*.md` is the real path — issue #29 and the todo-file cross-references in it cite
    a nonexistent `docs/todos/active/*.md` prefix.
  - `npm run typecheck` has 4 pre-existing errors unrelated to this change (`ErrorBoundary.tsx`,
    `src/services/api/__tests__/api.test.ts`) — confirmed present on `main` before this branch;
    not introduced here, not fixed here (out of scope). CI does not run typecheck, only `npm test`.

## 2026-07-22 — Documentation system rolled out
- **Branch:** main
- **Modules touched:** docs only (no `src/` change)
- **What changed:** `CLAUDE.md` rewritten as a router; added `docs/modules/` (stubs naming their
  source files), `docs/guides/` (`_MODULE_TEMPLATE`, `ADDING_A_FEATURE`, `ADDING_A_TEST`,
  `RELEASING`), this `CHANGES.md`, `CHANGELOG.md`, a rewritten `docs/README.md` index, and
  `scripts/check-docs.mjs` + `.githooks/pre-push`.
- **Why:** match the user-app/backend docs system so a session lands on the right file fast.
- **Contract impact:** none — docs only.
- **Tests:** none — docs only.
- **Docs updated:** this is the docs work.
- **Follow-ups / known issues:** run `git config core.hooksPath .githooks` once per clone;
  module docs are stubs and must be filled in by the next change touching each area.
