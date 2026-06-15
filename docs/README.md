# Driver App Docs Index

Senior-architect docs that the execution TODOs (`../todos/`) cite. Read top-to-bottom.

## Design (source of truth)
- **ARCHITECTURE.md** — folder structure, layering, LOC budget, TS policy.
- **DATA_LAYER.md** — TanStack Query: transport, endpoint fns, hooks, caching, offline.
- **LOCATION_TRACKING.md** — the hero feature: socket/session/broadcast, battery, offline
  buffer, permissions, background tracking.
- **ERROR_HANDLING.md** — error taxonomy (+ permission/tracking kinds), 4 UI states.
- **RESTRUCTURE_PLAN.md** — why + ordered what for Phases 0–2, 7.

## Execution
- **IMPLEMENTATION_GUIDE.md** — how to do each TODO type + verify + completion-test definition.
- **../todos/todo-list.md** — the live backlog.
- **../todos/ROUTINE.md** — how the routine picks and ships one TODO.

## Testing
- **TEST_PLAN_UNIT.md**, **TEST_PLAN_INTEGRATION.md** (REST + socket contract),
  **TEST_PLAN_E2E.md** (Maestro), **TESTING_GUIDE.md** (traceability),
  **QA_UPDATE_TRIGGERS.md**.

## Optimisation & UX (Phase 7)
- **OPTIMISATION.md** — battery/location batching, background tracking, offline GPS buffer,
  lists, bundle.
- **UX_GUIDELINES.md** — driver UX: big tracking control, unambiguous status, permissions,
  earnings clarity, accessibility.

## Status
- **PROGRESS.md** — phase rollup (driver-app only).
- **SELF_CONTAINED_CHECKLIST.md** — standalone-readiness.

> Canonical backend integration/CRUD matrix: `../../backend/docs/TEST_PLAN_INTEGRATION.md`.
