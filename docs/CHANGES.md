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

## 2026-08-23 — Fix main-branch CI red (#49): TripHistoryScreen provider gap + LoginScreen offline-disable test bug
- **Branch:** issue/49-triphistory-networkstatus-ci-fix
- **Modules touched:** none documented (test-only fix, no behavior change)
- **What changed:**
  - `TripHistoryScreen.test.js`'s `renderWithClient` never wrapped `NetworkStatusProvider`, so
    every test threw once `OfflineBanner` (wired in by the audit-remediation merge) called
    `useNetworkStatus()`. Mocked the context the same way `OfflineBanner.test.tsx` already does,
    rather than wrapping the real provider (the screen doesn't exercise network-state behavior).
  - `LoginScreen.test.tsx`'s two offline-disable tests asserted
    `getByTestId('primary-btn').props.disabled`, but `TouchableOpacity`/`Pressable` never forward
    a raw `disabled` prop to the host view — they fold it into `accessibilityState.disabled`
    instead (confirmed by reading `TouchableOpacity.js`, and by the file's own already-passing
    "loading state" test using the correct assertion). Fixed both to read
    `props.accessibilityState?.disabled`, matching the existing pattern. `LoginScreen.tsx` itself
    was already correct — no production code changed.
- **Why:** `main` CI was red (issue #49) — every PR based on `main` inherited these two failures
  regardless of its own changes.
- **Contract impact:** none.
- **Tests:** `TripHistoryScreen.test.js`, `LoginScreen.test.tsx` — both test-only fixes.
- **Docs updated:** n/a — no documented behavior changed.
- **Follow-ups / known issues:** This sandbox's local Jest run diverges from the GitHub Actions
  Node 20 runner in ways unrelated to this fix — a subset of `.tsx` suites (LoginScreen included)
  hit a Babel parse error only in this environment, and several suites using `Animated`-driven
  loading skeletons (`DriverProfileScreen`, `ConfirmSheet`, `DutyHero`, `GoButton`, etc. — none
  touched by this PR) hit an "Unable to locate attached view in the native tree" error locally
  that does not appear in the actual CI logs for this repo. Verified the fix is correct by (a)
  reading `TouchableOpacity`'s source directly, (b) confirming the exact reported
  `useNetworkStatus` error string no longer appears anywhere in a full local run, and (c)
  confirming the Skeleton-animation failure is pre-existing and environment-only by reproducing
  it on an untouched file (`DriverProfileScreen.test.js`). CI is the real gate for both files.

---

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
