# TODO 021 — Migrate LoginScreen (role-gate + hooks)

**Phase:** 2 · **Priority:** P2 · **Depends on:** 013, 020
**Cite:** docs/DATA_LAYER.md, docs/ERROR_HANDLING.md (form errors)

## Step-by-step
1. Replace direct `api.login`/`authenticatedRequest` with `useLogin` (todo 013), which enforces
   the **driver role-gate** (non-driver rejected with a friendly message).
2. Client validation (empty email, password length) → `InlineError`; server error → form-level
   `ErrorState compact` via `userMessage`. Submit button uses mutation `isPending`.
3. Behavior-preserving navigation (success → dashboard; non-driver → stays + error).
4. Remove dead api code; no `api.`/`fetch(` left in the screen.
5. Tests: invalid input blocked; non-driver shows role error; valid calls useLogin.
   `typecheck` + `lint` + `test:unit`.

## Completion test
`todos/completion-tests/todo-021.sh` — LoginScreen imports `useLogin` + InlineError; no
`api.`/`fetch(`; a test runs green; typecheck+lint green.

## Blocked
