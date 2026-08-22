# BUS REGISTRATION — Driver App

Registering the bus a driver operates: identity, route assignment, service type, and the booking
toggle.

**Status:** `SHIPPED-REGRESSION` — the screen offers only **3 of the 4** service types the system
supports. `UNIVERSITY` is missing, so a university shuttle cannot be registered from this app.
See §6.

**Consumed contract:** backend [`BUSES.md`](../../../backend/docs/modules/BUSES.md) /
[`ROUTES.md`](../../../backend/docs/modules/ROUTES.md).

> Mined from the retired umbrella doc `docs/modules/driver-app/SHUTTLE_IMPLEMENTATION.md` and
> **re-verified against `src/` and the backend models** — which is how the missing service type
> below was found.

---

## 1. Purpose

A driver registers their vehicle so it can be tracked and (optionally) booked. The record ties
together bus identity, the `routeId` it serves, its `serviceType`, and whether bookings are open.
Those fields are not cosmetic — they decide whether the bus appears in `user-app` at all and
whether its GPS reaches the right route room.

## 2. Key files

| File | Responsibility |
|---|---|
| `src/screens/BusRegistrationScreen.js` | The form: bus fields, route, `SERVICE_TYPES` chips, `bookingEnabled` toggle, `validateForm()`. |
| `src/features/bus-registration/` | Form sub-components. |
| `src/hooks/bus/index.ts` | The registration mutation + bus queries. |
| `src/services/api/` | HTTP calls. |

## 3. Fields that matter

| Field | Values | Why it matters |
|---|---|---|
| `routeId` | an existing route's `routeId` | **Must match a real route.** A mismatch means the bus never joins the right socket room and its GPS fans out nowhere — see [`web-admin TRACKING.md`](../../../web-admin/docs/modules/TRACKING.md) §6. |
| `serviceType` | `PUBLIC` · `SCHOOL` · `UNIVERSITY` · `OFFICE` (backend enum) | Drives filtering in `user-app`, which shows SCHOOL/UNIVERSITY/OFFICE and **excludes PUBLIC**. |
| `bookingEnabled` | boolean, defaults `true` | Booking availability only. **Does not affect tracking** — don't conflate the two. |

## 4. Validation

Client-side `validateForm()` in the screen, plus backend enforcement:

- **`serviceType` must be in the backend enum** — `['PUBLIC','SCHOOL','UNIVERSITY','OFFICE']`
  (`src/models/Bus.js`, mirrored on `Route`). Default `PUBLIC`.
- **Route–bus service-type consistency is backend-enforced**: a bus's `serviceType` must match its
  route's. The client can submit a mismatch; the server rejects it.
- **`bookingEnabled` must be boolean.**

## 5. Not visible in the frontend

- **The service-type list is duplicated, not shared.** `SERVICE_TYPES` is hardcoded in
  `BusRegistrationScreen.js` and again in the backend models and again in user-app's filter list.
  Nothing keeps the three in sync — which is exactly how the gap in §6 appeared.
- Route–bus consistency is checked **server-side only**, so a stale route picker can offer an
  invalid combination that only fails on submit.

## 6. Known gotchas / regressions

- **`UNIVERSITY` is missing from this screen.** `BusRegistrationScreen.js:24` declares
  `SERVICE_TYPES = ['PUBLIC', 'SCHOOL', 'OFFICE']`, but the backend enum
  (`backend/src/models/Bus.js:3`) allows `['PUBLIC','SCHOOL','UNIVERSITY','OFFICE']` and
  `user-app`'s `ShuttleHomeScreen.js:23` renders a **`UNIVERSITY` filter tab**. Net effect: a
  driver cannot register a university shuttle here, and the user-app tab stays empty unless the
  bus/route was created through `web-admin`. One-line fix; add a test that pins the list to the
  backend enum so it can't drift again.
- `bookingEnabled` defaults to `true` — a bus is bookable the moment it's registered unless the
  driver turns it off.

## 7. Tests covering this module

| Layer | File | What it locks |
|---|---|---|
| Unit | `src/hooks/bus/__tests__/` | registration mutation, invalidations |
| Unit | `src/screens/__tests__/` | `validateForm`, chip selection, booking toggle, **the full service-type list** |
| E2E | `.maestro/` | register a bus → appears on the dashboard |

## 8. Change protocol

See [`_MODULE_TEMPLATE.md`](../guides/_MODULE_TEMPLATE.md) §8. If the `serviceType` list changes,
it must change in **three places** (this screen, the backend enum, user-app's filter) — treat that
as one cross-repo change, not three.
