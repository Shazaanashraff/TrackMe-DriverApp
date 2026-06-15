# Driver App — Location Tracking (the hero feature)

> The driver app exists to broadcast accurate, reliable GPS to the backend so passengers see
> live buses. This doc is the design for that path. Cited by the tracking, socket, and
> Phase 7 location TODOs. Reliability + battery + offline tolerance are production-critical.

## Current state (verified)
- `DriverDashboard` calls `expo-location` `watchPositionAsync` (~3s / 3m) while tracking and,
  on each fix, calls `emitLocation(busId, routeId, lat, lng)` → socket `driver:location`.
- `startTracking(busId)` / `stopTracking(busId)` emit `driver:start-tracking` /
  `driver:stop-tracking` (start returns an ack Promise).
- All of this lives inside the 657-LOC screen with raw `useState`; no batching, no offline
  buffering, no permission-state UX, no battery adaptation, no retry of dropped emits.

## Target architecture (three pieces)

### 1. `services/socket.ts` (typed transport)
Keep the existing exports, typed: `connectSocket(token)`, `emitLocation(payload, ack?)`,
`startTracking(busId): Promise<Ack>`, `stopTracking(busId)`, `onConnectionStateChange`,
`disconnectSocket`. No React. No business logic.

### 2. `hooks/useTrackingSession.ts` (lifecycle)
Owns the **session**: start → broadcasting → stop.
- `start()` → ensure socket connected → `startTracking(busId)`; on ack success set state
  `tracking`; on failure surface an `AppError` (kind `tracking`).
- `stop()` → `stopTracking(busId)` → state `idle`.
- Tracks `status: 'idle' | 'starting' | 'tracking' | 'error'`, derived from socket connection
  state + acks.
- On unmount / logout / app-background-policy, stop cleanly.

### 3. `hooks/useLocationBroadcast.ts` (the GPS pump)
Owns position acquisition + emit, active only while `useTrackingSession` is `tracking`.
- Request permissions first (foreground always; background if enabled — see below). Expose
  `permission: 'granted' | 'denied' | 'undetermined'` for UX.
- `watchPositionAsync` with tuned accuracy/interval (see Battery).
- **Throttle/batch** emits (see below); attach an ack callback to detect dropped emits.
- **Offline buffer**: when socket disconnected or emit nacks fail, queue fixes (cap size,
  drop oldest) and **replay** on reconnect so the server gets a continuous-ish trail.
- Cleanup: remove the watcher on stop/unmount; never leak a background watcher.

The dashboard composes: `useMyBusQuery` (which bus) → `useTrackingSession` → while tracking,
`useLocationBroadcast`.

## Battery & accuracy policy (Phase 7: 071)
- Use `Accuracy.High` (not `BestForNavigation`) by default; allow a "high-accuracy" toggle.
- Adaptive interval: faster updates when moving, slower when stationary (compare last fix
  distance via `locationUtils`); skip emits below a min distance delta.
- Batch multiple fixes into one emit per N seconds when the backend accepts arrays (else emit
  the latest and drop intermediate). Document which the backend supports.
- Stop the watcher immediately on `stop()` — a running GPS watcher is the #1 battery drain.

## Background tracking (Phase 7: 072)
- Decide policy: foreground-only (simplest, safe) vs background (`expo-location`
  `startLocationUpdatesAsync` + TaskManager + a foreground service notification on Android,
  `UIBackgroundModes: location` on iOS).
- If background is required for the product, implement via TaskManager task that emits via a
  headless socket or buffers to storage for replay. Use `expo-keep-awake` on the dashboard so
  the screen doesn't sleep mid-shift when foreground.
- This is a significant, permission-sensitive change — its own TODO with explicit UX + store
  compliance notes.

## Offline buffer (Phase 7: 073)
- Ring buffer (e.g. last 500 fixes) in memory + optional AsyncStorage spill.
- On reconnect, replay in order with timestamps; backend dedupes by timestamp.
- Surface a small "buffering offline — N fixes queued" indicator.

## Permission & error UX (ties to ERROR_HANDLING.md)
- Permission denied → clear screen explaining why + a button to open settings; tracking
  disabled until granted.
- GPS unavailable / location services off → actionable message.
- Socket down while tracking → "reconnecting, buffering" state, not a crash.

## Testing
- `useTrackingSession`: start success/failure (ack), stop, cleanup on unmount (mock socket).
- `useLocationBroadcast`: permission branches; throttle limits emit frequency (fake timers);
  min-distance skip; offline buffer queues + replays on reconnect; watcher removed on stop.
- `locationUtils`: distance, throttle, coord validation (pure).
- Integration (`055`): socket emit contract — `driver:location`/`start`/`stop` payload shapes
  + ack handling + reconnect replay.
- E2E (`062`, `063`, `068`): start/stop tracking, permission-denied, offline→reconnect.

## Definition of done
- No location/socket logic remains inside screens (all in services/hooks).
- Tracking survives a socket drop (buffers + replays) and stops cleanly (no leaked watcher).
- Permission states have explicit UX.
- Battery policy implemented (adaptive interval + min-distance + stop-on-stop).
