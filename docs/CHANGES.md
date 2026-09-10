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

## 2026-09-10 — The Messages tab becomes a Riders directory
- **Branch:** feature/rider-directory-tab
- **Modules touched:** [docs/modules/COMMUNICATIONS.md](modules/COMMUNICATIONS.md)
- **What changed:**
  - Removed private rider-driver messaging: `MessagesScreen`, `ConversationScreen`,
    `ConversationContent`, `MessageBubble`, `UnreadBadge`, `mergeMessages`, the
    `Conversation`/`RiderAudience`/`Absences` stack routes, and the provider's
    deep-link-to-conversation poller. The in-app banner is now dismiss-only.
  - The freed tab is **Riders**: a segmented screen over a rider directory and the
    existing driver absence review. Only the visible segment mounts, since each polls
    every 30 s while focused. The Home panel's two absence actions now deep-link into
    the Absences segment — they pointed at a stack route that no longer exists.
  - The directory is a row per rider (picture, name, then grade · organization · pickup)
    opening a rider profile: name, grade, rider code, one contact number. No address.
  - Pictures come from the new per-rider avatar endpoint and are cached in AsyncStorage
    against `avatarVersion` (`riderAvatarCache.js`, ported from user-app). A rider with
    no picture causes no request and shows their initial.
- **Why:** the inbox had nothing to receive — user-app dropped its conversation screens,
  so riders have had no send path. The two things a driver actually uses were buried in
  chips on the Home panel.
- **Contract impact:** consumes the additive backend change of the same date —
  `GET /api/driver/riders` gains `category`/`grade`/`hasAvatar`, plus new
  `GET /api/driver/riders/:riderId` and `.../avatar`. Backend doc:
  `backend/docs/modules/COMMUNICATIONS.md`.
- **Tests:** new `features/communications/__tests__/riders.test.js` (20 cases: segment
  defaulting and single-mount polling, row subtitle and tap-through, search, 404 copy,
  no address, avatar cache per version incl. no-request and eviction, `gradeLine` table).
  `broadcast.test.js` lost its `mergeMessages` case. Full suite **604/604 passing, 70
  suites**, up from 584; lint 0 errors.
- **Docs updated:** `docs/modules/COMMUNICATIONS.md`, `docs/TESTING_GUIDE.md` row,
  `CLAUDE.md` navigation map.
- **Follow-ups / known issues:** **not yet exercised in a browser** — the automated
  checks pass and the web bundle compiles with 0 console errors on load, but no one has
  clicked through the tab against real data yet. Also: a notification tap no longer
  navigates anywhere now that the conversation deep link is gone.

---

## 2026-09-10 — Rider–driver communications, merged into `main`
- **Branch:** feature/comms-preset-trim (merged)
- **Modules touched:** [docs/modules/COMMUNICATIONS.md](modules/COMMUNICATIONS.md)
- **What changed:** the four communications sessions below, previously unmerged, land together:
  - **2026-09-08** — added the fixed two-action quick-broadcast panel, private messages, dated
    absence review and acknowledgment, announcements, cached/offline drafts, app-shell socket
    ownership, and native push registration. QR boarding stayed independent and surfaces a
    planned-absence discrepancy after a valid scan.
  - **2026-09-09** — bounded the Home broadcast panel in its own scroll region, and added
    truthful loading/offline/error/empty states, safe-area protection, and long-name wrapping.
  - **2026-09-10** — the quick-action grid now renders the two presets the backend serves
    instead of six, and the open-ended delay preview dropped "Traffic is causing…" to match the
    backend's canonical wording word for word.
  - **2026-09-10** — removed the "More updates" action and the whole `AnnouncementsScreen`
    behind it (its only entry point), dropping the custom composer, open-ended delay,
    service-unavailability notice, and earlier-announcements history. Backend announcement
    endpoints were left untouched.
- **Why:** the communications module had never reached `main`; merging it before starting the
  Riders-tab work avoids stacking further changes on an unmerged branch.
- **Contract impact:** none new — consumes existing `/api/conversations/*`, `/api/driver/*` and
  `/api/absences/*` endpoints.
- **Tests:** `src/features/communications/__tests__/broadcast.test.js`.
- **Docs updated:** `docs/modules/COMMUNICATIONS.md`, `docs/README.md`, `CLAUDE.md`.
- **Follow-ups / known issues:** private messaging is slated for removal — the passenger app has
  already dropped its Messages tab, so riders have no send path. The Messages tab becomes a
  Riders directory next.

---

## 2026-08-30 — Fix main CI: two `__integration__` suites missing `NetworkStatusContext`
- **Branch:** issue/51-fix-network-status-context-integration-tests
- **Modules touched:** [docs/modules/BUS_REGISTRATION.md](modules/BUS_REGISTRATION.md),
  [docs/modules/BOARDING.md](modules/BOARDING.md)
- **What changed:**
  - `__integration__/bus-registration-dashboard.int.test.tsx` now mocks `NetworkStatusContext`
    to a static online value (this journey doesn't exercise offline behavior), the same pattern
    `VehicleRegistrationScreen.test.js` and `shift-lifecycle.int.test.tsx` already use.
  - `__integration__/offline-scan-roster.int.test.tsx` now wraps its render tree in the real
    `NetworkStatusProvider` instead — this suite deliberately exercises the real
    `services/backendStatus` module (its own `markBackendHealthy()` reconnect signal), so a
    static mock would have defeated the point of the test.
- **Why:** Closes #51. The offline-audit-remediation merges wired `useNetworkStatus()` into
  `VehicleRegistrationScreen` and `BoardingRosterScreen`, but these two `__integration__` files
  predate that wiring and never provided the context, so both screens crashed on mount
  (`useNetworkStatus must be used within a NetworkStatusProvider`) — the second failure
  surfaced as `Unable to find node on an unmounted component` since the crash happened before
  the test's own assertion. No production code changed.
- **Contract impact:** none.
- **Tests:** `__integration__/bus-registration-dashboard.int.test.tsx`,
  `__integration__/offline-scan-roster.int.test.tsx` — both updated, no new test files.
  `npm test`: 68/68 suites, 576/576 tests passing (was 66/68, 574/576 on `main`).
  `npm run typecheck`: same 4 pre-existing errors (`ErrorBoundary.tsx`, `api.test.ts`),
  unrelated to and unaffected by this change. `npm run lint`: 0 errors (68 pre-existing
  warnings, none new).
- **Docs updated:** n/a — test-setup fix only, no behavior change to document.
- **Follow-ups / known issues:** none.

---

## 2026-08-27 — Offline go-on-duty: pressing GO with no connection (Offline & Caching Audit, chunk 1)
- **Branch:** feature/audit-remediation-offline-shift-start
- **Modules touched:** [docs/LOCATION_TRACKING.md](LOCATION_TRACKING.md) (§"Offline go-on-duty"),
  [docs/modules/DASHBOARD.md](modules/DASHBOARD.md) (note added to the stub)
- **What changed:**
  - `useTrackingSession` has a new `'pending'` status. When `startTracking()` rejects because the
    socket is down (now tagged `{ offline: true }`), `start()` enters `pending` instead of
    `error`: the shift is on duty locally, the GO-press time is held in memory, and the GPS
    pipeline starts buffering.
  - `DriverDashboard` gates `useLocationBroadcast` / `useBackgroundTracking` / keep-awake on
    `tracking || pending`. `dutyHeroState` + `DutyHero` render an amber "You're on duty · No
    signal — you'll sync when you're back online" for `pending`, GO reads END, and the existing
    "saved, not sent" buffered-count chip shows.
  - On the next socket reconnect the session is announced with `startTracking(vehicleId,
    <press time ISO>)`; success → `tracking` (existing `locationDispatch` replay flushes the
    buffer), still-offline → stays `pending`, server refusal → `error` (and `locationDispatch`
    clears the unsendable buffer as `active` goes false).
  - `services/socket.ts`: `startTracking(vehicleId, startedAt?)` includes `startedAt` in the
    emit payload only when a pending shift reconnects; a normal start still emits `{ vehicleId }`.
- **Why:** Offline & Caching Audit chunk 1 — the one flagged-but-unfixed gap. A driver offline
  before tapping GO could not start a shift at all.
- **Contract impact:** `driver:start-tracking` gains an **optional** `startedAt` (ISO string),
  clamped server-side to `[now − 6h, now]`. Backend doc updated:
  `backend/docs/modules/REALTIME.md`. Backwards compatible — omitting it stamps `now` as before.
- **Tests:** `hooks/__tests__/useTrackingSession.test.ts` (+5: offline→pending, pending→tracking
  with startedAt, still-offline stays pending, server refusal→error, END from pending→idle),
  `services/__tests__/socket.test.ts` (+2: offline flag, payload shape with/without startedAt;
  2 existing not-connected assertions updated for `offline: true`),
  `features/dashboard/__tests__/dutyHeroState.test.ts` (+2 pending mappings),
  `features/dashboard/__tests__/DutyHero.test.tsx` (+3 pending render),
  `__integration__/tracking.int.test.tsx` (1 assertion updated for `offline: true`).
- **Docs updated:** LOCATION_TRACKING.md, DASHBOARD.md stub note, TESTING_GUIDE.md
  (socket / useTrackingSession / dutyHeroState / DutyHero rows).
- **Follow-ups / known issues:** A `pending` shift does not survive an app kill before reconnect
  — this matches today's behaviour for a *confirmed* shift (neither survives a cold start) and is
  a shared follow-up, not a regression introduced here. Full suite: 574 pass, same 2 pre-existing
  integration-suite failures as `main` (`bus-registration-dashboard`, `offline-scan-roster`);
  lint 0 errors; typecheck's 4 errors are all pre-existing (ErrorBoundary.tsx, api.test.ts).

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
