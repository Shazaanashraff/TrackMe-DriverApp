# Driver App Integration Test Plan

> Client side of the API + socket contract: for every fetch/emit, assert what is sent (URL/
> method/headers/payload shape+size / socket event+payload), what the app does with each
> response/ack, and how the UI reacts (success/empty/error/offline/permission). Backend's
> server-side matrix stays canonical at `backend/docs/TEST_PLAN_INTEGRATION.md`.

## Harness
Jest + a fetch mock (control status/body/latency/failure) and a socket mock (control
ack/disconnect). Endpoint fn + hook tested together; screen-level where the TODO covers a
screen. Files: `src/__integration__/<domain>.int.test.tsx`.

## Contract checklist (every endpoint)
1. URL (+query) + method. 2. Headers (Content-Type on JSON; `Authorization: Bearer` on
protected; absent on public like `getRoutesManagementList`). 3. Payload shape (required
fields, types, no token in body). 4. Payload size (oversized handled). 5. Success → cache/UI;
loading clears. 6. Empty → `EmptyState`. 7. Errors 400/401/403/404/409/422/500 → `AppError`
with `code`/`message` (**verify `code` preserved**); UI shows InlineError/ErrorState. 8.
Offline/timeout → cached + OfflineBanner or ErrorState+Retry; no hang. 9. Malformed JSON →
`parse` handled.

## Flows
### Auth
login (driver role-gate: non-driver rejected client-side), register, refreshToken, logout.
Edge: wrong password (401), non-driver login, expired refresh → forced logout + clear cache.

### Bus
getMyBus, registerBus, updateBus. Edge: duplicate plate, invalid route id, update another
driver's bus (403), no bus assigned (empty).

### Routes
getRoutes (protected), getRoutesManagementList (public — no auth header), createRoute. Edge:
invalid route payload, 404.

### Earnings
getDriverEarningsStats, getDriverEarningsHistory (pagination), getDriverDailyBreakdown,
requestDriverPayout. Edge: empty history (EmptyState), already-pending payout (409),
insufficient earnings, invalid earningId (404), payout invalidates `['earnings']`.

### Tracking (socket contract) — see LOCATION_TRACKING.md
- `driver:start-tracking` → ack success/failure handling; session state transitions.
- `driver:location` payload shape `{ busId, routeId, lat, lng }`; invalid coords rejected;
  ack/nack handling.
- `driver:stop-tracking` emitted; cleanup.
- Disconnect mid-tracking → buffering; reconnect → replay queued fixes in order.

## UI-handling assertions ("no/bad fetch")
Per screen: empty → EmptyState; backend down → OfflineBanner+cached or ErrorState+Retry;
server error → ErrorState (`userMessage`, not raw body); form validation → InlineError;
**permission denied → permission state, tracking disabled**.

## Cross-cutting
Token refresh on 401 retries once then logs out; mutations invalidate correct keys; offline
mutation resumes on reconnect; persisted reads survive cold start; no token in any body.

## Canonical references
- Backend CRUD + websocket matrix: `backend/docs/TEST_PLAN_INTEGRATION.md`
- Edge-case guide: `backend/docs/project/TEST_EDGE_CASES.md`
- Client error UX: `docs/ERROR_HANDLING.md`; tracking: `docs/LOCATION_TRACKING.md`
