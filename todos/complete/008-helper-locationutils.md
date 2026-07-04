# TODO 008 — helpers/locationUtils

**Phase:** 0 · **Priority:** P1 · **Depends on:** 001, 002
**Cite:** docs/LOCATION_TRACKING.md (battery/throttle), docs/TEST_PLAN_UNIT.md

## Goal
Pure helpers for the GPS pump so `useLocationBroadcast` (019) stays thin and testable.

## Step-by-step
1. `src/helpers/locationUtils.ts`:
   - `distanceMeters(lat1,lng1,lat2,lng2)` — Haversine in metres.
   - `isValidCoord(lat,lng)` — finite + in range.
   - `throttle(fn, ms)` — leading/trailing throttle (or a `shouldEmit(last, next, minMeters,
     minMs)` predicate — pick one, document it).
2. `src/helpers/__tests__/locationUtils.test.ts` — distance known value + symmetry; invalid
   coords; throttle window / shouldEmit min-distance + min-time.
3. `npm run typecheck` + `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-008.sh` — locationUtils.ts + test exist; test names include
`distance`/`invalid`/`throttle`(or `shouldEmit`); jest green; typecheck green.

## Blocked
