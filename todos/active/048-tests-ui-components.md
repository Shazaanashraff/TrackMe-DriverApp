# TODO 048 — Unit tests: remaining UI components

**Phase:** 4 · **Priority:** P3 · **Depends on:** 002
**Cite:** docs/TEST_PLAN_UNIT.md (UI Components)

## Step-by-step
Add render/interaction tests for currently-untested components: ScreenHeader (title + back),
InfoRow (label/value), SectionCard (title + children), ShiftBusIcon (renders), OfflineScreen
(messaging). Extend the existing `components/ui/__tests__/components.test.js`. `npm run test:unit`.

## Completion test
`todos/completion-tests/todo-048.sh` — tests reference ScreenHeader, InfoRow, SectionCard,
ShiftBusIcon, OfflineScreen; `npx jest components` green.

## Blocked
