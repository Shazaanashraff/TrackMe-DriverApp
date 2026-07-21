# ROUTE MANAGEMENT — Driver App

Recording and submitting custom routes for manager approval (audited as fully done, both phases).

**Status:** `PLANNED (doc)` — the code is shipped; **this document is not yet written**.
Do not read its absence as "no such feature". Read the source below, then fill this file in from
[`../guides/_MODULE_TEMPLATE.md`](../guides/_MODULE_TEMPLATE.md) as part of your next change
here — that is the change protocol, not optional extra work.

## Source of truth until this doc exists

`src/screens/RouteManagementScreen.tsx`, `src/features/route-management/`, `src/components/CustomRouteRecorder.js`, `src/hooks/routes/index.ts`

## What this doc must cover

Template section order: Purpose · Key files (one job each) · Data flow · Contracts (API/socket/
storage) · **Not visible in the frontend** · Gotchas · Tests · Change protocol.

Pay particular attention to:
- the **backend contract** it depends on — verify real endpoint paths against `backend/src`
  rather than inferring them, and link the matching `backend/docs/modules/*.md`;
- road-snapping happens **server-side**; the recorder only captures breadcrumbs;
- the off-route re-approval flow, and [`backend CUSTOM_ROUTES.md`](../../../backend/docs/modules/CUSTOM_ROUTES.md).
