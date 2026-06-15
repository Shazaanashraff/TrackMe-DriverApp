# TODO 055 — Integration: tracking socket contract (hero)

**Phase:** 5 · **Priority:** P3 · **Depends on:** 050, 018, 019
**Cite:** docs/TEST_PLAN_INTEGRATION.md (Tracking), docs/LOCATION_TRACKING.md

## Goal
Prove the socket contract that the passengers' live map depends on.

## Step-by-step
`src/__integration__/tracking.int.test.tsx` (mockSocket):
- `driver:start-tracking` → ack success sets session `tracking`; ack failure → `error`.
- `driver:location` payload is exactly `{ busId, routeId, lat, lng }`; **invalid coords are
  rejected/skipped** (via locationUtils); ack/nack handled.
- `driver:stop-tracking` emitted on stop; watcher cleaned up.
- **Disconnect mid-tracking → fixes buffer; reconnect → buffered fixes replay in order**.

## Completion test
`todos/completion-tests/todo-055.sh` — `tracking.int.test.tsx` exists referencing
`driver:location`+`start-tracking`+`reconnect`/`replay`; `npx jest tracking.int` green.

## Blocked
