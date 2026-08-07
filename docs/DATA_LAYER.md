# Driver App — Central Data Layer (TanStack Query)

> Single design for fetching, caching, offline, and mutations. Cited by every data-layer/UI
> TODO. Goal: no duplicate fetch logic, one cache, predictable states. Mirrors user-app's
> data layer; **location/socket broadcasting is separate** (see LOCATION_TRACKING.md).

## Three layers (never skip one)
```
1. Transport    services/api/transport.ts   requestJson(url, opts) → parsed JSON or throws AppError
2. Endpoint fns services/api/<domain>.ts     login(), getMyBus(token), getDriverTrips(token)…
3. Feature hooks hooks/<domain>/use*.ts       useMyBusQuery(), useRoutesQuery()
```
UI calls only layer 3.

## 1. Transport (`services/api/transport.ts`)
Consolidate today's `requestJson` + `parseResponse`:
- Single `fetch` wrapper; `AbortController` timeout (15s) → `timeout` AppError.
- Response size guard (5MB) and **single body read**.
- Normalize failures to `AppError`: network → `offline`, non-2xx → `http` (carry `status` +
  server `code`/`message`), bad JSON → `parse`. **Fix the current bug where `parseResponse`
  drops server `code`** — `AppError.fromHttp` must copy `code`/`message`/`fields` from the body.
- Calls `markBackendOnline()`/`markBackendOffline()` as today.

## 2. Endpoint fns (`services/api/<domain>.ts`)
Pure async fns grouped by domain; `authHeaders(token)` helper replaces repeated
`{ Authorization: 'Bearer ' + token, 'Content-Type': … }` (appears ~12×). Preserve every
URL/method/body exactly. Domains + endpoints (from current api.js):
- **auth**: login, register(role='driver'), refreshToken, logout.
- **bus**: getMyBus, registerBus, updateBus.
- **routes**: getRoutes, getRoutesManagementList (public), createRoute.
- **trips**: getDriverTrips, getDriverTripDetails.

`services/api/index.ts` re-exports as a single `api` object (stable surface for migration).

## 3. Feature hooks (`hooks/<domain>/`)

### Query keys (`lib/queryKeys.ts`)
```ts
export const qk = {
  myBus: () => ['bus', 'mine'] as const,
  routes: () => ['routes'] as const,
  routesManagement: () => ['routes', 'management'] as const,
  trips: (page: number) => ['trips', 'history', page] as const,
};
```

### Queries / mutations
- `useMyBusQuery`, `useRoutesQuery`.
- `useRegisterBus`, `useUpdateBus`, `useCreateRoute` (mutations invalidate the relevant
  keys, e.g. registerBus/updateBus → `qk.myBus()`).
- Token via `useAuth()`; 401 handled by `AuthContext.authenticatedRequest` refresh-retry.

## Caching policy
| Data | staleTime | gcTime | Persist offline? | Notes |
|---|---|---|---|---|
| myBus | 5 min | 24 h | yes | needed at dashboard/tracking start |
| routes / routesManagement | 5 min | 24 h | yes | rarely change |
| trips | 30 s | 1 h | yes | paginated, offline-readable |

## Offline persistence
`@tanstack/react-query-persist-client` + AsyncStorage persister; persist `bus`, `routes`,
`trips` keys. `networkMode: 'offlineFirst'`; mutations (register) pause offline
and resume on reconnect. On `logout`, `queryClient.clear()`.

## QueryClient defaults (`app/queryClient.ts`)
Same as user-app: `retry` skips offline + caps at 2; `staleTime` 30s default;
`networkMode: 'offlineFirst'`; `refetchOnWindowFocus: false` (use AppState 'active').

## Relationship to location broadcasting
The GPS broadcast path (`driver:location`) is **not** a Query — it's a high-frequency socket
emit handled by `useLocationBroadcast` (LOCATION_TRACKING.md). Query cache holds REST data
(bus, routes, trips); the tracking session state lives in `useTrackingSession`. The
dashboard composes both.

## Definition of done
- `grep` for `api\.`/`fetch(` under `src/screens` + `src/features` → empty.
- One caller path per endpoint: hook → endpoint fn → transport.
- Server `code` preserved through `AppError` (regression-tested).
- Cold-start offline shows persisted bus/routes/trips.
