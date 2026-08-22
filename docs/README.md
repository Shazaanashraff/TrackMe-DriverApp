# Driver App Docs Index

The documentation map for driver-app. [`../CLAUDE.md`](../CLAUDE.md) routes you here.
**Modules** = "how does feature X work". **Guides** = "how do I do task Y".

> New module docs start from [`guides/_MODULE_TEMPLATE.md`](guides/_MODULE_TEMPLATE.md).
> House style: terse, senior-engineer, per-file "one job" tables.

## The hero feature
- **[LOCATION_TRACKING.md](LOCATION_TRACKING.md)** — GPS watch, emit throttling, duty state, and
  the socket path. **Read this before touching anything location-related.** A regression here is
  invisible in this app and surfaces as missing buses in `user-app`.

## Modules (per feature)
All currently **stubs** — each names its source files and must be filled in by the next change
touching it:
[AUTH](modules/AUTH.md) · [DASHBOARD](modules/DASHBOARD.md) · [BOARDING](modules/BOARDING.md) ·
[BUS_REGISTRATION](modules/BUS_REGISTRATION.md) · [ROUTE_MANAGEMENT](modules/ROUTE_MANAGEMENT.md) ·
[EARNINGS](modules/EARNINGS.md) · [TRIP_HISTORY](modules/TRIP_HISTORY.md) ·
[PROFILE](modules/PROFILE.md) · [OFFLINE_STATUS](modules/OFFLINE_STATUS.md)

## Guides
- **[guides/ADDING_A_FEATURE.md](guides/ADDING_A_FEATURE.md)** — the ship-a-feature loop.
- **[guides/ADDING_A_TEST.md](guides/ADDING_A_TEST.md)** — which layer, plus the GPS/socket cases.
- **[guides/RELEASING.md](guides/RELEASING.md)** — ⚠️ release tooling is **not set up yet**; read before assuming.
- **[guides/WORKING_AN_ISSUE.md](guides/WORKING_AN_ISSUE.md)** — issue → regression tests → PR →
  merge, for agents and manual sessions alike.
- **[guides/_MODULE_TEMPLATE.md](guides/_MODULE_TEMPLATE.md)** — copy to start a module doc.

## Architecture (cross-cutting)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** · **[DATA_LAYER.md](DATA_LAYER.md)** ·
  **[ERROR_HANDLING.md](ERROR_HANDLING.md)** · **[OPTIMISATION.md](OPTIMISATION.md)** ·
  **[UX_GUIDELINES.md](UX_GUIDELINES.md)** · **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)**
- **[RESTRUCTURE_PLAN.md](RESTRUCTURE_PLAN.md)** — historical plan.

## Design
- **[redesign/SIGNAL_INK_PLAN.md](redesign/SIGNAL_INK_PLAN.md)** · **[redesign/STYLEGUIDE.md](redesign/STYLEGUIDE.md)**

## Testing
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** — traceability table.
- **[QA_UPDATE_TRIGGERS.md](QA_UPDATE_TRIGGERS.md)** — when to update tests + docs.
- **[TEST_PLAN_UNIT.md](TEST_PLAN_UNIT.md)** / **[TEST_PLAN_INTEGRATION.md](TEST_PLAN_INTEGRATION.md)** / **[TEST_PLAN_E2E.md](TEST_PLAN_E2E.md)**

## Status & log
- **[CHANGES.md](CHANGES.md)** — session log (write before every push).
- **[../CHANGELOG.md](../CHANGELOG.md)** · **[PROGRESS.md](PROGRESS.md)** · **[SELF_CONTAINED_CHECKLIST.md](SELF_CONTAINED_CHECKLIST.md)**
- **Enforcement:** [`../scripts/check-docs.mjs`](../scripts/check-docs.mjs) + `.githooks/pre-push`.
  Enable with `git config core.hooksPath .githooks`.

> Canonical backend integration/CRUD matrix: `../../backend/docs/TEST_PLAN_INTEGRATION.md`.
