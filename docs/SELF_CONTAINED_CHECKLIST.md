# Driver App Self-Contained Checklist

The app must build, test, and document on its own (no cross-app deps).

## Docs & meta
- [x] README.md references docs/README.md.
- [x] docs/README.md indexes all plans + QA docs.
- [x] CLAUDE.md present with testing policy.
- [x] .github/copilot-instructions.md present.
- [ ] **.env.example present** (currently MISSING — Phase 0 TODO; list `EXPO_PUBLIC_API_HOST`).
- [ ] **.gitignore present in driver-app/** (currently MISSING — Phase 0 TODO; include `.env`).

## Tooling (Phase 0)
- [ ] tsconfig.json (allowJs, strict) + `typecheck`.
- [ ] ESLint + `lint` (layering rule: no `api.`/`fetch(`/`watchPositionAsync` in screens).
- [ ] Jest coverage thresholds + `test:unit`.
- [ ] Maestro `.maestro/` + `test:e2e`.

## Architecture (Phases 1–3, 7)
- [ ] TanStack Query provider + persister wired in app entry.
- [ ] No `api.`/`fetch(`/raw location/socket calls in `src/screens` or `src/features`.
- [ ] Error + tracking/permission UX components present.
- [ ] Location broadcasting extracted into services/hooks (LOCATION_TRACKING.md DoD).

## Verify
```bash
npm install && npm run lint && npm run typecheck && npm test
```
