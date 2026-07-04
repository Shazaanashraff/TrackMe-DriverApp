# TODO 004 — Path aliases + folders

**Phase:** 0 · **Priority:** P1 · **Depends on:** 001
**Cite:** docs/ARCHITECTURE.md (folder structure)

## Step-by-step
1. `npm i -D babel-plugin-module-resolver`; in `babel.config.js` add it with `root:['./src']`,
   alias `"@":"./src"`.
2. tsconfig: `baseUrl:"."`, `paths:{"@/*":["src/*"]}`.
3. Create skeleton dirs (+`.gitkeep`): `src/lib`, `src/app`, `src/services/api`,
   `src/hooks/{auth,bus,routes,earnings}`, `src/features/{dashboard,earnings,route-management,
   bus-registration}`.
4. Add `src/lib/_alias_probe.ts` (`export const ALIAS_OK=true`) and import via `@/lib/_alias_probe`
   in a tiny test. `npm run test:unit` + `npm run typecheck`.

## Completion test
`todos/completion-tests/todo-004.sh` — module-resolver in babel, `@/*` in tsconfig, skeleton
dirs exist, aliased import type-checks + runs.

## Blocked
