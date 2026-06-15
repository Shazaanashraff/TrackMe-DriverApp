# TODO 074 — Skeleton loaders

**Phase:** 7 · **Priority:** P3 · **Depends on:** 020
**Cite:** docs/UX_GUIDELINES.md, docs/ERROR_HANDLING.md (loading state)

## Step-by-step
1. `src/components/ui/Skeleton.tsx` (shimmer block) + composites for an earnings row + a stats
   card.
2. Replace spinner-only loading on earnings, trip history, and the dashboard cards with
   skeletons; keep `LoadingScreen` for full-screen blocking only.
3. Tests: Skeleton renders; screens show skeleton when loading. `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-074.sh` — `Skeleton.tsx` exists; earnings/history screens import a
skeleton; test green.

## Blocked
