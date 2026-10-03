# APP UPDATES — Driver App

**Status:** `SHIPPED` — native-binary version check + in-app APK download/install for Android.
No equivalent exists for iOS by design (see §5).

---

## 1. Purpose

Lets a driver on an older native build find out, inside the app, that a newer Android build
exists and install it without going through the Play Store (this app is not yet store-listed).
This is **not** `expo-updates`/OTA — there is no OTA mechanism in this app (see
`docs/guides/RELEASING.md`). OTA patches the JS bundle in place on a matching `runtimeVersion`;
this feature instead detects a newer **native binary** (a new `versionCode`) and walks the driver
through downloading and installing a full new APK. The one hard constraint: Android always shows
its own native "Install this app?" confirmation after the APK is handed to the OS installer —
nothing short of a device-owner/MDM profile can skip that tap, so the feature's job is only to
get the driver to that tap as fast as possible (auto-detect, auto-download).

## 2. Key files (one job each)

| File | Responsibility |
|---|---|
| `src/services/api/appReleases.ts` | `getLatestAppRelease()` — public GET, no auth |
| `src/hooks/useAppUpdateCheck.ts` | Mount-time check, version comparison, download + install-intent flow, progress/error state |
| `src/components/UpdateAvailableBanner.tsx` | Renders the hook's state: version, release notes, download button, progress bar, dismiss (unless mandatory) |
| `App.js` | Mounts `<UpdateAvailableBanner />` inside `AppContent`, gated on `user` so it never shows over the login screen |
| `app.json` (`android.permissions`) | `android.permission.REQUEST_INSTALL_PACKAGES` — required to hand a `content://` APK URI to the OS installer |

## 3. Data flow

```
App.js (user signed in)
  → <UpdateAvailableBanner />
    → useAppUpdateCheck() [on mount, Android + !__DEV__ only]
      → getLatestAppRelease()  GET /api/app-releases/latest?app=driver&platform=android
      → compare release.versionCode > Application.nativeBuildVersion
      → setState({ updateAvailable, release })
    → driver taps "Download & Install"
      → downloadAndInstall()
        → expo-file-system/legacy createDownloadResumable(...).downloadAsync()  [progress callback → downloadProgress]
        → expo-file-system/legacy getContentUriAsync(localUri)                  [file:// → content://]
        → expo-intent-launcher startActivityAsync('android.intent.action.VIEW', { data: contentUri, ... })
          → OS shows its native package-installer confirmation (outside this app's control)
```

No TanStack Query / cache layer here — this is a one-shot mount-time check with local
`useState`, not data the rest of the app reads.

## 4. Contracts (API / socket / storage)

| Kind | Name | Shape / notes |
|---|---|---|
| REST | `GET /api/app-releases/latest?app=driver&platform=android` | Public, no auth. Response: `{ release: AppRelease \| null }`. `AppRelease` = `{ _id, app: 'driver', platform: 'android', version, versionCode, downloadUrl, releaseNotes, mandatory, fileSizeBytes, isActive, createdAt }`. `downloadUrl` is a direct `.apk` link. Owned by `backend` — see `backend/docs/modules/` for the matching route (built alongside this feature; confirm the doc exists there before assuming the contract is stable). |
| Storage | — (none) | No persistence: dismissing a non-mandatory banner is in-memory only and re-shows next app launch. No AsyncStorage key is used. |

> If this contract changes, this table and the backend doc must both change — see
> [`../QA_UPDATE_TRIGGERS.md`](../QA_UPDATE_TRIGGERS.md).

## 5. Not visible in the frontend

- **iOS gets nothing.** No check, no banner, no hook activity (`Platform.OS === 'android'` guard).
  Apple's sandboxing blocks silent sideload installs, so iOS version pushes are handled entirely
  server/App-Store-side via a push notification — there is no in-app UI counterpart to build.
- **`__DEV__` is also skipped entirely** — a locally-run dev build never checks or nags about updates.
- **The native "Install this app?" OS dialog cannot be skipped.** This is a device/OS-level
  confirmation gate, not a bug in this feature — it exists on every unsigned-source APK install
  and is unrelated to `REQUEST_INSTALL_PACKAGES` (that permission only lets the app *request* the
  install flow, not bypass the user confirmation inside it).
- Comparison uses `Application.nativeBuildVersion` (the installed `android.versionCode`, as a
  string) vs. the backend's `release.versionCode` (a number) — **strictly greater** triggers the
  banner; equal or lower shows nothing.

## 6. Known gotchas / regressions

- `expo-file-system` SDK 54 split into a new `File`/`Directory` API (the default import) and a
  **separate `expo-file-system/legacy` subpath** that still has `cacheDirectory`,
  `createDownloadResumable`, and `getContentUriAsync`. Importing those names from the bare
  `expo-file-system` package throws at runtime in this SDK (`legacyWarnings.ts`) — this module
  deliberately imports from `expo-file-system/legacy`, not `expo-file-system`. Do not "simplify"
  that import without re-checking the installed SDK's file-system docs first.
- `downloadProgress` only updates while `totalBytesExpectedToWrite > 0` — a response without a
  `Content-Length` header (rare, but possible depending on how the backend/CDN serves the APK)
  leaves progress at `0` until the download completes. The banner's progress bar degrades to
  "indeterminate-looking" in that case rather than failing.
- A failed download or a failed install-intent launch both surface via the hook's `error` string
  and reset `isDownloading` to `false` — neither throws uncaught. The banner does not auto-retry;
  the driver re-presses "Download & Install".
- A `mandatory` release removes the dismiss affordance entirely (no close button rendered) but
  does **not** block the rest of the app — the driver can still use the dashboard underneath. This
  module does not enforce a hard update wall.

## 7. Tests covering this module

| Layer | File | What it locks |
|---|---|---|
| Unit | `src/hooks/__tests__/useAppUpdateCheck.test.ts` | Skips entirely on iOS and in `__DEV__`; no update when `versionCode` is equal/lower; `updateAvailable: true` when the backend's `versionCode` is higher; `downloadAndInstall` calls download → content-URI resolve → install-intent in that order with the exact `IntentLauncher.startActivityAsync` payload; progress callback flows through to `downloadProgress`; a download failure and an install-intent failure both surface via `error` without throwing; a release-check failure also surfaces via `error` |
| Unit | `src/components/__tests__/UpdateAvailableBanner.test.tsx` | Renders nothing with no update; renders version/notes/download button when available; download button calls `downloadAndInstall`; progress indicator shown while `isDownloading`; dismissible (and actually hides) when not mandatory; no dismiss control and shows the "required" note when mandatory; surfaces a download error string |

See [`../guides/ADDING_A_TEST.md`](../guides/ADDING_A_TEST.md) for how to add one, and the
[`../TESTING_GUIDE.md`](../TESTING_GUIDE.md) traceability row that must exist.

## 8. Change protocol

Any change to this module must:
1. Run this module's tests green as a baseline.
2. Keep the **`expo-file-system/legacy` subpath import** — do not migrate to the new `File`/
   `Directory` API without re-adding progress tracking and `getContentUriAsync`-equivalent
   behaviour (the new API does not expose either as of SDK 54).
3. Add/adjust tests for every changed behaviour (a change with no test is not done).
4. Re-run green (`lint`, `typecheck`, `test`).
5. Update **this doc** + the [`../TESTING_GUIDE.md`](../TESTING_GUIDE.md) row, and append a
   [`../CHANGES.md`](../CHANGES.md) entry before pushing.
6. If the backend's `/api/app-releases/latest` response shape changes, update §4 here and confirm
   the matching `backend/docs/modules/*.md` entry.
