# TODO 001 — TypeScript config (incremental)

**Phase:** 0 · **Priority:** P1 · **Depends on:** none
**Cite:** docs/ARCHITECTURE.md (TS policy), docs/IMPLEMENTATION_GUIDE.md (type A)

## Goal
Add TypeScript in `allowJs` mode + a `typecheck` script. No file conversions here.

## Step-by-step
1. `npm i -D typescript @types/react @types/react-native` (versions compatible with RN 0.81 /
   React 19).
2. `tsconfig.json`: `allowJs:true`, `checkJs:false`, `strict:true`, `jsx:"react-native"`,
   `esModuleInterop:true`, `skipLibCheck:true`, `noEmit:true`, `moduleResolution:"bundler"`
   (or `"node"`); `include: ["src","App.js","index.js"]` (match actual entry files).
3. Add a tiny typed `src/lib/__typecheck_probe.ts` (`export const TS_OK: boolean = true`).
4. `package.json` script: `"typecheck": "tsc --noEmit"`. Run it — must pass.

## Out of scope
Converting `.js`; eslint/jest/aliases (separate todos).

## Completion test
`todos/completion-tests/todo-001.sh` — tsconfig has allowJs+strict, typecheck script exists,
`npm run typecheck` exits 0.

## Blocked
