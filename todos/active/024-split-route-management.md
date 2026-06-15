# TODO 024 — Split RouteManagementScreen

**Phase:** 2 · **Priority:** P2 · **Depends on:** 015, 020
**Cite:** docs/ARCHITECTURE.md, docs/ERROR_HANDLING.md

## Step-by-step
1. Extract into `src/features/route-management/`: `RouteForm` (create; validation),
   `RouteList`, `RouteListItem`.
2. Screen uses `useRoutesManagementQuery` + `useCreateRoute` (todo 015); owns nav.
3. Four states; client validation + `InlineError`; success feedback on create.
4. Behavior-preserving. No `api.`/`fetch(` in screen. Screen ≤250 LOC.
5. Tests: RouteForm validation + submit; RouteList renders. `typecheck` + `lint` + `test:unit`.

## Completion test
`todos/completion-tests/todo-024.sh` — route-management feature files exist; screen imports a
routes hook; no `api.`/`fetch(`; LOC ≤250; tests green; typecheck+lint green.

## Blocked
