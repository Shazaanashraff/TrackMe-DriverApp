# TODO 006 — Maestro E2E setup

**Phase:** 0 · **Priority:** P1 · **Depends on:** none
**Cite:** docs/TEST_PLAN_E2E.md (setup)

## Step-by-step
1. `.maestro/README.md`: document install (`curl -Ls "https://get.maestro.mobile.dev" | bash`;
   Windows via WSL), `MAESTRO_APP_ID`, emulator run. CLI is a dev tool, not an npm dep.
2. `.maestro/smoke.yaml`: `appId: ${MAESTRO_APP_ID}` / `--- ` / `- launchApp` /
   `- assertVisible: ".*"` (replace with Login's first stable text/testID).
3. Scripts: `"test:e2e":"maestro test .maestro"`, `"test:e2e:dry":"maestro test --dry-run .maestro"`.
4. Verify `maestro test --dry-run .maestro` parses (or document manual-verify if Maestro
   unavailable here).

## Completion test
`todos/completion-tests/todo-006.sh` — `.maestro/smoke.yaml` + README exist; test:e2e +
test:e2e:dry scripts exist; smoke has launchApp.

## Blocked
