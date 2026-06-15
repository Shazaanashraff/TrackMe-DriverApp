# TODO 003 — ESLint + layering rule

**Phase:** 0 · **Priority:** P1 · **Depends on:** 001
**Cite:** docs/ARCHITECTURE.md (layering), docs/IMPLEMENTATION_GUIDE.md (type A)

## Goal
ESLint + `lint`; guard that screens/features never import api/transport, call `fetch(`, or run
`watchPositionAsync`/socket emits directly.

## Step-by-step
1. `npm i -D eslint eslint-config-expo @typescript-eslint/parser @typescript-eslint/eslint-plugin`.
2. `.eslintrc.js` extends `expo` + `@typescript-eslint/recommended`; TS parser; jest env.
3. `overrides` for `src/screens/**` + `src/features/**`: `no-restricted-imports` for
   `**/services/api*` and `**/services/socket*`/`**/services/location*`; `no-restricted-syntax`
   for `CallExpression[callee.name='fetch']` and
   `CallExpression[callee.property.name='watchPositionAsync']`.
4. Scripts: `"lint"`, `"lint:fix"`; add `.eslintignore` (node_modules,.expo,dist,coverage).
5. Set the layering rules to **warn** for now (screens still call api.* until Phase 2); a Phase
   2 todo flips to error. `npm run lint` exits 0.

## Out of scope
Migrating screens; flipping rule to error.

## Completion test
`todos/completion-tests/todo-003.sh` — eslintrc + lint script exist; layering restriction
present (grep); `npm run lint` exits 0.

## Blocked
