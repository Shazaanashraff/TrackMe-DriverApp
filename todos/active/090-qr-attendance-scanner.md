# TODO 090 — QR Attendance: driver scanner (BOARD/ALIGHT)

**Phase:** 8 (NEXT version) · **Priority:** P3 · **Depends on:** 019 (offline pattern), 022 (dashboard)
**Cross-repo dependency:** requires **backend `001-qr-attendance-foundation`** (scan endpoint) to be
live. **Blocked until that ships.**
**Cite:** ../../docs/features/qr-attendance/QR_ATTENDANCE_PLAN.md (READ FULLY FIRST),
docs/ARCHITECTURE.md, docs/LOCATION_TRACKING.md (offline buffer pattern)

## Goal
Let the driver scan a student's QR pass in the shuttle to record boarding (BOARD) and alighting
(ALIGHT). Verified authoritatively by the backend; resilient to being briefly offline.

## Library
- **`expo-camera`** (add) — use `CameraView` with `barcodeScannerSettings={{ barcodeTypes:['qr'] }}`
  and `onBarcodeScanned`. (Do NOT use `expo-barcode-scanner`; it's deprecated in SDK 54.) Requires the
  camera permission flow (mirror the existing location-permission UX).

## Depends on (architecture)
- Screens never call `api.*`/`fetch(` directly — a `useBoardingScan` hook calls an endpoint fn through
  the transport (like the other data hooks). Reuse the offline queue + replay pattern from todo 019
  (`use-location-broadcast` / offline buffer) so scans made offline are queued and replayed; the server
  re-verifies on receipt.

## Step-by-step
1. `expo-camera` install + a **Scan** screen reachable from the active trip; request camera permission
   with a clear denied-state (reuse permission-state components from todo 020).
2. `onBarcodeScanned` → decode the QR string → `useBoardingScan` submits `{ token, type }` to
   `POST /api/driver/boarding/scan`. Infer `type` by toggling from this student's last event this trip,
   or offer explicit "Boarding / Alighting" mode.
3. Feedback: success (name + BOARD/ALIGHT + time), and clear failures (invalid, wrong-route,
   already-scanned/debounced). Debounce rapid re-scans on the client too.
4. **On-board roster:** show who's boarded this trip (from scan responses / a trip query); optional
   manual correct (mark alighted).
5. **Offline:** queue scans when offline, replay on reconnect (reuse todo 019's buffer); show a pending
   indicator. Server is the source of truth.
6. Tests: hook submits decoded token + type; success/failure states render; offline queue buffers +
   replays. Maestro e2e (dry-run ok): open scanner → (mock) scan → success. `lint` + `typecheck` +
   `test` green.

## Out of scope
QR generation/display (user-app 090). Attendance reports (web-admin 025). Backend verification
(backend 001).

## Completion test
`todos/completion-tests/todo-090.sh` — `expo-camera` in dependencies; a scan feature dir/screen exists
and imports a boarding hook; screen has no `api.`/`fetch(`; jest passes the boarding tests; typecheck +
lint green.

## Blocked
Until backend `001-qr-attendance-foundation` (scan endpoint) is live.
