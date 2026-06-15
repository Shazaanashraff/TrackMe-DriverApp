# TODO 049 — Unit tests: feature components

**Phase:** 4 · **Priority:** P3 · **Depends on:** 022, 023, 024, 025
**Cite:** docs/TEST_PLAN_UNIT.md (features/*)

## Step-by-step
1. dashboard: TrackingToggle (start/stop fires), TrackingStatusCard (per status),
   AssignedBusCard, LiveStatsBar.
2. earnings: EarningsSummary, EarningsHistoryList, PayoutRequestForm (validation),
   DailyBreakdownChart (mock chart lib).
3. route-management: RouteForm (validation + submit), RouteList.
4. bus-registration: BusRegistrationForm (validation), RoutePicker (select callback).
5. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-049.sh` — feature tests under `src/features/*/__tests__` exist;
`npx jest src/features` green.

## Blocked
