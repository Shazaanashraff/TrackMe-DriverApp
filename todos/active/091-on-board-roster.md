# TODO 091 — QR Attendance: on-board roster + "X / Y on board" count

**Phase:** 8 (NEXT version) · **Priority:** P3 · **Depends on:** 090 (scanner)
**Cross-repo dependency:** backend `GET /api/driver/boarding/roster?busId=&tripId=` (shipped
2026-07-22 — enrolled roster from ACTIVE `RouteMembership` on the bus's route, joined with each
rider's latest trip event → on-board status).

## Goal
Give the driver a live view of who is on the bus: a Home-screen count card showing
"currently on board / enrolled" and a dedicated page listing the enrolled riders with each one's
status. This is the on-board roster explicitly deferred as "Out of scope" by todo 090.

## What shipped
- **API:** `src/services/api/boarding.ts` → `getBoardingRoster(token, { busId })` →
  `GET /api/driver/boarding/roster`, exported from `src/services/api/index.ts`.
- **Query key:** `qk.boardingRoster(busId)` in `src/lib/queryKeys.ts`.
- **Hook:** `src/hooks/boarding/index.ts` → `useBoardingRosterQuery(busId)` (TanStack Query,
  enabled only with a token + busId, 30s staleTime, unwraps `{ data }`). Exposes the
  `BoardingRoster` / `RosterRider` / `RosterStatus` types.
- **Live refresh:** `useBoardingScan` invalidates `qk.boardingRoster(busId)` after a successful
  (non-debounced) scan, so the Home card + page reflect the scan when refocused.
- **Home card:** `src/features/dashboard/OnBoardCard.tsx` — "X / Y on board", Skeleton while
  loading, muted "No enrolled riders yet" when `enrolledCount===0`, hidden entirely when the
  query errors (e.g. route not QR-enabled). Mounted in `DriverDashboard.tsx` below the scan card,
  gated on `!!bus`; taps navigate to `BoardingRoster`.
- **Roster page:** `src/screens/BoardingRosterScreen.tsx` — count summary, `FlatList` of enrolled
  riders each with a `StatusPill` (On board / Not boarded / Alighted) + last-event time, a
  "not enrolled" guests footer, `EmptyState` + error state, pull-to-refresh. Registered as the
  pushed root-stack screen `BoardingRoster` in `AppNavigator.js`.

## Deviations from plan
- Denominator = **enrolled riders on the route** (locked with the user). `RouteMembership` exists
  only for PRIVATE/shuttle routes, so on a PUBLIC route `enrolledCount` is 0 and the card shows the
  muted empty state — acceptable per the chosen semantics.
- No socket subscription — refresh is via query invalidation on scan + focus refetch (a single
  driver device is the only scanner for its bus). The backend already emits `attendance:event` if
  cross-device realtime is wanted later.

## Tests
- `src/hooks/boarding/__tests__/useBoardingRosterQuery.test.ts` — unwrap, disabled without busId,
  error surface.
- `src/features/dashboard/__tests__/OnBoardCard.test.tsx` — count render + navigate, empty state,
  skeleton, hidden-on-error.
- `src/screens/__tests__/BoardingRosterScreen.test.tsx` — summary + all statuses + guests, empty
  state, error state, back.
- `src/features/boarding/__tests__/useBoardingScan.test.ts` — extended: invalidates roster on
  success, not on debounce.
- `.maestro/on-board-roster.yaml` — launch → login → tap "On board" → assert roster page.

## Out of scope
Manual BOARD/ALIGHT correction UI. Public-route (non-enrolled) denominators. Manager-side
attendance reports (web-admin).

## Completion test
`todos/completion-tests/todo-091.sh` — card/screen/hook exist and consume the roster hook (no
`api.`/`fetch(`); endpoint fn + query key + nav registration present; typecheck + lint + boarding
tests green.

## Blocked
(none — shipped)
