# TODO 025 — Split BusRegistrationScreen

**Phase:** 2 · **Priority:** P2 · **Depends on:** 014, 015, 020
**Cite:** docs/ARCHITECTURE.md, docs/ERROR_HANDLING.md

## Step-by-step
1. Extract into `src/features/bus-registration/`: `BusRegistrationForm` (plate/model/etc.),
   `RoutePicker` (search + select from `useRoutesQuery`/management).
2. Screen uses `useRegisterBus` (todo 014) + a routes hook (015); owns nav.
3. Client validation + `InlineError`; server field mapping (duplicate plate, invalid route);
   success → assigned-bus view. Four states.
4. Behavior-preserving. No `api.`/`fetch(` in screen. Screen ≤250 LOC.
5. Tests: form validation + submit; RoutePicker select callback. `typecheck` + `lint` +
   `test:unit`.

## Completion test
`todos/completion-tests/todo-025.sh` — bus-registration feature files exist; screen imports
`useRegisterBus`; no `api.`/`fetch(`; LOC ≤250; tests green; typecheck+lint green.

## Blocked
