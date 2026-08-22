# Releasing — driver-app

> ⚠️ **Release tooling is not set up in this repo yet.** Unlike `user-app`, driver-app has
> **no `eas.json`** and **no `expo-updates`** dependency. There is therefore currently:
> - no configured EAS build/submit profile,
> - **no OTA update path** — `expo-updates` is absent, so a JS-only fix cannot be pushed to
>   installed builds,
> - no `updates.url` / `runtimeVersion` policy in `app.json`.
>
> Do not copy user-app's release steps and assume they work here. **The first release task is to
> decide and record the delivery model**, then rewrite this guide.

---

## What exists today

| Thing | State |
|---|---|
| `package.json` version | `1.0.0` |
| Build tooling | Expo (SDK ~54) — `npm start` for dev only |
| EAS config | **absent** |
| OTA | **absent** (`expo-updates` not installed) |
| Git tag | the only versioning signal available right now |

## Release gates (apply regardless of delivery model)

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e:dry     # maestro test --dry-run .maestro
```
- [ ] All four green.
- [ ] [`CHANGES.md`](../CHANGES.md) has entries since the last tag.
- [ ] Every touched module's [`modules/*.md`](../modules/) doc + [`TESTING_GUIDE.md`](../TESTING_GUIDE.md) updated.
- [ ] **If GPS/socket behaviour changed**, [`LOCATION_TRACKING.md`](../LOCATION_TRACKING.md) is
      updated and the emit path was exercised on a real device. A regression here is invisible
      inside this app and surfaces as missing buses in `user-app`.
- [ ] Any socket contract change is reflected in
      [`backend/docs/modules/REALTIME.md`](../../../backend/docs/modules/REALTIME.md).

## To set this up (the actual next task)

1. Decide the delivery model — internal distribution vs store, and whether OTA is wanted.
2. If OTA: add `expo-updates`, set `runtimeVersion` + `updates.url` in `app.json`, and note that
   OTA only reaches builds on the **same runtimeVersion** — an SDK bump forces a full build.
3. Add `eas.json` with `development` / `preview` / `production` profiles. Mirror user-app's
   `appVersionSource: "remote"` + production `autoIncrement` unless there's a reason not to.
4. Rewrite this guide with the real commands and delete this section.

## Tagging (works today)

```bash
git tag -a v<version> -m "driver-app v<version>"
git push origin v<version>
```
Then roll `CHANGES.md` entries into [`CHANGELOG.md`](../../CHANGELOG.md) and sync the submodule
pointer in the umbrella repo.
