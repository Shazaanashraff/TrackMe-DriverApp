# TODO 027 — Migrate DriverProfileScreen

**Phase:** 2 · **Priority:** P2 · **Depends on:** 014, 020
**Cite:** docs/DATA_LAYER.md

## Step-by-step
1. Replace direct `api.getMyBus`/`authenticatedRequest` with `useMyBusQuery` (todo 014) +
   `useAuth` for the user; use `InfoRow`/`SectionCard` (existing).
2. Four states; logout via `useLogout` (todo 013).
3. Behavior-preserving (small screen, 108 LOC). No `api.`/`fetch(` left.
4. Tests: renders profile + bus info; logout fires. `typecheck` + `lint` + `test:unit`.

## Completion test
`todos/completion-tests/todo-027.sh` — DriverProfileScreen imports `useMyBusQuery`/`useLogout`;
no `api.`/`fetch(`; test green; typecheck+lint green.

## Blocked
