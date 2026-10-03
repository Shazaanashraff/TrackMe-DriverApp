# Releasing — driver-app

> ⚠️ **OTA (JS-bundle updates) is still not set up.** `eas.json` now exists (mirrors user-app's
> `development` / `preview` / `production` profiles, `appVersionSource: "remote"`, production
> `autoIncrement`), so an EAS build/submit is possible. There is still:
> - **no OTA update path** — `expo-updates` is absent, so a JS-only fix cannot be pushed to
>   installed builds,
> - no `updates.url` / `runtimeVersion` policy in `app.json`.
>
> Do not assume OTA works here just because user-app has it. **The remaining release task is to
> decide whether OTA is wanted**, then update this guide.
>
> **This is separate from native-binary update checking, which IS now done.** See
> [`../modules/APP_UPDATES.md`](../modules/APP_UPDATES.md): the app checks
> `GET /api/app-releases/latest?app=driver&platform=android` on mount (Android only) and, if a
> newer `versionCode` is published, offers an in-app APK download + OS-install-intent flow via
> `useAppUpdateCheck` / `UpdateAvailableBanner`. That mechanism ships a whole new native binary
> through a normal Android package install (with the OS's own confirmation dialog); it does not
> touch the JS bundle and is not a substitute for OTA. iOS has no equivalent in-app UI — see that
> doc's §5 for why.

---

## What exists today

| Thing | State |
|---|---|
| `package.json` version | `1.0.0` |
| Build tooling | Expo (SDK ~54) — `npm start` for dev only |
| EAS config | `eas.json` present — `development`/`preview`/`production` build profiles, `submit.production` |
| Android package | `com.TrackMe.driverapp` (set 2026-09-14 — was the Expo default `com.anonymous.driverapp`; **confirm before the first Play Console upload**, it cannot change after) |
| OTA (JS-bundle) | **absent** (`expo-updates` not installed) |
| Native-binary update check (Android) | **shipped** — [`../modules/APP_UPDATES.md`](../modules/APP_UPDATES.md). Each build's `android.versionCode` must be published to the backend's `app-releases` collection for the in-app banner to find it; a build with no matching release record simply shows no banner (fails open, not an error). |
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

1. Decide whether OTA is wanted (internal distribution vs. store already works via `eas build`
   without it).
2. If OTA: add `expo-updates`, set `runtimeVersion` + `updates.url` in `app.json`, and note that
   OTA only reaches builds on the **same runtimeVersion** — an SDK bump forces a full build.
3. ~~Add `eas.json`~~ — done 2026-09-14, mirroring user-app.
4. Rewrite this guide with the real commands and delete this section.

## Before the first store submission

- [ ] Confirm the Android `package` (`com.TrackMe.driverapp`) — irreversible after the first
      Play Console upload.
- [ ] Set up signing credentials (`eas credentials`) — none exist yet.
- [ ] Write and host a privacy policy (required by Play Console — this app uses background
      location + camera). None exists in this repo yet.
- [ ] Produce store-listing graphics (screenshots, feature graphic). None exist in this repo yet.
- [ ] `EXPO_PUBLIC_API_URL` in `eas.json`'s `production` profile points at
      `https://bus-tracking-backend.onrender.com` — confirm that Render service is un-suspended
      before building (see backend's `render.yaml`; audit note `AUDIT_2026-08-17/AUDIT.md` S1-1).

## Tagging (works today)

```bash
git tag -a v<version> -m "driver-app v<version>"
git push origin v<version>
```
Then roll `CHANGES.md` entries into [`CHANGELOG.md`](../../CHANGELOG.md) and sync the submodule
pointer in the umbrella repo.
