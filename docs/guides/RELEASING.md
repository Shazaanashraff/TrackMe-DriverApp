# Releasing — driver-app

> ⚠️ **OTA is not set up yet.** `eas.json` now exists (mirrors user-app's `development` /
> `preview` / `production` profiles, `appVersionSource: "remote"`, production `autoIncrement`),
> so an EAS build/submit is possible. There is still:
> - **no OTA update path** — `expo-updates` is absent, so a JS-only fix cannot be pushed to
>   installed builds,
> - no `updates.url` / `runtimeVersion` policy in `app.json`.
>
> Do not assume OTA works here just because user-app has it. **The remaining release task is to
> decide whether OTA is wanted**, then update this guide.

---

## What exists today

| Thing | State |
|---|---|
| `package.json` version | `1.0.0` |
| Build tooling | Expo (SDK ~54) — `npm start` for dev only |
| EAS config | `eas.json` present — `development`/`preview`/`production` build profiles, `submit.production` |
| Android package | `com.pingo.driverapp` (renamed from `com.TrackMe.driverapp` 2026-10-14 with the Pingo rebrand; **permanent after the first Play Console upload**) |
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

1. Decide whether OTA is wanted (internal distribution vs. store already works via `eas build`
   without it).
2. If OTA: add `expo-updates`, set `runtimeVersion` + `updates.url` in `app.json`, and note that
   OTA only reaches builds on the **same runtimeVersion** — an SDK bump forces a full build.
3. ~~Add `eas.json`~~ — done 2026-09-14, mirroring user-app.
4. Rewrite this guide with the real commands and delete this section.

## Before the first store submission

- [x] App name is **Pingo** and the Android `package` is `com.pingo.driverapp` (2026-10-14).
      Irreversible after the first Play Console upload.
- [x] Icons regenerated 2026-10-14 by `scripts/generate-brand-assets.py driver` (navy tile so it
      is distinguishable from the passenger app): `icon.png`, `adaptive-icon.png`,
      `adaptive-icon-monochrome.png`, `splash.png`, `favicon.png`, and
      `store-assets/play-icon-512.png` + `feature-graphic-1024x500.png`.
- [x] Privacy policy — published and updated to Pingo Driver / `com.pingo.driverapp`
      (2026-10-14), covers background location + camera.
- [x] Store copy, **background-location declaration text + demo-video script**, and Data-safety
      answers drafted in [`store-assets/PLAY_LISTING.md`](../../store-assets/PLAY_LISTING.md).
- [x] Signing credentials — EAS generated a keystore for `com.pingo.driverapp` on the first
      production build (2026-10-14). Download + back it up (`eas credentials -p android`).
- [ ] Phone screenshots (min 2) — none exist yet; capture from a build.
- [ ] Record the background-location demo video (script in `PLAY_LISTING.md`) and submit the
      declaration in Play Console — manual, needs a real device build. Expect review time.
- [x] `EXPO_PUBLIC_API_URL` in `eas.json`'s `production` profile now matches user-app
      (`https://trackme-backend-jton.onrender.com`, `/health` verified OK 2026-10-14). It
      previously pointed at `bus-tracking-backend.onrender.com`, which is **suspended**
      (`x-render-routing: suspend-by-user`) — a build with that URL would have shipped dead.
- [x] Play Console (2026-10-15, developer account 7275153640307829539, app id
      `4975192024230582217`): app created, privacy policy, ads = none, App access (Driver ID
      login), content rating (Everyone; shares precise location = yes), target audience 18+,
      Data safety (precise location, name, email, user IDs, device IDs; no crash reporting),
      Advertising ID = no, government / financial / health = no — saved as drafts. Store listing
      text, 512 icon and feature graphic saved as a draft. **Nothing has been sent for review.**
- [ ] Still to do in Play Console (browser automation became too laggy): store-settings category
      (Maps & Navigation) + contact email (mohamedshazaan7@gmail.com), the internal-testing tester
      list, and the **sensitive-permissions declaration** (background location + foreground
      service) — that form usually only appears after the first `.aab` is uploaded.
- [x] `build f92f8462…` (versionCode 2) `.aab` is uploaded as a **draft Internal-testing release
      `2 (1.0.0)`** (seen in Play Console 2026-10-18; track still "Inactive", not rolled out).
      File at `play-upload/driver/pingo-driverapp-v2.aab` (git-ignored; delete once rolled out).
- [x] Direct APK `1.0.1` (versionCode 3, `com.pingo.driverapp`, label Pingo) built from the new
      `apk` profile and published as `pingo-driver-1.0.1.apk` on GitHub release `apps-v1.0.1`;
      registered on web-admin `/releases` 2026-10-18 (replaces the TrackMe-named 1.0.0).
- [ ] Add the Play "App signing key" SHA-1 to Google Cloud if Maps/OAuth keys are used by this app.

## Tagging (works today)

```bash
git tag -a v<version> -m "driver-app v<version>"
git push origin v<version>
```
Then roll `CHANGES.md` entries into [`CHANGELOG.md`](../../CHANGELOG.md) and sync the submodule
pointer in the umbrella repo.
