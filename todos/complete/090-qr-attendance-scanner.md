# TODO 090 — QR Attendance: driver scanner (BOARD/ALIGHT)

**Phase:** 8 (NEXT version) · **Priority:** P3 · **Depends on:** 019 (offline pattern), 022 (dashboard)
**Cross-repo dependency:** backend `POST /api/driver/boarding/scan` (finalized, account-scoped —
gates purely on `route.qrEnabled`, no rider-route membership concept).

## Goal
Let the driver scan a student's QR pass in the shuttle to record boarding (BOARD) and alighting
(ALIGHT). Verified authoritatively by the backend; resilient to being briefly offline.

## What shipped
- **`expo-camera` (~17.0.8)** — `CameraView` with `barcodeScannerSettings={{ barcodeTypes:['qr'] }}`
  and `onBarcodeScanned`.
- `src/services/api/boarding.ts` — `submitBoardingScan(token, { qrToken, busId, type? })` →
  `POST /api/driver/boarding/scan`, exported from `src/services/api/index.ts`.
- `src/features/boarding/useBoardingScan.ts` — `useBoardingScan(busId)` hook:
  - State: `status` (`idle|scanning|success|error|debounced`), `lastResult`, `errorMessage`,
    `pendingCount`.
  - `submitScan(qrToken, type?)` calls the endpoint via `authenticatedRequest`, maps
    401/403/404 to friendly copy, and applies a 3s client-side cooldown between scans.
  - Offline queue: on a network-layer failure (`AppError.kind === 'offline'`), the pending scan
    is persisted to AsyncStorage (`boarding_scan_queue`) and `pendingCount` increments.
    `replayQueuedScans()` resubmits queued scans in order and drops each on success (or on a
    non-offline error, since the backend's debounce endpoint is idempotent for near-duplicate
    replays); still-offline items stay queued. Auto-triggered via `subscribeBackendStatus`.
- `src/screens/QRScannerScreen.tsx` — requests camera permission on mount (local
  `CameraPermissionDeniedState`, since `PermissionDeniedState.tsx` is location-specific);
  renders `CameraView` with a viewfinder overlay and a bottom feedback banner
  (success/debounced/error); guards `onBarcodeScanned` at the screen level (a lock ref) on top
  of the hook's own cooldown so a still-visible code isn't scanned repeatedly. No `api.`/`fetch(`
  in the screen — only the hook.
- Navigation: registered as a pushed root-stack screen (`QRScanner`) alongside `BusRegistration`/
  `RouteManagement` in `src/navigation/AppNavigator.js`.
- Entry point: a `ListRow` ("Scan rider QR") in `DriverDashboard.tsx` between `VehicleCard` and
  `CustomRouteSection`, enabled only when `bus` is truthy, navigates to
  `QRScanner` with `{ busId }`.
- `src/components/ui/ListRow.d.ts` added (first TSX consumer of the previously-untyped
  `ListRow.js`).

## Deviations from the original plan
- **No on-board roster / manual correction UI** (step 4 of the original plan) — out of scope for
  this pass; not required by the finalized backend contract or the MVP ask. Can be a follow-up
  todo if needed.
- **No explicit BOARD/ALIGHT override control** — the backend auto-toggles based on the rider's
  last event; `type` is supported in the API/hook signature but unused by the screen (MVP).
- Backend is **account-scoped**, not membership-scoped as the original plan assumed — there is no
  rider-route relationship check on the client side; the server's `route.qrEnabled` gate is the
  only authorization surface, surfaced via the 403 friendly message.

## Tests
- `src/features/boarding/__tests__/useBoardingScan.test.ts` — success/debounced/401/403/404
  mapping, offline queueing + `pendingCount`, `replayQueuedScans` resubmit-and-clear, auto-replay
  on backend-online, cooldown gating.
- `src/screens/__tests__/QRScannerScreen.test.tsx` — permission-denied state, camera render,
  `onBarcodeScanned` → `submitScan`, success/debounced/error feedback rendering.
- `.maestro/qr-scan.yaml` — dry-run-safe flow (launch → login → tap "Scan rider QR" → assert
  scanner screen visible).

All green: `npm test` (58 suites / 366 tests), `npm run typecheck`, `npm run lint` (0 errors).

## Out of scope
On-board roster + manual correction. QR generation/display (user-app 090). Attendance reports
(web-admin 025).

## Completion test
`todos/completion-tests/todo-090.sh` — `expo-camera` in dependencies; a scan feature dir/screen
exists and imports a boarding hook; screen has no `api.`/`fetch(`; jest passes the boarding
tests; typecheck + lint green.

## Blocked
(none — shipped)
