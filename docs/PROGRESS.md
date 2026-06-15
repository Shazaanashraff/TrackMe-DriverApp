# Driver App Progress

> Tracks **driver-app** work only. Execution driven by `todos/todo-list.md`. Backend tasks
> live in `backend/docs/`, not here.

## Planning (docs)
| # | Task | Status | Notes |
|---|---|---|---|
| P1 | Audit code vs old docs | DONE | drift: parseResponse drops `code`; API_URL; GPS in 657-LOC dashboard; missing .env/.gitignore/e2e |
| P2 | ARCHITECTURE.md | DONE | layering + folder tree + LOC budget |
| P3 | DATA_LAYER.md | DONE | TanStack Query (auth/bus/routes/earnings) |
| P4 | LOCATION_TRACKING.md | DONE | hero: socket/session/broadcast, battery, offline buffer, permissions |
| P5 | ERROR_HANDLING.md | DONE | taxonomy + permission/tracking kinds + 4 states |
| P6 | IMPLEMENTATION_GUIDE.md | DONE | recipe + completion-test definition |
| P7 | Rewrite RESTRUCTURE + test plans + TESTING_GUIDE | DONE | accurate; Maestro for E2E |
| P8 | OPTIMISATION.md + UX_GUIDELINES.md | DONE | battery/background/buffer + driver UX |
| P9 | QA triggers + checklist refreshed | DONE | .env/.gitignore gaps flagged |
| P10 | todos/ infra + backlog | DONE | routine adapted from Wholesale workflow |
| P11 | Detailed TODO files authored | IN PROGRESS | Phase 0/1 first, then 2–7 |

## Execution phases (see todos/todo-list.md)
| Phase | Theme | Priority | Status |
|---|---|---|---|
| 0 | Foundation (TS, jest, eslint, aliases, errors, maestro, env/gitignore, helpers) | P1 | pending |
| 1 | Data layer + tracking (provider, transport, hooks, socket, session, broadcast) | P1 | pending |
| 2 | UI restructure + error/tracking UX | P2 | pending |
| 4 | Unit tests | P2/P3 | pending |
| 5 | Integration (REST + socket contract) | P3 | pending |
| 6 | E2E (Maestro) | P3 | pending |
| 7 | Optimisation + UX (battery, background, buffer, a11y) | P2/P3 | pending |
