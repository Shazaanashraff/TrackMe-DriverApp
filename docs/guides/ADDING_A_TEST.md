# Adding a test — driver-app

How to add each kind of test here, and where it must be registered. This guide orients you;
the authoritative coverage plans are [`../TEST_PLAN_UNIT.md`](../TEST_PLAN_UNIT.md),
[`../TEST_PLAN_INTEGRATION.md`](../TEST_PLAN_INTEGRATION.md),
[`../TEST_PLAN_E2E.md`](../TEST_PLAN_E2E.md), and the traceability table
[`../TESTING_GUIDE.md`](../TESTING_GUIDE.md).

**Policy:** no untested code. Every changed behaviour gets a test **and** a `TESTING_GUIDE.md`
row. [`../QA_UPDATE_TRIGGERS.md`](../QA_UPDATE_TRIGGERS.md) says exactly what triggers an update.

## Which layer?

| If you changed… | Write a… |
|---|---|
| a pure helper / lib fn (`helpers/*`, `lib/*`) | **unit** test |
| a hook's query key, cache policy, or invalidation (`hooks/*`) | **unit** test (renderHook) |
| a component's render/interaction (`components/*`, `features/*`) | **unit** render test |
| an api/socket **contract** (`services/api/*`, `services/socket.js`) | **integration** test |
| a user **journey** (auth, browse, join private route, track, notify) | **E2E (Maestro)** |

---

## Unit (Jest)

- Location: `__tests__/` next to the code (`src/hooks/routes/__tests__/…`).
- Run: `npm test` (all) or `npm test -- <path>` (one file). Coverage: `npm run test:coverage`.
- Hooks: wrap in a `QueryClientProvider` test util; assert query keys (`qk.*`), `enabled`
  gating, and `invalidateQueries` calls — those are the contract, not the network.
- Components: assert on `testID`s and visible text; keep them presentational.

## Integration (Jest, contract-level)

- Location: `src/__integration__/`.
- Purpose: lock the **api/socket contract** — request URL/method/body and how each status
  (`200 / 401 / 403 / 429 / network`) is handled. Mock the `services/api` transport, not business logic.
- These are what catch a backend contract drift; keep them close to the `services/api/*` types.

## E2E (Maestro)

- Location: Maestro flows; run with the npm scripts:
  ```bash
  npm run test:e2e        # maestro test .maestro
  npm run test:e2e:dry    # validate flows without a device
  ```
- There is also a Playwright web pass: `npm run test:e2e:web`.
- Add a flow for any new/changed journey. A missing E2E flow is how a UI entry point gets
  dropped silently in a reskin — it happened in `user-app` and cost a shipped feature.

## GPS / socket behaviour (driver-app specific)

The hero path deserves its own care. When you touch location emit, duty state, or the socket:
- unit-test the **pure** pieces directly — `helpers/locationUtils.ts` (`shouldEmit` throttle),
  `helpers/geo.js` (haversine), `features/dashboard/dutyHeroState.ts` (the headline/subline state
  machine). These are where regressions are cheapest to catch.
- assert the socket contract (`driver:start-tracking` / `driver:location` / `driver:stop-tracking`)
  against [`backend/docs/modules/REALTIME.md`](../../../backend/docs/modules/REALTIME.md).
- remember a GPS regression is **invisible in this app** — it surfaces as missing buses in
  `user-app`. Read [`../LOCATION_TRACKING.md`](../LOCATION_TRACKING.md) before changing cadence.


---

## Register it (don't skip)

1. Add/append the row in [`../TESTING_GUIDE.md`](../TESTING_GUIDE.md): behaviour ↔ file ↔ layer ↔ trigger.
2. Add the test file to the matching `TEST_PLAN_*` doc if it introduces a new coverage area.
3. Keep `lint`, `typecheck`, `test`, and `test:e2e:dry` green before marking done.
