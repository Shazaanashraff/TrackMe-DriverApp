# APP_UPDATES — Pingo Driver App

**Status:** `SHIPPED` (first build containing it: 1.0.2, versionCode 6; build 5 was superseded and never released)

---

## 1. Purpose

Tells a driver when a newer **native build** (APK) of the app exists and lets them download and
install it in two taps. Distinct from Expo's JS-bundle OTA: this replaces the binary itself (a new
`versionCode`). Android + direct-APK distribution only. Mirrors `user-app`'s
[`APP_UPDATES.md`](../../../user-app/docs/modules/APP_UPDATES.md); the two implementations are
deliberately parallel (no shared code between apps).

Android still shows its own "Install this app?" confirmation after the download — that one tap
cannot be skipped without a device-owner/MDM profile.

## 2. Key files (one job each)

| File | Responsibility |
|---|---|
| `src/hooks/useAppUpdateCheck.ts` | On mount (Android, non-`__DEV__`, `EXPO_PUBLIC_APK_UPDATER=1` only) fetches the latest driver release, compares `versionCode` to `Application.nativeBuildVersion`, exposes `downloadAndInstall`. A failed check is silent and retries next launch. |
| `src/components/ui/UpdateAvailableBanner.tsx` | Version + notes + Download & install button / progress bar. Dismissible unless `release.mandatory`. Positioned below the status bar via safe-area insets. |
| `src/services/api/appReleases.ts` | `getLatestAppRelease(platform)` — `GET /api/app-releases/latest?app=driver&platform=…`, public, no auth header. |
| `App.js` | Mounts the banner in `AppContent`, only when `EXPO_PUBLIC_APK_UPDATER === '1'`. Shown signed-out too, so a mandatory update can never be bypassed by logging out. |
| `app.config.js` | Adds `android.permission.REQUEST_INSTALL_PACKAGES` **only** when `EXPO_PUBLIC_APK_UPDATER === '1'`. |
| `eas.json` | The `apk` profile sets `EXPO_PUBLIC_APK_UPDATER=1`; `production` (the Play `.aab`) does not. |

## 3. Data flow

```
App.js → UpdateAvailableBanner → useAppUpdateCheck
  → api.getLatestAppRelease('android') → backend /api/app-releases/latest (public)
  → latest.versionCode > installed nativeBuildVersion → banner
  → Download & install: expo-file-system/legacy download → getContentUriAsync
      → expo-intent-launcher VIEW intent → Android installer (OS-owned confirmation)
```

## 4. Contracts

| Kind | Name | Notes |
|---|---|---|
| REST | `GET /api/app-releases/latest?app=driver&platform=android` | Public. `{ release: {…, version, versionCode, downloadUrl, releaseNotes, mandatory} \| null }`. Registered via web-admin `/releases` (super-admin). |
| Native | `nativeBuildVersion` | The Android `versionCode`. EAS owns it (`eas.json` `appVersionSource: remote`, `autoIncrement`), so the number registered in web-admin **must equal the versionCode EAS printed for that build**. |
| Config | `EXPO_PUBLIC_APK_UPDATER` | `1` = direct-APK build. Unset/`0` = Play build: updater off, permission stripped. |

## 5. Not visible in the frontend

- **Play builds never self-update.** Google Play forbids apps installing APKs and restricts
  `REQUEST_INSTALL_PACKAGES`; Play updates its own installs. The updater is therefore off in the
  `production` profile and the permission is absent from the manifest.
- **The first build containing the updater cannot update itself *to* anything older.** Phones on a
  build that predates this module (≤ 1.0.1) have no check and must be updated by hand once.
- **Registry order matters.** Publishing a release deactivates the previous one; a retracted
  release stops being offered, but phones that already installed it are not rolled back.
- **Sideloaded vs Play-signed builds don't mix.** The APK is signed with the EAS key; a Play
  install is re-signed by Play, so one cannot update the other — uninstall first.

## 6. Known gotchas / regressions

- Use `expo-file-system/legacy`; the SDK 54 default export has no resumable-download progress.
- Releasing a new APK: register `versionCode` exactly as built, or phones will see no update
  (too low) or an update they already have (loop — the check is strictly `>`, so equal is safe).
- A build whose `EXPO_PUBLIC_APK_UPDATER` env is lost (e.g. someone edits the `apk` profile) will
  silently ship without the updater — `app.config.test` and `useAppUpdateCheck.test` guard the
  logic, but not the EAS env itself. Check the build log's "Environment variables loaded" line.

## 7. Tests covering this module

| Layer | File | What it locks |
|---|---|---|
| Unit | `src/services/api/__tests__/appReleases.test.ts` | driver app param, no auth header, null passthrough |
| Unit | `src/hooks/__tests__/useAppUpdateCheck.test.ts` | iOS/`__DEV__`/Play-gate skips, versionCode comparison, download→content-uri→install order, progress, error surfacing |
| Unit | `src/components/ui/__tests__/UpdateAvailableBanner.test.tsx` | hidden when none, version + notes, dismiss vs mandatory, progress, error |
| Unit | `src/__tests__/appConfig.test.js` | `REQUEST_INSTALL_PACKAGES` only with the updater on; arm-only ABIs |

## 8. Change protocol

Any change to version compare, download/install sequence, the API contract, or the `apk` profile
env updates this doc, the [`TESTING_GUIDE.md`](../TESTING_GUIDE.md) rows, and
[`guides/RELEASING.md`](../guides/RELEASING.md).
