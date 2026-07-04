# TODO 022 — Split DriverDashboard (the hero screen)

**Phase:** 2 · **Priority:** P2 · **Depends on:** 014, 018, 019, 020
**Cite:** docs/ARCHITECTURE.md (LOC budget), docs/LOCATION_TRACKING.md, docs/ERROR_HANDLING.md

## Goal
Break the 657-LOC dashboard into `features/dashboard/*`, move **all** tracking/GPS logic into
the hooks (018/019), and get the screen ≤250 LOC. Highest-value UI todo.

## Step-by-step
1. Extract into `src/features/dashboard/`:
   - `TrackingToggle` (the big start/stop control), `TrackingStatusCard` (uses
     `TrackingStatusBadge` + session duration + last-fix time + buffering indicator),
     `AssignedBusCard` (from `useMyBusQuery`), `LiveStatsBar`.
2. Screen composes: `useMyBusQuery` → `useTrackingSession` → while tracking,
   `useLocationBroadcast`. **No `watchPositionAsync`, no `emitLocation`, no `api.` in the
   screen** — all via hooks.
3. Render states: loading (bus), error (`ErrorState`), offline (`OfflineBanner`), permission
   denied (`PermissionDeniedState`), tracking status always visible.
4. Behavior-preserving: same start/stop tracking behavior and location broadcasting.
5. Screen ≤250 LOC. Tests: TrackingToggle fires start/stop; TrackingStatusCard renders per
   status; AssignedBusCard renders bus. `typecheck` + `lint` + `test:unit`.

## Out of scope
Battery/background/buffer optimisation (Phase 7: 071/072/073); dashboard UX polish (075).

## Completion test
`todos/completion-tests/todo-022.sh` — dashboard feature files exist; screen imports
`useTrackingSession`; no `api.`/`fetch(`/`watchPositionAsync`/`emitLocation` in the screen; LOC
≤250; tests green; typecheck+lint green.

## Blocked
