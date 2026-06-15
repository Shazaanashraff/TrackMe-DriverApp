# TODO 017 — Typed socket service

**Phase:** 1 · **Priority:** P1 · **Depends on:** 005
**Cite:** docs/LOCATION_TRACKING.md (socket transport)

## Goal
Type the existing `services/socket.js` → `services/socket.ts` with a clean, testable surface;
no business logic, no React.

## Step-by-step
1. Convert to TS. Keep exports, typed: `connectSocket(token)`, `disconnectSocket()`,
   `emitLocation(payload: { busId; routeId; lat; lng }, ack?)`,
   `startTracking(busId): Promise<Ack>`, `stopTracking(busId)`, `getConnectionState()`,
   `onConnectionStateChange(cb): () => void`.
2. Guard emits on `socket?.connected`; `emitLocation`/`stopTracking` no-op when not connected.
   `startTracking` resolves `{ success:false, error }` when not connected (as today).
3. Gate the `console.log` lines behind `__DEV__` (full hygiene is todo 028; at least don't add
   new noise). No token logged.
4. Keep `setupSocketNotificationListeners` wiring intact.
5. Tests (todo 041 is full; add a basic emit-guard + ack test here). `typecheck` + `test:unit`.

## Out of scope
Session/broadcast hooks (018/019); offline buffer (073).

## Completion test
`todos/completion-tests/todo-017.sh` — `src/services/socket.ts` exists exporting emitLocation/
startTracking/stopTracking/onConnectionStateChange; emit guard present (grep `connected`);
typecheck green.

## Blocked
