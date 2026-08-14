# Driver App — Location Tracking (the hero feature)

> The driver app exists to broadcast accurate, reliable GPS to the backend so passengers see
> live buses. This doc is the design for that path. Cited by the tracking, socket, and
> Phase 7 location TODOs. Reliability + battery + offline tolerance are production-critical.

## Current state (verified)
- `useLocationBroadcast` watches position (~3s / 3m) while a shift is active and feeds every fix
  into `services/locationDispatch`, which throttles, emits `driver:location`, or buffers.
- `useBackgroundTracking` promotes the shift to OS-managed background updates once the driver
  grants background permission; the foreground watcher stands down while that is running, since
  both feed the same dispatcher.
- `startTracking(vehicleId)` / `stopTracking(vehicleId)` emit `driver:start-tracking` /
  `driver:stop-tracking`; **both ack paths are timeout-bounded** — an unanswered start used to
  leave the GO button spinning forever with no way to retry.
- Backend contract for all of the above: `backend/docs/modules/REALTIME.md`.

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

## Background tracking (Phase 7: 072) — IMPLEMENTED

A shift must keep broadcasting with the driver's screen locked, so tracking is **not**
foreground-only. Three pieces:

**`services/locationDispatch.ts` — one pipeline, two producers.** The throttle, the offline
buffer, and the emit path live here rather than inside the React hook, because the OS-driven
background task runs outside React and must share the same buffer and the same last-emitted
fix. The foreground watcher and the background task both call `dispatchFix()`. UI reads it
back through `subscribeToFixes` / `subscribeToBufferCount`.

Buffer and session target are mirrored to AsyncStorage: the OS can launch this process
**headless**, with no React tree having run, so `restoreDispatchState()` rehydrates both before
the first fix is handled.

**`services/backgroundLocation.ts` — the OS task.** `TaskManager.defineTask` is registered at
module scope and imported from `App.js`, never from a screen — a headless launch mounts no
navigator. `startLocationUpdatesAsync` runs with an Android `foregroundService` notification
(Android kills a background location process within minutes without one) and
`showsBackgroundLocationIndicator` on iOS. If the task wakes with a dead socket it reconnects
from the stored token; anything it still can't send buffers and replays.

**`hooks/useBackgroundTracking.ts` — two-step permission.** A shift starts foreground-only on
GO, then background is offered behind `BackgroundLocationDisclosure`. **Google Play requires
that disclosure to precede the system prompt** and to name the data, the background collection,
and the purpose — do not merge it into the OS dialog or show it afterwards. Once granted, later
shifts promote automatically without re-prompting. The OS service is stopped when the shift
ends *and* on unmount, so logout cannot strand a running foreground service.

While tracking foreground-only (background declined or not yet granted), the dashboard holds
`expo-keep-awake` so a screen timeout can't silently demote the shift to nothing.

**Testing this needs a physical device and a dev-client/EAS build — Expo Go cannot run
background location.** Everything else about the shift is exercised in Jest with the OS APIs
mocked.

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
- `locationDispatch`: throttle, buffer cap/replay ordering, NACK re-buffer vs. accepted-stale,
  headless restore from AsyncStorage, reset at end of shift.
- `backgroundLocation`: OS batch → dispatch, headless reconnect from the stored token,
  foreground-service options, start/stop idempotence.
- `useBackgroundTracking`: offer/dismiss, grant + deny, auto-start on a later shift, stop on
  shift end and on unmount.
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
