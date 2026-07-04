# TODO 020 — Error UX + tracking/permission state components

**Phase:** 2 · **Priority:** P2 · **Depends on:** 002, 005
**Cite:** docs/ERROR_HANDLING.md (components + driver-specific states)

## Goal
Shared error/offline primitives + the driver-specific tracking-status and permission-denied
states every migrated screen uses.

## Step-by-step
1. `src/components/ui/InlineError.tsx` — red text under form fields; renders nothing if no msg.
2. `src/components/ui/ErrorState.tsx` — icon + title + `userMessage(error)` + Retry; `variant:
   'full'|'compact'`.
3. `src/components/ui/OfflineBanner.tsx` — driven by `subscribeBackendStatus`.
4. `src/components/ErrorBoundary.tsx` — root crash fallback + Reload; wrap navigator root.
5. `src/components/ui/TrackingStatusBadge.tsx` — shows `idle|starting|tracking|reconnecting|
   error` with colour + **icon + label** (never colour alone); driven by `useTrackingSession`
   status.
6. `src/components/PermissionDeniedState.tsx` — explains why location is needed + "Open
   Settings" (`Linking.openSettings`); used when `useLocationBroadcast` permission is denied.
7. Use `theme` + `userMessage`. Tests for each (states, Retry fires, offline toggle, badge per
   status, settings button). `typecheck` + `lint` + `test:unit`.

## Out of scope
Migrating screens (021–027).

## Completion test
`todos/completion-tests/todo-020.sh` — InlineError/ErrorState/OfflineBanner/ErrorBoundary/
TrackingStatusBadge/PermissionDeniedState exist; ErrorState refs userMessage; OfflineBanner refs
subscribeBackendStatus; tests green; typecheck+lint green.

## Blocked
