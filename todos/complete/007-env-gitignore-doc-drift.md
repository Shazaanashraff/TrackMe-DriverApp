# TODO 007 — .gitignore + .env.example + CLAUDE.md drift

**Phase:** 0 · **Priority:** P1 · **Depends on:** none
**Cite:** docs/SELF_CONTAINED_CHECKLIST.md; verified facts below

## Goal
Make the app self-contained and fix factual drift (driver-app is missing `.gitignore` AND
`.env.example`).

## Step-by-step
1. Create `driver-app/.gitignore`: `node_modules/`, `.expo/`, `dist/`, `web-build/`,
   `coverage/`, `.env`, `*.log`, `.DS_Store`, `ios/`, `android/` (if not committed), Maestro
   artifacts. Keep `.env.example` tracked.
2. Create `driver-app/.env.example` listing required keys: `EXPO_PUBLIC_API_HOST` (host the
   app points at; config builds `http://<host>:5000`). Add comments.
3. Fix `driver-app/CLAUDE.md`:
   - Environment section says `config.js exports API_BASE_URL` → it exports **`API_URL`** and
     **`SOCKET_URL`** (host from `EXPO_PUBLIC_API_HOST`/Expo host).
   - Note socket exports `emitLocation`/`startTracking`/`stopTracking` (not
     `startTrackingSession`).
   - Add pointer: "Architecture/testing plans in `docs/`; execution in `todos/`."
4. No code behavior change.

## Completion test
`todos/completion-tests/todo-007.sh` — `.gitignore` (ignores `.env`+node_modules) + `.env.example`
(has `EXPO_PUBLIC_API_HOST`) exist; CLAUDE.md contains `API_URL`, no longer `API_BASE_URL`.

## Blocked
