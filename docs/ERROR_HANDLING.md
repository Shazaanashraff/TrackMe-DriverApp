# Driver App — Error Handling & UX

> How the app behaves on failure/empty/offline, plus driver-specific location/permission
> states. Cited by UI + error TODOs. Principle: the driver always sees a clear, professional
> state — and the **tracking status is never ambiguous** (a driver must always know if the
> backend is receiving their location).

## Error taxonomy (`lib/errors.ts`)
Same `AppError` model as user-app, with two driver-specific kinds added:
```ts
export type AppErrorKind =
  | 'offline' | 'timeout' | 'http' | 'parse' | 'unknown'
  | 'permission'   // location permission denied / services off
  | 'tracking';    // start/stop tracking ack failed, socket not connected
```
- `AppError.fromHttp(status, body)` copies `code`/`message`/`fields` (fixes today's loss).
- `normalizeError`, `isOfflineError`, `userMessage` as in user-app; `userMessage` maps known
  server `code`s + the two new kinds to friendly, actionable copy.

## The four data states (every data view handles all four)
Loading → skeleton/`LoadingScreen`; Empty → `EmptyState`; Error → `ErrorState` + Retry;
Offline → `OfflineBanner` + cached data. Reviewers reject screens handling only loading+success.

## Components to build (`components/ui/`)
- `InlineError` — under form fields (login, bus registration, route form, payout).
- `ErrorState` — full/compact error block with Retry (uses `userMessage`).
- `OfflineBanner` — driven by `subscribeBackendStatus`.
- `ErrorBoundary` — navigator-root crash fallback + Reload.
- Keep `OfflineScreen` for the cold-start-no-cache case.

## Driver-specific states
- **Tracking status indicator** (dashboard): clearly show `idle / starting / tracking /
  reconnecting(buffering) / error`. While tracking and offline, show "buffering — N queued",
  not a silent failure.
- **Location permission denied**: dedicated state explaining why location is needed + "Open
  Settings" action; tracking controls disabled until granted.
- **GPS/location services off**: actionable message.
- **Start-tracking ack failure**: `ErrorState` (kind `tracking`) with Retry; do not show the
  toggle as "on" if the backend didn't confirm.

## Form error pattern
Client validation first (`InlineError`); server `fields` → per-field inline; top-level →
form-level `ErrorState compact`. Submit buttons use mutation `isPending`.

## Global safety net
`ErrorBoundary` at root; toast utility for mutation success/failure (bus registered, route
created, payout requested, "couldn't start tracking — retry").

## Logging hygiene (production)
Today both `AuthContext` and `socket.js` log via `console.log` (incl. socket state, ids).
Gate behind `__DEV__` via `lib/logger.ts`; **never log token material**.

## Definition of done
- Every query-backed screen renders all four states.
- Tracking status is always unambiguous; offline-while-tracking shows buffering, not failure.
- Permission-denied + GPS-off have explicit, actionable UX.
- No raw server error rendered; everything via `userMessage`. No token logged.
