# TODO 010 — TanStack Query provider + persister

**Phase:** 1 · **Priority:** P1 · **Depends on:** 001, 002, 004
**Cite:** docs/DATA_LAYER.md (QueryClient defaults, offline persistence)

## Step-by-step
1. `npm i @tanstack/react-query @tanstack/react-query-persist-client @tanstack/query-async-storage-persister`.
2. `src/app/queryClient.ts` with DATA_LAYER.md defaults (retry skips offline, staleTime 30s,
   `networkMode:'offlineFirst'`, `refetchOnWindowFocus:false`).
3. AsyncStorage persister; `shouldDehydrateQuery` persists only `bus`/`routes`/`earnings`
   prefixes; `maxAge` 24h.
4. Wire providers in app entry (`App.js`; or new `src/app/App.tsx` keeping entry working).
   Order: `PersistQueryClientProvider` → `AuthProvider` → existing navigation; keep
   backendStatus + font/splash wiring intact.
5. On `logout`, `queryClient.clear()` (coordinate with AuthContext; note for todo 013).
6. Provider-renders test (mock AsyncStorage). `typecheck` + `test:unit`.

## Completion test
`todos/completion-tests/todo-010.sh` — deps installed; `src/app/queryClient.ts` has
`offlineFirst` + persister; app entry imports a Query provider; typecheck+unit green.

## Blocked
