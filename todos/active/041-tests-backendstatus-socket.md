# TODO 041 — Unit tests: backendStatus + socket

**Phase:** 4 · **Priority:** P2 · **Depends on:** 017
**Cite:** docs/TEST_PLAN_UNIT.md (Services)

## Step-by-step
1. `src/services/__tests__/backendStatus.test.ts`: `isBackendConnectionError` patterns;
   subscribe immediate + on change; unsubscribe; transition-only notify; monitor interval +
   AppState + cleanup (fake timers, mock fetch/AppState).
2. `src/services/__tests__/socket.test.ts` (mock `socket.io-client`): connectSocket auth token;
   `emitLocation` guards on connected + emits `driver:location` payload; `startTracking`
   resolves ack; `stopTracking` emits; `onConnectionStateChange` unsubscribe; disconnect cleanup.
3. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-041.sh` — both test files exist; backendStatus refs
`subscribeBackendStatus`; socket refs `emitLocation`+`startTracking`; `npx jest backendStatus
socket` green.

## Blocked
