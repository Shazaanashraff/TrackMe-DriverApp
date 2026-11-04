# ROUTE MANAGEMENT - Driver App

Recording the first rides of a custom route. A manager marks the driver's vehicle "custom route";
the driver's first 5 journeys (GO to End journey) are recording rides, and the manager confirms the
route the backend builds from them. Backend side: [`backend CUSTOM_ROUTES.md`](../../../backend/docs/modules/CUSTOM_ROUTES.md).

**Status:** `SHIPPED` - replaces the v1 recorder removed in 2026-08 (Track Route / Add Stop / Complete buttons).
v2 has no separate recording mode: the driver just drives their normal journey.

**Consumed by:** the Home screen ([`DASHBOARD.md`](DASHBOARD.md)); fed by the same GPS pipeline as the live
broadcast ([`../LOCATION_TRACKING.md`](../LOCATION_TRACKING.md)).

---

## 1. Purpose

Capture the GPS track and the stops of each of the first N rides of a custom-route vehicle, upload each when the
journey ends, and show the driver "Ride 3 of 5". The app records raw fixes only; fitting them to roads and
merging the rides happens on the server.

## 2. Key files (one job each)

| File | Responsibility |
|---|---|
| `src/services/routeRecorder.ts` | Module-level recorder (not a hook, like `locationDispatch`, because the OS can deliver background fixes with no screen). Listens to `subscribeToFixes`, keeps the ride (points + stops), persists it, owns the upload queue. |
| `src/hooks/customRoute/index.ts` | `useCustomRouteQuery` (progress, `GET /current`) and `useRouteRecorder` (starts the ride when the shift starts, `finish()` uploads or queues, `discard()`). |
| `src/features/dashboard/StopNameSheet.tsx` | The "Name this stop" sheet shown right after *Add stop* (text box, three suggestions, Save / Skip). |
| `src/features/dashboard/CustomRouteCard.tsx` | The card on Home: ride pips, live distance/stops, Add stop, Discard. A "sent to your manager" card once the rides are in. Nothing for a live route. |
| `src/features/dashboard/customRouteMessages.ts` | The wording for a finished ride and for a tapped stop (pure). |
| `src/services/api/customRoutes.ts` | `getCurrentCustomRoute`, `submitCustomRouteRun`, `discardCustomRouteRun`. |
| `src/services/backgroundLocation.ts` | Calls `restoreRecording()` so a ride in progress survives the process being killed. |
| `src/screens/DriverDashboard.tsx` | Wires the card, the recorder, End journey (send the ride first, then go off duty) and the unfinished-ride prompt. |
| `src/helpers/geo.js` | `appendBreadcrumbPoint` (5000-point cap, halves resolution past it), `totalDistanceMeters`. |

## 3. Data flow

1. Home loads `GET /api/driver/custom-routes/current`. `null` means an ordinary vehicle: nothing below happens.
2. `status: RECORDING` + the driver goes on duty: `useRouteRecorder` calls `startRecording(vehicleId)` which
   starts listening to the dispatch fix stream (every fix that is broadcast is also recorded; it never starts its
   own GPS watcher). A saved ride for the same vehicle newer than 3 hours is resumed.
3. The track is saved to storage every 10 fixes. **Add stop** records the latest fix (refused with no fix yet,
   or within 20 m of the previous stop).
4. **End journey** -> `finish()` stops recording and `POST /api/driver/custom-routes/runs` with
   `{ clientRunId, startedAt, endedAt, points, stops }`; then `session.stop()`; then an alert says what happened
   ("Ride 3 of 5 saved", "Ride not counted: ...", "All rides recorded").
5. No signal: the ride is queued (`route_recording_queue`, max 10) and sent whenever the dashboard is open and
   signed in; `clientRunId` makes a resend count once. A refusal the server will repeat (4xx other than 429) drops it.
6. After the last ride the card says the route was sent to the manager. Once the manager confirms, the card disappears.

## 4. Contracts (API / socket / storage)

| Where | Contract |
|---|---|
| `GET /api/driver/custom-routes/current` | `{ data: null \| { routeId, status, requiredRuns, acceptedRuns, runs[] } }` |
| `POST /api/driver/custom-routes/runs` | `{ data: { run: { status: ACCEPTED \| PENDING_MATCH \| REJECTED, rejectReason, runNumber }, route: { status, acceptedRuns, requiredRuns } } }`; 409 `NOT_RECORDING` when the route is not collecting rides |
| `DELETE /api/driver/custom-routes/runs/:runId` | discard one of the driver's rides |
| AsyncStorage `route_recording_active` | the ride in progress: `{ clientRunId, vehicleId, startedAt, points[], stops[] }` |
| AsyncStorage `route_recording_queue` | finished rides waiting to be sent |
| `GET /api/routes/:id` | now sent **with the driver's token** (`getRouteById(routeId, token)`) so a custom route resolves for its own driver |

## 5. Not visible in the frontend

- Road fitting, merging the rides and clustering stops are server-side; the app never sees the finished line.
- A rejected ride (too short, a different route, ...) comes back as a normal response, not an HTTP error.
- The recorder also receives the 30-second keepalive fix when the vehicle is parked; the server's cleaning removes
  the duplicates.
- `restoreRecording()` runs inside the headless background task; it must stay cheap (one storage read).

## 6. Gotchas

- Discarding mid-shift stops recording for that shift; the next shift starts a fresh ride.
- A saved ride older than 3 hours is not resumed on a new shift (it would glue two days together); the
  "Unfinished ride" prompt offers it back on Home instead (Send it / Throw away).
- The dashboard calls `/current` for every driver; it is cheap and returns `null` for non-custom vehicles.
- Reject wording lives in `customRouteMessages.ts`; a new server `rejectReason` needs a line there (unknown
  reasons fall back to a generic message).

## 7. Tests

See the [`TESTING_GUIDE.md`](../TESTING_GUIDE.md) "Custom Route Recording" section: `routeRecorder.test.ts`,
`customRoute.test.ts` (hooks), `CustomRouteCard.test.tsx`, `customRouteMessages.test.ts`,
`DriverDashboard.test.js`, `backgroundLocation.test.ts`, `api.test.ts`.

## 8. Change protocol

1. Run the tests above green first. 2. Keep GPS handling in `routeRecorder.ts` (never a second watcher).
3. Add tests for each changed behaviour (offline queue, resume window, stop guards). 4. Update this doc and the
TESTING_GUIDE rows, append to [`../CHANGES.md`](../CHANGES.md). 5. A contract change updates
`backend/docs/modules/CUSTOM_ROUTES.md` too.

## Naming stops (2026-11-04)

*Add stop* saves the vehicle's position at the moment of the tap, then the **Name this stop** sheet asks for a name
("Nimal's house", "School gate"). The name is optional: *Skip* leaves the stop unnamed and the manager can name it when
they review the route. The name is attached to the stop by the time it was marked (`nameStop(markedAt, name)`), is
saved with the ride (so a killed app keeps it) and capped at 80 characters. The card shows "Last stop: <name>".
There is no *Add stop* once the route is live: stops are taken from the recording rides only; the manager can change
them at confirm, or re-record the route.
