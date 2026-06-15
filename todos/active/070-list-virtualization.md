# TODO 070 — List virtualization

**Phase:** 7 · **Priority:** P2 · **Depends on:** 023, 026
**Cite:** docs/OPTIMISATION.md (Lists)

## Step-by-step
1. Earnings history + trip history lists use `FlatList` with `keyExtractor`, `getItemLayout`,
   `windowSize`, `removeClippedSubviews`, `maxToRenderPerBatch`.
2. Memoize row components (`React.memo`) + stable `useCallback` handlers; no inline funcs in
   `renderItem`. Pull-to-refresh → `refetch`.
3. Tests: rows memoized; list passes getItemLayout/keyExtractor. `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-070.sh` — getItemLayout + keyExtractor present in earnings/history
lists; rows use `React.memo`; tests green.

## Blocked
