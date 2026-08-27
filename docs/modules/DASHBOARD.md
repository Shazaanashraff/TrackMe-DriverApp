# DASHBOARD — Driver App

The Home/duty screen: DutyHero, GoButton, vehicle card, on-board card, custom-route section.

**Status:** `PLANNED (doc)` — the code is shipped; **this document is not yet written**.
Do not read its absence as "no such feature". Read the source below, then fill this file in from
[`../guides/_MODULE_TEMPLATE.md`](../guides/_MODULE_TEMPLATE.md) as part of your next change
here — that is the change protocol, not optional extra work.

## Source of truth until this doc exists

`src/screens/DriverDashboard.tsx`, `src/features/dashboard/` (incl. `dutyHeroState.ts`, `useSocketConnection`, `useCustomRouteJourney`)

> **Note for whoever writes this doc:** the duty state machine now has a `pending` status —
> pressing GO with no connection puts the shift on duty locally (GPS buffering, amber hero, GO
> reads END) and it is announced to the server on reconnect. `DriverDashboard` gates
> `useLocationBroadcast` / `useBackgroundTracking` / keep-awake on `tracking || pending`. Full
> description in [`../LOCATION_TRACKING.md`](../LOCATION_TRACKING.md) §"Offline go-on-duty".

## What this doc must cover

Template section order: Purpose · Key files (one job each) · Data flow · Contracts (API/socket/
storage) · **Not visible in the frontend** · Gotchas · Tests · Change protocol.

Pay particular attention to:
- the **backend contract** it depends on — verify real endpoint paths against `backend/src`
  rather than inferring them, and link the matching `backend/docs/modules/*.md`;
- `dutyHeroState.ts` is a **pure state machine** for headline/subline/dot — test it directly;
- its relationship to [`../LOCATION_TRACKING.md`](../LOCATION_TRACKING.md), which owns the GPS path.
