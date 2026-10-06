# TRIP HISTORY — Driver App

Past trips list.

**Status:** `PLANNED (doc)` — the code is shipped; **this document is not yet written**.
Do not read its absence as "no such feature". Read the source below, then fill this file in from
[`../guides/_MODULE_TEMPLATE.md`](../guides/_MODULE_TEMPLATE.md) as part of your next change
here — that is the change protocol, not optional extra work.

> **Hidden (2026-10-06).** The Trips tab is unmounted from `AppNavigator`. Ending a journey
> only marks the vehicle offline (backend `utils/liveVehicles.js` `endSession`); nothing calls
> `POST /api/driver/trips/log`, so the list could only ever be empty. The screen and its tests
> stay so the tab can come back once the backend records a trip when a journey ends.

## Source of truth until this doc exists

`src/screens/TripHistoryScreen.js`

## What this doc must cover

Template section order: Purpose · Key files (one job each) · Data flow · Contracts (API/socket/
storage) · **Not visible in the frontend** · Gotchas · Tests · Change protocol.

Pay particular attention to:
- the **backend contract** it depends on — verify real endpoint paths against `backend/src`
  rather than inferring them, and link the matching `backend/docs/modules/*.md`;
- where trip records come from (journeys vs boarding events).
