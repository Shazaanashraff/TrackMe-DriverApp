# TODO 002 — Jest TS + coverage + test:unit

**Phase:** 0 · **Priority:** P1 · **Depends on:** 001
**Cite:** docs/TEST_PLAN_UNIT.md, docs/IMPLEMENTATION_GUIDE.md (type A/F)

## Goal
Run TS tests under jest-expo, add `test:unit`, set coverage thresholds; keep the two existing
JS tests green.

## Step-by-step
1. Ensure TS transform works under jest-expo (babel preset handles TS; else add
   `@babel/preset-typescript`).
2. `package.json` jest block: `moduleFileExtensions:["ts","tsx","js","jsx","json"]`;
   `setupFilesAfterEach`→`setupFilesAfterEnv:["<rootDir>/jest.setup.js"]` (create minimal);
   `collectCoverageFrom:["src/**/*.{js,jsx,ts,tsx}","!src/**/__tests__/**"]`;
   `coverageThreshold.global:{lines:60,branches:50}` (raise as test todos land).
3. Scripts: `"test:unit":"jest"`, `"test:coverage":"jest --coverage"` (keep `"test":"jest"`).
4. Add `src/lib/__tests__/_smoke.test.ts` (`expect(true).toBe(true)`).
5. `npm run test:unit` green.

## Completion test
`todos/completion-tests/todo-002.sh` — test:unit + coverageThreshold present; a `.ts` test
runs; `npm run test:unit` exits 0.

## Blocked
