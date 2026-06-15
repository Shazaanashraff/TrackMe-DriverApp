# TODO 078 — Accessibility pass

**Phase:** 7 · **Priority:** P2 · **Depends on:** 022, 023, 025
**Cite:** docs/UX_GUIDELINES.md (Accessibility)

## Goal
WCAG AA / RN a11y basics across the main flows — especially the tracking control.

## Step-by-step
1. `accessibilityLabel` + `accessibilityRole` on all interactive elements in migrated
   screens/features (login, dashboard incl. **the Start/Stop control**, earnings,
   bus-registration, route-management).
2. Touch targets ≥ 44×44; fix any colour-only state (tracking status must have icon+label).
3. Dynamic font scaling doesn't break layouts; check contrast vs `theme`.
4. Tests: key buttons (esp. tracking control) expose role/label (query by a11y role in RTL).
   `typecheck` + `lint` + `test:unit`.

## Completion test
`todos/completion-tests/todo-078.sh` — a11y tests query by role/label; `accessibilityLabel`
added across migrated features (≥3 files); green.

## Blocked
