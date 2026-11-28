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
- [x] Phone screenshots (min 2) — 5 captured 2026-10-20 (source files in
      `play-upload/screenshots/driver/`, git-ignored) and present in the Play Console store
      listing (5 / 8).
- [ ] Record the background-location demo video (script in `PLAY_LISTING.md`) and submit the
      declaration in Play Console — manual, needs a real device build. Expect review time.
      The forms now exist: App content → "Location permissions" and "Foreground service
      permissions" are the **2 declarations that need attention** (checked 2026-10-21).
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
- [x] Store-settings category + contact email and the internal-testing tester list "Pingo testers"
      (1 user) are done (verified in the console 2026-10-21; the old "still to do" list here
      was stale).
- [x] **2.0.0 (versionCode 9) is live on Internal testing** (released 2026-10-20 22:39, status
      "Available to internal testers"). Uploaded by hand from
      `play-upload/v2.0.0/driver/pingo-driverapp-2.0.0-vc9.aab` (git-ignored). It supersedes the
      earlier draft `2 (1.0.0)` (`build f92f8462…`); delete
      `play-upload/driver/pingo-driverapp-v2.aab`.
- [x] **Play Console state, verified in the console 2026-10-21:** dashboard tasks all done except
      **"Set up your store listing"** (saved later the same day, below). Nothing has been sent for
      review; Production is "Inactive".
- [x] **Default store listing saved 2026-10-21** (Next → Review → Save; AI-asset declaration left
      at "Don't label assets"). It reads "Ready to send for review" in Publishing overview — it
      has **not** been sent.
- [x] **Closed test set up 2026-10-23, staged but NOT sent.** Track "Closed testing - Alpha"
      (id `4699644338460816233`): country Sri Lanka only, testers = email list "testers"
      (14 addresses), release `9 (2.0.0)` with en-US notes. The two blocking errors (undeclared
      location + foreground-service permissions) cleared once both declarations were saved; the
      Preview step now shows only the harmless missing-deobfuscation-file warning, and the release
      was saved to Publishing overview. **Submitted for review 2026-10-23** ("Submit 14 changes
      for review"); status "Changes in review" — Play's quick checks passed and the changes are
      with Google (reviews are typically under 7 days). Once approved the track goes live and
      testers use `https://play.google.com/apps/testing/com.pingo.driverapp` to opt in; their 14
      days start then.
- [ ] **Closed test before production access** (personal account created after Nov 2023): 12+
      testers each opted in continuously for the preceding 14 days when you press "Apply for
      production" (see the passenger app's RELEASING.md for the rule and its source). Internal
      testing does not count. Start it alongside the passenger app's.
- [x] **Demo video recorded 2026-10-23** on the owner's Redmi Note 9S (Android 12, USB debugging,
      2.0.0 versionCode 9 already installed) with `adb shell screenrecord`, driven by a script that
      only taps verified buttons. File (git-ignored):
      `play-upload/demo/pingo-driver-background-location-demo.mp4` (72 s, 720x1600). It shows:
      off-duty screen -> GO -> system location prompt -> in-app disclosure ("Keep sharing when
      your screen is off") -> Continue -> Android's "Location permission" page -> Allow all the
      time -> You're live -> the persistent notification ("Pingo is sharing your location") ->
      home screen while still sharing -> back in the app -> "End this journey?" sheet. Other
      notifications in the shade are redacted; `take5_raw.mp4` next to it is the UNREDACTED
      original, do not upload it. Not shown: the vehicle moving on a rider's map (optional per
      the shot list) and the final "off duty" frame.
- [x] Video uploaded to Google Drive by the owner (2026-10-23) and the link
      `https://drive.google.com/file/d/1DETHvZhXwIJvqwbkN2mbBIscS0FI9Jbg/view?usp=sharing` pasted
      into App content → **Location permissions** (app purpose + feature text + video link) and
      **Foreground service permissions** (task "User-initiated location sharing" + video link);
      both saved. The Location form's field says "YouTube video" but accepted the Drive URL.
- [x] **Drive link is public (verified 2026-10-23).** It first returned HTTP 401 (restricted); after
      the owner set General access to Anyone with the link → Viewer, an anonymous request returns
      200 and serves a file byte-identical (same SHA-256) to the redacted local video. If Play
      rejects a Drive URL at review, re-upload to YouTube (unlisted) and replace the link in both
      declarations.
- [x] Driver console privacy-policy URL and Data-safety "Delete account URL" were the dead
      `trackme-privacy` address; both now point at `https://shazaanashraff.github.io/pingo-privacy/`
      (fixed 2026-10-23, saved, not yet sent for review).
- [x] Direct APK `1.0.1` (versionCode 3, `com.pingo.driverapp`, label Pingo) built from the new
      `apk` profile and published as `pingo-driver-1.0.1.apk` on GitHub release `apps-v1.0.1`;
      registered on web-admin `/releases` 2026-10-18 (replaces the TrackMe-named 1.0.0).
- [x] Play "App signing key" SHA-1 in Google Cloud — done by the owner 2026-10-21 (passenger app;
      the driver app uses no Google sign-in, and its Maps key restriction should be re-checked
      if the map is blank in a Play-installed build).

## Tagging (works today)

```bash
git tag -a v<version> -m "driver-app v<version>"
git push origin v<version>
```
Then roll `CHANGES.md` entries into [`CHANGELOG.md`](../../CHANGELOG.md) and sync the submodule
pointer in the umbrella repo.
