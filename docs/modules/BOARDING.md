# BOARDING — Driver App

QR pass scanning, BOARD/ALIGHT events, and the enrolled on-board roster ("X / Y on board").

**Status:** `PLANNED (doc)` — the code is shipped; **this document is not yet written**.
Do not read its absence as "no such feature". Read the source below, then fill this file in from
[`../guides/_MODULE_TEMPLATE.md`](../guides/_MODULE_TEMPLATE.md) as part of your next change
here — that is the change protocol, not optional extra work.

## Source of truth until this doc exists

`src/screens/QRScannerScreen.tsx`, `src/screens/BoardingRosterScreen.tsx`, `src/features/boarding/`, `src/hooks/boarding/index.ts`

## What this doc must cover

Template section order: Purpose · Key files (one job each) · Data flow · Contracts (API/socket/
storage) · **Not visible in the frontend** · Gotchas · Tests · Change protocol.

Pay particular attention to:
- the **backend contract** it depends on — verify real endpoint paths against `backend/src`
  rather than inferring them, and link the matching `backend/docs/modules/*.md`;
- the roster endpoint `GET /api/driver/boarding/roster` and its `onBoardCount`/`enrolledCount`/`guests` shape — see [`backend QR_ATTENDANCE.md`](../../../backend/docs/modules/QR_ATTENDANCE.md);
- that PUBLIC routes have no enrollment, so `enrolledCount` is 0 there.
