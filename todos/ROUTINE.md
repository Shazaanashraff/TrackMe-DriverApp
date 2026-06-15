# Driver App TODO Routine

You are the daily TODO routine for the **driver-app** (TrackMe driver app). Follow this file
and `todos/CLAUDE.md` exactly. Do **ONE** todo this run, then stop. All commands run from
`driver-app/`.

1. **Pre-flight:** `git status` clean and up to date with `origin/main` (`git fetch`; work
   from latest `main`). Dirty tree → **stop and report**.

2. **DEDUP FIRST:**
   - `gh pr list --state open --json number,title,headRefName`
   - `git ls-remote --heads origin 'todo/*'`
   - Any todo with an open PR OR an existing `todo/NNN-slug` origin branch is **IN FLIGHT —
     skip it.** Also skip todos already in `todos/complete/` on main.

3. **Pick:** from `todos/todo-list.md`, the FIRST not-skipped, unchecked, non-blocked row
   whose `Depends on` are all `[x]`, by priority P1 → P2 → P3 then lowest number. None
   eligible → report and **stop.**

4. **Implement:** branch `todo/NNN-slug` off `main`. Read `todos/active/NNN-slug.md` fully +
   **every doc it cites** (ARCHITECTURE, DATA_LAYER, LOCATION_TRACKING, ERROR_HANDLING,
   IMPLEMENTATION_GUIDE, the relevant test plan). Implement *Step-by-step* exactly; honour
   *Out of scope*; never redesign. Guardrails (CLAUDE.md): screens never call `api.*` or run
   location/socket logic; keep `api` export stable; behavior-preserving UI; write the
   feature's own tests.

5. **Blocked by a genuine unknown** (backend payload/ack shape, server `code`,
   background-tracking product decision): **STOP** — write it into the todo's `## Blocked`,
   commit nothing functional, no PR, report.

6. **Verify** (all green; never weaken a test): `npm run lint`, `npm run typecheck`,
   `npm test`, `bash todos/completion-tests/todo-NNN.sh`; E2E todos: `npm run test:e2e` (or
   `maestro test --dry-run`).

7. **Close-out ON THE BRANCH:** `git mv todos/active/NNN-slug.md todos/complete/NNN-slug.md`;
   tick the `todo-list.md` row (`[ ]`→`[x]`, add `done: YYYY-MM-DD <sha>`); update
   `docs/PROGRESS.md` if a phase completes; Conventional Commit `feat(todo-NNN): <summary>`.

8. **Push** `todo/NNN-slug`, open PR `todo-NNN: <slug>` confirming lint/typecheck/test/
   completion green. **Do NOT self-merge.**

9. **Stop.** One todo handled. Report the PR link (or blocked / none-eligible reason).
