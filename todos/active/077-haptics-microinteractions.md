# TODO 077 — Haptics + micro-interactions

**Phase:** 7 · **Priority:** P3 · **Depends on:** 021
**Cite:** docs/UX_GUIDELINES.md (Micro-interactions)

## Step-by-step
1. `npm i expo-haptics`; `src/lib/haptics.ts` wrapper (success/warning/error/selection), no-op
   on web.
2. Fire haptics on: start tracking, stop tracking, payout request, form submit error.
3. Pull-to-refresh on lists (if not from 070).
4. Tests: wrapper calls the right Haptics API per type; no-ops on web. `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-077.sh` — `src/lib/haptics.ts` + `expo-haptics` dep exist;
tracking/payout paths call it; test green.

## Blocked
