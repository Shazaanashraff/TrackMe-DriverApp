# Adding a feature — driver-app

The one loop for shipping a feature or a behaviour change in this app. It exists so that
**every feature lands with a doc, tests, and a change-log entry** — the three things that
otherwise rot. If you skip a step, the pre-push check will remind you.

> Prerequisite reading: [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (layering + TS policy),
> [`../DATA_LAYER.md`](../DATA_LAYER.md) (how data flows), and the
> [module doc](../modules/) for the area you're touching.

---

## 0. Orient (before writing code)

- Find the module. Use [`CLAUDE.md`](../../CLAUDE.md) → "Where to look". If your feature is a
  **new** module, copy [`_MODULE_TEMPLATE.md`](_MODULE_TEMPLATE.md) → `docs/modules/<NAME>.md`
  now and fill in §1–4 as your design sketch.
- Read the module doc's **Contracts** and **Change protocol** sections.
- Run that module's tests **green as a baseline** so you know what you break:
  `npm test` (unit + integration) and, if relevant, `npm run test:e2e:dry`.

## 1. Build in the standard direction

Always **screen → hook → api → client**, never the other way, and never add a second axios
instance:

| Layer | Where | Rule |
|---|---|---|
| Screen | `src/screens/*` | Thin: validation + navigation only. No fetch logic. |
| Feature UI | `src/features/<domain>/*` | Presentational + local interaction. |
| Hook | `src/hooks/<domain>/*` | TanStack Query. Own the query key (`qk.*`), cache policy, invalidations. Gate with `enabled: !!token` when it needs auth. |
| API fn | `src/services/api/*.ts` | One thin function per endpoint. **No token param** — `client.ts` attaches it. Public endpoints pass `{ skipAuth: true }`. |
| Transport | `src/services/api/client.ts` | Don't touch unless you're changing auth/refresh (then read [`../AUTH.md`](../modules/AUTH.md) first). |
| Realtime | `src/services/socket.js` | Bus updates only; bridge into cache per [`../DATA_LAYER.md`](../DATA_LAYER.md). |

- Reuse `components/ui/*` primitives; don't reinvent inputs/buttons/rows.
- Respect [`../ERROR_HANDLING.md`](../ERROR_HANDLING.md): loading / empty / error / offline are
  the four states every data screen must handle.

## 2. Test every changed behaviour

A change with no test is not done. Follow [`ADDING_A_TEST.md`](ADDING_A_TEST.md):
- **Unit** for new/changed helpers, hooks, components.
- **Integration** for any api/socket contract (URL, method, payload, status handling).
- **E2E (Maestro)** for a new or changed user journey.
- Add the traceability row in [`../TESTING_GUIDE.md`](../TESTING_GUIDE.md).

## 3. Update the docs (auto-update discipline)

- Update the **module doc** (`docs/modules/<NAME>.md`): key files, contracts, gotchas, tests,
  and the **Status** line.
- If you changed a cross-cutting assumption, update the relevant
  `ARCHITECTURE / DATA_LAYER / ERROR_HANDLING` doc too — [`../QA_UPDATE_TRIGGERS.md`](../QA_UPDATE_TRIGGERS.md)
  lists exactly what triggers which update.
- If you added a **new module**, add its row to [`CLAUDE.md`](../../CLAUDE.md) "Where to look"
  and to [`../README.md`](../README.md).

## 4. Green gate + log + push

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e:dry     # or run the affected Maestro flow
```
- Append a [`../CHANGES.md`](../CHANGES.md) entry (template at the top of that file).
- Push. The pre-push check ([`../../scripts/check-docs.mjs`](../../scripts/check-docs.mjs))
  warns if `src/` changed without a `CHANGES.md` entry or a touched module's doc.

---

### Definition of done
- [ ] Feature works, built screen→hook→api→client, no second axios instance.
- [ ] Four UI states handled (loading/empty/error/offline).
- [ ] Unit + integration + (E2E if a journey changed) tests added and green.
- [ ] `TESTING_GUIDE.md` row added/updated.
- [ ] Module doc updated (or created) incl. its Status line.
- [ ] `CHANGES.md` entry appended.
