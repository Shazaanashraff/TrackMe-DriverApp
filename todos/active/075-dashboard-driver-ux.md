# TODO 075 — Dashboard driver UX

**Phase:** 7 · **Priority:** P2 · **Depends on:** 022
**Cite:** docs/UX_GUIDELINES.md (Dashboard, Principles)

## Goal
Make the tracking dashboard glanceable + safe to use while working (Uber Driver "Go online"
quality).

## Step-by-step
1. Make Start/Stop a large, high-contrast, thumb-reachable control with an `accessibilityLabel`;
   clear pressed/disabled states.
2. Prominent status card: status badge (colour + icon + label), session duration, "updated Xs
   ago", offline buffering count.
3. `expo-keep-awake` active while tracking (if not already from 072); **confirm dialog before
   stopping** an active session.
4. Large fonts; minimise interactions on this screen.
5. Tests: stop shows confirm; status card renders the fields; keep-awake toggles. `typecheck` +
   `test:unit`.

## Completion test
`todos/completion-tests/todo-075.sh` — dashboard refs keep-awake + a confirm-on-stop + status
fields; tests green.

## Blocked
