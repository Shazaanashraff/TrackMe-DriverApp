# CHANGES — driver-app session log

Append-only running log of what each work session changed. **Newest entry on top.**
The pre-push check ([`scripts/check-docs.mjs`](../scripts/check-docs.mjs)) expects a new entry
when source under `src/` changed. One entry per session/PR is enough.

**Before you push, add an entry using this template:**

```md
## YYYY-MM-DD — <short title>
- **Branch:** <branch>
- **Modules touched:** <link docs/modules/*>
- **What changed:** <1–4 bullets, plain English>
- **Why:** <the reason / ticket / todo id>
- **Contract impact:** <none | which backend endpoint/socket payload, + which backend doc updated>
- **Tests:** <added/updated files, or "none — docs only">
- **Docs updated:** <docs/modules/*.md, TESTING_GUIDE row — or "n/a">
- **Follow-ups / known issues:** <or "none">
```

Feeds [`CHANGELOG.md`](../CHANGELOG.md) at release time — see [`guides/RELEASING.md`](guides/RELEASING.md).

---

## 2026-10-19: Absence strip in two colours
- **Branch:** feature/absence-strip-colours
- **Modules touched:** [COMMUNICATIONS](modules/COMMUNICATIONS.md)
- **What changed:** the Home strip that asks the driver to acknowledge an absence change is yellow
  (`warning.bg`) for "will be absent" and now green (`success.bg`) for "is coming · absence
  cancelled". It used to be yellow for both.
- **Why:** the user asked to tell the two apart at a glance.
- **Contract impact:** none.
- **Tests:** `broadcast.test.js` `absence strip`: the strip's colour per status (fails on the
  previous code). Full run 657 passed; lint 0 errors, 75 warnings (unchanged). The flaky
  `offline-scan-roster.int.test.tsx` failed once in the baseline run under load and passed alone.
- **Docs updated:** `docs/modules/COMMUNICATIONS.md`, `docs/TESTING_GUIDE.md`
- **Follow-ups / known issues:** none.

## 2026-10-19: Popups that say what happened, "Sent" at once, one reload per burst
- **Branch:** feature/snappy-messages (stacked on feature/fix-permission-loop)
- **Modules touched:** [COMMUNICATIONS](modules/COMMUNICATIONS.md) "Popups and reloads", [LOCATION_TRACKING](LOCATION_TRACKING.md)
- **What changed:**
  - The popup names the change ("Absence reported", "Absence cancelled", ...) with the server's
    text, sits below the status bar, and opens Riders, Absences on a tap. None for the driver's own
    broadcast copies, own acknowledgments or read receipts (it used to pop "New message or absence
    change" for all of them).
  - Events inside 400 ms share one list reload, so a 20-rider broadcast reloads once, not 20 times.
  - "Sent" shows as soon as the server accepts; list reloads run in the background. An acknowledged
    absence leaves the Home strip at once.
  - A refreshed token no longer forces a socket reconnect every 15 minutes.
- **Why:** users reported slow messages and popups that did not work. The driver waited seconds on
  "Sending…" for list reloads, every rider's copy of a broadcast reloaded everything again (more
  load on a slow server and on the rate limit), and the popup carried no information.
- **Contract impact:** none. Reads the existing `communication:event` fields (`sender`,
  `absenceStatus`, `text`).
- **Tests:** new `provider.events.test.js` (5), `hooks.send.test.js` (1), `socket.test.ts`
  `a refreshed token` (3); all 9 fail on the previous code. Full run 656 passed (baseline 647);
  lint 0 errors, 75 warnings (unchanged).
- **Docs updated:** `docs/modules/COMMUNICATIONS.md`, `docs/LOCATION_TRACKING.md`, `docs/TESTING_GUIDE.md`
- **Follow-ups / known issues:** popups on a locked phone still need Firebase in the build and an
  FCM V1 key on the Expo project.

## 2026-10-19: Stop the permission loop, self-heal the socket, readable Riders tab
- **Branch:** feature/fix-permission-loop
- **Modules touched:** [COMMUNICATIONS](modules/COMMUNICATIONS.md), [LOCATION_TRACKING](LOCATION_TRACKING.md)
- **What changed:**
  - `CommunicationProvider` reads the notification permission first and asks at most once per
    session, instead of on launch, every minute and every return to the foreground.
  - `socket.ts` retries a middleware-refused handshake on a 2 s to 30 s backoff, and
    `driver:location` now carries each fix's `timestamp`.
  - `useTrackingSession` retries a failed re-announce on the same backoff while the socket stays
    connected, so "Reconnecting…" clears by itself.
  - Riders tab: `FormInput` search with a readable placeholder, readable segment labels, white
    rider cards with a person icon and chevron, an "Absent today" pill, and `EmptyState` for empty
    lists.
- **Why:** on the testers' phones the permission request looped behind Android's permission
  screen, swallowed taps (GO), reloaded the dashboard lists and used up the backend's 600 per
  15 minutes per address limit (429 on "On my way" and on absences). A refused reconnect then
  never retried, and re-sent fixes without a timestamp walked riders' vans backwards.
- **Contract impact:** none new. `timestamp` on `driver:location` was already in
  `backend/docs/modules/REALTIME.md`; the backend already used it.
- **Tests:** provider.permission.test.js (new, 3), socket.test.ts (+9), useTrackingSession.test.ts
  (+6), riders.test.js (+5); updated `emitLocation` expectations in locationDispatch.test.ts,
  useLocationBroadcast.test.ts and tracking.int.test.tsx. Full run 647/647.
- **Docs updated:** LOCATION_TRACKING.md, modules/COMMUNICATIONS.md, TESTING_GUIDE rows.
- **Follow-ups / known issues:** background push while the app is closed still needs Firebase
  (FCM) set up by the Expo project owner. Not yet checked on a phone: the APK rebuild and the
  on-device checks in the plan come after the passenger app and backend changes.

## 2026-10-18: Lift the confirm and background-location sheets above the back/home bar
- **Branch:** feature/socket-token-refresh
- **Modules touched:** [DASHBOARD](modules/DASHBOARD.md), [PROFILE](modules/PROFILE.md) (both use `ConfirmSheet`)
- **What changed:** `ConfirmSheet` (End journey, Log out) and `BackgroundLocationDisclosure` add
  the bottom safe-area inset to their padding (`max(32, 20 + inset)`), read from
  `SafeAreaInsetsContext` so tests without a provider still render.
- **Why:** the build draws Android edge-to-edge, and both sheets kept a fixed 32 px under a ~48 px
  back/home bar, so their bottom button sat partly under it on the testers' phones.
- **Contract impact:** none.
- **Tests:** ConfirmSheet.test.tsx (2 new), BackgroundLocationDisclosure.test.tsx (1 new).
- **Docs updated:** TESTING_GUIDE row.
- **Follow-ups / known issues:** the same inset logic was checked on an Android 15 emulator in the
  passenger app; these two sheets need a signed-in driver, so they were not opened there.

## 2026-10-18: Refresh the socket token so GO reaches the server after a drop
- **Branch:** feature/socket-token-refresh
- **Modules touched:** [LOCATION_TRACKING](LOCATION_TRACKING.md), [AUTH](modules/AUTH.md)
- **What changed:** a socket reconnect refused with `jwt expired` / `Invalid token` now asks
  `AuthContext` for a fresh token (`setSocketTokenRefresher`) and reconnects. `refreshAccessToken`
  shares one in-flight refresh between callers and no longer signs the driver out when the refresh
  fails for lack of network.
- **Why:** on a real phone GO sat on "Offline, will sync later" and riders never saw the vehicle.
  Access tokens last 15 minutes; once the socket dropped, every reconnect offered the expired
  token and socket.io gave up after the server's auth refusal.
- **Contract impact:** none (uses the existing `POST /api/auth/refresh-token` and socket auth).
- **Tests:** services/__tests__/socket.test.ts (6 new), context/__tests__/AuthContext.test.js
  (new, 4), __integration__/auth.int.test.tsx (socket mock gains `setSocketTokenRefresher`).
- **Docs updated:** LOCATION_TRACKING.md, TESTING_GUIDE row.
- **Follow-ups / known issues:** a headless background launch has no `AuthProvider`, so it still
  reconnects with the stored token only.

## 2026-10-18 — Send the GPS heading so maps can turn the vehicle icon
- **Branch:** feature/live-map-markers
- **Modules touched:** [LOCATION_TRACKING](LOCATION_TRACKING.md)
- **What changed:** each GPS fix now carries `heading` from `usableHeading()` (the GPS course
  while moving at 1 m/s or faster, null otherwise), from both the foreground watcher and the
  background task. `emitLocation` sends it on `driver:location` when it is a number.
- **Why:** rider and manager maps now draw a top-down vehicle that faces its direction of
  travel instead of a dot.
- **Contract impact:** none new. `driver:location` already accepted an optional `heading` and
  the backend relays it (`backend/docs/modules/REALTIME.md`); this app simply starts sending it.
- **Tests:** `locationUtils.test.ts` (usableHeading), `socket.test.ts` (heading in / out of the
  payload), `useLocationBroadcast.test.ts` and `backgroundLocation.test.ts` (heading on the fix);
  existing emit expectations updated for the new trailing argument.
- **Docs updated:** LOCATION_TRACKING.md "Heading", TESTING_GUIDE row.
- **Follow-ups / known issues:** real rotation can only be confirmed with a moving device.
## 2026-10-18 — Pingo Driver 1.0.1 direct APK (versionCode 3), config only
- **Branch:** main
- **Modules touched:** release config (`app.json`, `eas.json`)
- **What changed:** `expo.version` 1.0.0 → 1.0.1; added an `apk` EAS profile (extends `production`, `buildType: apk`). Built it (build `31c1556f…`, versionCode 3, package `com.pingo.driverapp`, label Pingo) and published `pingo-driver-1.0.1.apk` on GitHub release `apps-v1.0.1`; registered it on web-admin `/releases` (1.0.1, code 3), replacing the old TrackMe-named 1.0.0 record.
- **Why:** The 1.0.0 APK on the landing page was still the old TrackMe build (`com.TrackMe.driverapp`).
- **Contract impact:** none
- **Tests:** none — release config only
- **Docs updated:** `guides/RELEASING.md` checklist
- **Follow-ups / known issues:** Play Console already shows a draft Internal-testing release `2 (1.0.0)` with a build uploaded (not rolled out); screenshots, background-location declaration + demo video still pending. The new APK installs alongside the old TrackMe app (different package).

## 2026-10-18 — App version on the Profile screen
- **Modules touched:** [`PROFILE`](modules/PROFILE.md), `src/helpers/appVersion.ts` (new)
- **What changed:** Profile now ends with a muted "Pingo Driver v1.0.2 (build 5)" line under Log out (version + Android versionCode from `expo-application`); shows "Version unavailable" if native values are missing.
- **Why:** A driver (or support) needs to know which build is installed, and the update check compares the same build number.
- **Contract impact:** none. **Tests:** two cases in `DriverProfileScreen.test.js`.
- **Follow-ups:** shipped in 1.0.2 / build 6 (GitHub release `apps-v1.0.2` on TrackMe-WebAdmin). Build 5 predates this line and was never released.

---

## 2026-10-18 — Arm-only APK + in-app update check (direct-APK builds)
- **Branch:** main (uncommitted)
- **Modules touched:** [`APP_UPDATES`](modules/APP_UPDATES.md) (new), release config (`app.config.js`, `eas.json`)
- **What changed:** (1) `app.config.js` restricts the Android native build to `armeabi-v7a,arm64-v8a` — the APK drops from 107 MB to ~62 MB; x86/x86_64 only served emulators. (2) New `useAppUpdateCheck` + `UpdateAvailableBanner` + `getLatestAppRelease` (ported from user-app): a phone running a direct-APK build sees "Update available" when web-admin's `/releases` registry has a higher `versionCode`, and can download + install it in-app. (3) The `apk` EAS profile sets `EXPO_PUBLIC_APK_UPDATER=1`; `REQUEST_INSTALL_PACKAGES` is only added in that case, never in the Play `.aab`. (4) Added `expo-application`, `expo-file-system`, `expo-intent-launcher` to `package.json` (previously only transitive). `app.json` version -> 1.0.2.
- **Why:** The 107 MB APK stalled at 100% in Chrome's download scan on a client phone; and the user needs shipped builds to discover new releases on their own.
- **Contract impact:** none new — reads the existing public `GET /api/app-releases/latest?app=driver`.
- **Tests:** `useAppUpdateCheck.test.ts`, `appReleases.test.ts`, `UpdateAvailableBanner.test.tsx`, `appConfig.test.js` (all green, run in-band).
- **Docs updated:** `docs/modules/APP_UPDATES.md`, `TESTING_GUIDE.md` rows, `CLAUDE.md` map.
- **Follow-ups / known issues:** phones on <= 1.0.1 have no check and need one manual update. Not yet verified on a physical device. The Play `.aab` build is unaffected (updater off).

---

## 2026-10-15 — Play Console setup for Pingo Driver (partial), docs only
- **Branch:** n/a (Play Console work, no source change)
- **Modules touched:** none — release checklist only ([`guides/RELEASING.md`](guides/RELEASING.md))
- **What changed:** Created the app in Play Console; saved privacy policy, ads, App access, content rating (shares precise location = yes), target audience 18+, Data safety, Advertising ID, government/financial/health declarations and the store listing text/graphics as drafts. Nothing submitted for review.
- **Why:** First store submission.
- **Contract impact:** none
- **Tests:** none — docs only
- **Docs updated:** `guides/RELEASING.md` checklist
- **Follow-ups / known issues:** store-settings category/email, tester list, sensitive-permissions (background location) declaration + demo video, screenshots, manual `.aab` upload


## 2026-10-14 — Rebrand TrackMe → Pingo, real app icons, fix dead production API URL
- **Branch:** main
- **Modules touched:** app config, branding, release config
- **What changed:**
  - Display name, permission strings, in-app brand text, background-location notification title → "Pingo". Android package → `com.pingo.driverapp` (not yet uploaded, so still changeable).
  - `eas.json` production `EXPO_PUBLIC_API_URL` now `https://trackme-backend-jton.onrender.com` (was `bus-tracking-backend.onrender.com`, which Render reports as suspended).
  - New navy brand assets via `scripts/generate-brand-assets.py driver` (+ monochrome adaptive icon, splash colour → navy, Play 512 icon + feature graphic).
  - `docs/guides/RELEASING.md` checklist refreshed.
- **Why:** Play Store submission prep.
- **Tests:** `QRScannerScreen.test.tsx` copy updated.
- **Docs updated:** RELEASING.md, CLAUDE.md/DESIGN.md titles.
- **Follow-ups / known issues:** no signing keystore yet; background-location declaration + demo video; privacy policy site still says TrackMe; no screenshots.

## 2026-09-14 — Build-time guard against a placeholder production API URL

- **Branch:** main
- **Modules touched:** none dedicated — release config only (`app.config.js`)
- **What changed:** `app.config.js` now throws during an `eas build --profile production` if
  `EXPO_PUBLIC_API_URL` is unset or still contains `your-backend` — the exact template default
  that shipped in production once already (see the entry below). Catches the mistake at build
  time instead of relying on someone noticing a wrong URL after store submission.
- **Why:** `AUDIT_2026-08-17/AUDIT.md` S1-1 proposed this guard alongside the URL fix; only the
  URL was fixed in the entry below, not the guard.
- **Contract impact:** none
- **Tests:** none — config only, no behavior to assert; would need an EAS build to exercise.
- **Docs updated:** n/a
- **Follow-ups / known issues:** none

## 2026-09-14 — Play Store readiness: real Android package id, fix the placeholder production API URL

- **Branch:** main
- **Modules touched:** none dedicated — release config only (`app.json`, `eas.json`,
  `docs/guides/RELEASING.md`)
- **What changed:**
  - Changed the Android `package` in `app.json` from Expo's default placeholder
    `com.anonymous.driverapp` to `com.TrackMe.driverapp` (matching user-app's
    `com.TrackMe.userapp` convention). This is a one-time, unchangeable-after-first-upload
    setting — **confirm this value before the first real Play Console upload.**
  - Replaced the unedited template placeholder `https://your-backend.onrender.com` in
    `eas.json`'s `production.env.EXPO_PUBLIC_API_URL` with the real backend,
    `https://bus-tracking-backend.onrender.com` (confirmed live via its Render routing header;
    it is currently suspended by the account owner, not deployed to a domain we don't own —
    audit finding S1-1, same issue user-app had).
  - Updated `docs/guides/RELEASING.md`: it still said "no eas.json exists yet" even though one
    is now present with production/preview/development profiles; added a "Before the first
    store submission" checklist.
- **Why:** local audit `AUDIT_2026-08-17/AUDIT.md` flagged the placeholder API URL as
  must-fix-before-ship (S1-1); the package-name placeholder and stale release doc were found
  while addressing it.
- **Contract impact:** none
- **Tests:** none — config only, no behavior to assert.
- **Docs updated:** `docs/guides/RELEASING.md`
- **Follow-ups / known issues:** no signing credentials configured yet; no privacy policy or
  store graphics exist yet; OTA (`expo-updates`) still not decided/set up; the Render backend
  service is suspended and needs to be resumed before a real production build.
## 2026-10-06 - Tutorial readiness fixes
- **Branch:** feature/tutorial-readiness
- **Modules touched:** [docs/modules/DASHBOARD.md](modules/DASHBOARD.md)
- **What changed:**
  - Trip Progress is removed from Home, along with its distance helper. Its numbers were
    never real: nobody knows a shuttle's actual daily route or destination, so a covered/
    remaining distance along the stop list could only mislead.
  - QR boarding is optional: Home shows the On board card and "Scan rider QR" only when the
    vehicle's route has the manager's per-route switch on (`Route.qrEnabled`). Not every
    transport office scans passes. Before, Scan always showed and the card only vanished
    through a roster 403.
  - The "Your vehicle" registration form is gone. It never sent a `routeId`, so every save
    failed; managers create and assign vehicles in WebAdmin. The empty vehicle card now reads
    "Ask your manager to assign one" and is not pressable, and the hero's status line reads
    "No vehicle assigned yet". `useRegisterVehicle` and `api.registerVehicle` went with it.
  - The Trips tab is hidden. Ending a journey only marks the vehicle offline and nothing calls
    `POST /api/driver/trips/log`, so it could only ever say "No trips yet". The screen and its
    tests stay, unmounted, for when the backend records trips.
  - "Forgot password?" now says the transport manager resets it (WebAdmin already can). The
    emailed-code flow silently failed for manager-created drivers, who have no identity email;
    its two screens, three hooks and API calls are removed. Login asks for a "Driver ID"
    (email still works for older accounts) and the tagline is "Drive. Go live. Keep riders in
    the loop." instead of the earnings-era "Get paid".
  - The app is called PinGo wherever a driver sees a name: the Android app name, the camera,
    location and background-location permission texts, the "PinGo is sharing your location"
    notification, the enrollment-key share message, the scanner's camera notes, the login
    wordmark and the browser tab title. Package ids, the slug and code identifiers are
    unchanged.
- **Why:** owner requests while preparing the driver video tutorial.
- **Contract impact:** none (reads `qrEnabled`, which `GET /api/routes/:routeId` already returns).
- **Tests:** `TripProgressCard.test.js` and `tripProgress.test.js` removed with the code;
  `DriverDashboard.test.js` covers QR on, off, still loading, and no vehicle;
  `VehicleRegistrationScreen.test.js` and `bus-registration-dashboard.int.test.tsx` removed with
  the form, register cases dropped from the vehicle hook and contract tests, VehicleCard /
  DriverProfileScreen / navigator tests updated; the navigator test now expects Home, Riders and
  Profile only; ForgotPasswordScreen and LoginScreen tests rewritten for the new copy, reset
  screen and hook tests removed.
- **Docs updated:** CLAUDE.md map, DASHBOARD.md and BOARDING.md notes, BUS_REGISTRATION.md
  (now a short REMOVED note), TRIP_HISTORY.md and AUTH.md notes, TESTING_GUIDE.md rows.
- **Follow-ups / known issues:** none.

## 2026-09-12 — Okay on absence requests and cancellations; the pill opens the absence list
- **Branch:** feature/absence-request-ack
- **Modules touched:** [docs/modules/COMMUNICATIONS.md](modules/COMMUNICATIONS.md)
- **What changed:**
  - The Home strip branches on the pending change's `status`: "<rider> will be absent
    today." for a fresh absence, the existing "is coming today · absence cancelled." for a
    cancellation. One action, **Okay**, acknowledges that revision; "View changes" is gone
    (`components.js` `CancellationStrip`, `BroadcastPanel.js`).
  - The "Absences · N" pill passes `openedAt: Date.now()` with `tab: "absences"`, and
    `RidersScreen` adopts the requested segment whenever `openedAt` changes, so a tap after
    the tab's first visit lands on the Absences segment instead of wherever it was left.
- **Why:** a rider marking themselves absent got no acknowledgment from the driver (the
  server only listed cancellations), and the pill stopped working after the first visit
  because the tab stays mounted and read its params once.
- **Contract impact:** consumes the widened `changes` from `GET /api/driver/absences`
  (backend `feature/absence-request-ack`, `docs/modules/COMMUNICATIONS.md` updated there).
- **Tests:** `features/communications/__tests__/broadcast.test.js` (strip copy for both
  statuses, Okay acknowledges the row's revision, nothing with no change, pill target and
  fresh `openedAt`), `riders.test.js` (segment follows a later param change, twice).
- **Docs updated:** COMMUNICATIONS.md, TESTING_GUIDE.md rows.
- **Follow-ups / known issues:** `riders.test.js` is flaky under the full parallel `npm test`
  run on this machine (passes alone); a failed Okay still leaves a draft under
  `communication-draft:<driverId>:home-acknowledgment` with no retry affordance.

## 2026-09-11 — No rider pictures in the driver app; ink restyle of the Riders tab
- **Branch:** feature/restore-bento-ui
- **Modules touched:** [docs/modules/COMMUNICATIONS.md](modules/COMMUNICATIONS.md)
- **What changed:**
  - `RiderAvatar` and `riderAvatarCache.js` deleted. `RiderRow` and `RiderProfileScreen`
    show the name only. An intermediate restyle had put the avatar back into `RiderRow`,
    which showed photos on the Riders list but initials on Absences (absence rows carry no
    `hasAvatar`); the driver is not meant to see pictures at all.
  - Commits the Riders-tab restyle that was on disk: dark ink rows, a text Back link in
    `Page`, segmented control on a field background with an elevated selected pane, and
    divider-separated fields on the rider profile.
- **Why:** driver asked that rider pictures not appear in the driver app, and the three
  surfaces had drifted apart.
- **Contract impact:** none. The roster still carries `hasAvatar`/`avatarVersion` and the
  avatar endpoint remains; this app no longer reads them.
- **Tests:** `features/communications/__tests__/riders.test.js` — "rider pictures" cases
  removed; one case asserts no `Image`, no initials and no `/avatar` request on the list,
  the absences segment and the profile.
- **Docs updated:** COMMUNICATIONS.md, TESTING_GUIDE.md row.
- **Follow-ups / known issues:** none.

## 2026-09-11 — Absences becomes a plain absent list; riders list drops pictures; no polling
- **Branch:** feature/restore-bento-ui
- **Modules touched:** [docs/modules/COMMUNICATIONS.md](modules/COMMUNICATIONS.md)
- **What changed:**
  - `AbsencesScreen` is driver-only and lists just the riders with status `ABSENT` on the
    chosen date as `RiderRow`s (name, organization · pickup, tap to profile). The summary
    count, "Changes on other dates" card, Coming after cancellation / History sections,
    per-card acknowledge flow and the Updated/Refresh row are gone. `AbsenceCard` and
    `RiderIdentity` were removed as unused.
  - New shared `RiderRow` in `components.js`; `RiderDirectory` uses it and no longer shows
    `RiderAvatar`. The picture remains on `RiderProfileScreen`.
  - The Updated/Refresh row is gone from the Riders list too, and `Freshness` with it.
    Load-failure copy now says the list reloads when the tab is reopened.
  - The date input is gone (`DateField` deleted): the rider app can only report today, so
    the driver never chooses a day. One read-only `Today · DD/MM/YYYY` caption
    (`toDisplayDate` in `state.js`) sits above the search box and the request is always
    for today.
  - `useCommunicationQuery` no longer polls every 30 s. Lists load on open and reload when
    the provider invalidates them (socket `communication:event`, reconnect, foreground, push).
- **Why:** driver asked for the Absences tab to show only who is currently away, laid out like
  the Riders list, without pictures, and to refresh on rider actions rather than a timer.
- **Contract impact:** none. Same `GET /api/driver/absences?date=` and `GET /api/driver/riders`.
- **Tests:** `features/communications/__tests__/riders.test.js` — new Absences segment cases,
  list-has-no-picture case, no-Refresh-on-either-segment case, avatar cases moved to the
  profile screen.
- **Docs updated:** COMMUNICATIONS.md, TESTING_GUIDE.md rows.
- **Follow-ups / known issues:** the rider roster no longer refreshes on a timer either; an
  enrollment change shows on the next open or foreground.

## 2026-09-10 — The Messages tab becomes a Riders directory
- **Branch:** feature/rider-directory-tab
- **Modules touched:** [docs/modules/COMMUNICATIONS.md](modules/COMMUNICATIONS.md)
- **What changed:**
  - Removed private rider-driver messaging: `MessagesScreen`, `ConversationScreen`,
    `ConversationContent`, `MessageBubble`, `UnreadBadge`, `mergeMessages`, the
    `Conversation`/`RiderAudience`/`Absences` stack routes, and the provider's
    deep-link-to-conversation poller. The in-app banner is now dismiss-only.
  - The freed tab is **Riders**: a segmented screen over a rider directory and the
    existing driver absence review. Only the visible segment mounts, since each polls
    every 30 s while focused. The Home panel's two absence actions now deep-link into
    the Absences segment — they pointed at a stack route that no longer exists.
  - The directory is a row per rider (picture, name, then grade · organization · pickup)
    opening a rider profile: name, grade, rider code, one contact number. No address.
  - Pictures come from the new per-rider avatar endpoint and are cached in AsyncStorage
    against `avatarVersion` (`riderAvatarCache.js`, ported from user-app). A rider with
    no picture causes no request and shows their initial.
- **Why:** the inbox had nothing to receive — user-app dropped its conversation screens,
  so riders have had no send path. The two things a driver actually uses were buried in
  chips on the Home panel.
- **Contract impact:** consumes the additive backend change of the same date —
  `GET /api/driver/riders` gains `category`/`grade`/`hasAvatar`, plus new
  `GET /api/driver/riders/:riderId` and `.../avatar`. Backend doc:
  `backend/docs/modules/COMMUNICATIONS.md`.
- **Tests:** new `features/communications/__tests__/riders.test.js` (20 cases: segment
  defaulting and single-mount polling, row subtitle and tap-through, search, 404 copy,
  no address, avatar cache per version incl. no-request and eviction, `gradeLine` table).
  `broadcast.test.js` lost its `mergeMessages` case. Full suite **604/604 passing, 70
  suites**, up from 584; lint 0 errors.
- **Docs updated:** `docs/modules/COMMUNICATIONS.md`, `docs/TESTING_GUIDE.md` row,
  `CLAUDE.md` navigation map.
- **Follow-ups / known issues:** **not yet exercised in a browser** — the automated
  checks pass and the web bundle compiles with 0 console errors on load, but no one has
  clicked through the tab against real data yet. Also: a notification tap no longer
  navigates anywhere now that the conversation deep link is gone.

---

## 2026-09-10 — Rider–driver communications, merged into `main`
- **Branch:** feature/comms-preset-trim (merged)
- **Modules touched:** [docs/modules/COMMUNICATIONS.md](modules/COMMUNICATIONS.md)
- **What changed:** the four communications sessions below, previously unmerged, land together:
  - **2026-09-08** — added the fixed two-action quick-broadcast panel, private messages, dated
    absence review and acknowledgment, announcements, cached/offline drafts, app-shell socket
    ownership, and native push registration. QR boarding stayed independent and surfaces a
    planned-absence discrepancy after a valid scan.
  - **2026-09-09** — bounded the Home broadcast panel in its own scroll region, and added
    truthful loading/offline/error/empty states, safe-area protection, and long-name wrapping.
  - **2026-09-10** — the quick-action grid now renders the two presets the backend serves
    instead of six, and the open-ended delay preview dropped "Traffic is causing…" to match the
    backend's canonical wording word for word.
  - **2026-09-10** — removed the "More updates" action and the whole `AnnouncementsScreen`
    behind it (its only entry point), dropping the custom composer, open-ended delay,
    service-unavailability notice, and earlier-announcements history. Backend announcement
    endpoints were left untouched.
- **Why:** the communications module had never reached `main`; merging it before starting the
  Riders-tab work avoids stacking further changes on an unmerged branch.
- **Contract impact:** none new — consumes existing `/api/conversations/*`, `/api/driver/*` and
  `/api/absences/*` endpoints.
- **Tests:** `src/features/communications/__tests__/broadcast.test.js`.
- **Docs updated:** `docs/modules/COMMUNICATIONS.md`, `docs/README.md`, `CLAUDE.md`.
- **Follow-ups / known issues:** private messaging is slated for removal — the passenger app has
  already dropped its Messages tab, so riders have no send path. The Messages tab becomes a
  Riders directory next.

---

## 2026-08-30 — Fix main CI: two `__integration__` suites missing `NetworkStatusContext`
- **Branch:** issue/51-fix-network-status-context-integration-tests
- **Modules touched:** [docs/modules/BUS_REGISTRATION.md](modules/BUS_REGISTRATION.md),
  [docs/modules/BOARDING.md](modules/BOARDING.md)
- **What changed:**
  - `__integration__/bus-registration-dashboard.int.test.tsx` now mocks `NetworkStatusContext`
    to a static online value (this journey doesn't exercise offline behavior), the same pattern
    `VehicleRegistrationScreen.test.js` and `shift-lifecycle.int.test.tsx` already use.
  - `__integration__/offline-scan-roster.int.test.tsx` now wraps its render tree in the real
    `NetworkStatusProvider` instead — this suite deliberately exercises the real
    `services/backendStatus` module (its own `markBackendHealthy()` reconnect signal), so a
    static mock would have defeated the point of the test.
- **Why:** Closes #51. The offline-audit-remediation merges wired `useNetworkStatus()` into
  `VehicleRegistrationScreen` and `BoardingRosterScreen`, but these two `__integration__` files
  predate that wiring and never provided the context, so both screens crashed on mount
  (`useNetworkStatus must be used within a NetworkStatusProvider`) — the second failure
  surfaced as `Unable to find node on an unmounted component` since the crash happened before
  the test's own assertion. No production code changed.
- **Contract impact:** none.
- **Tests:** `__integration__/bus-registration-dashboard.int.test.tsx`,
  `__integration__/offline-scan-roster.int.test.tsx` — both updated, no new test files.
  `npm test`: 68/68 suites, 576/576 tests passing (was 66/68, 574/576 on `main`).
  `npm run typecheck`: same 4 pre-existing errors (`ErrorBoundary.tsx`, `api.test.ts`),
  unrelated to and unaffected by this change. `npm run lint`: 0 errors (68 pre-existing
  warnings, none new).
- **Docs updated:** n/a — test-setup fix only, no behavior change to document.
- **Follow-ups / known issues:** none.

---

## 2026-08-27 — Offline go-on-duty: pressing GO with no connection (Offline & Caching Audit, chunk 1)
- **Branch:** feature/audit-remediation-offline-shift-start
- **Modules touched:** [docs/LOCATION_TRACKING.md](LOCATION_TRACKING.md) (§"Offline go-on-duty"),
  [docs/modules/DASHBOARD.md](modules/DASHBOARD.md) (note added to the stub)
- **What changed:**
  - `useTrackingSession` has a new `'pending'` status. When `startTracking()` rejects because the
    socket is down (now tagged `{ offline: true }`), `start()` enters `pending` instead of
    `error`: the shift is on duty locally, the GO-press time is held in memory, and the GPS
    pipeline starts buffering.
  - `DriverDashboard` gates `useLocationBroadcast` / `useBackgroundTracking` / keep-awake on
    `tracking || pending`. `dutyHeroState` + `DutyHero` render an amber "You're on duty · No
    signal — you'll sync when you're back online" for `pending`, GO reads END, and the existing
    "saved, not sent" buffered-count chip shows.
  - On the next socket reconnect the session is announced with `startTracking(vehicleId,
    <press time ISO>)`; success → `tracking` (existing `locationDispatch` replay flushes the
    buffer), still-offline → stays `pending`, server refusal → `error` (and `locationDispatch`
    clears the unsendable buffer as `active` goes false).
  - `services/socket.ts`: `startTracking(vehicleId, startedAt?)` includes `startedAt` in the
    emit payload only when a pending shift reconnects; a normal start still emits `{ vehicleId }`.
- **Why:** Offline & Caching Audit chunk 1 — the one flagged-but-unfixed gap. A driver offline
  before tapping GO could not start a shift at all.
- **Contract impact:** `driver:start-tracking` gains an **optional** `startedAt` (ISO string),
  clamped server-side to `[now − 6h, now]`. Backend doc updated:
  `backend/docs/modules/REALTIME.md`. Backwards compatible — omitting it stamps `now` as before.
- **Tests:** `hooks/__tests__/useTrackingSession.test.ts` (+5: offline→pending, pending→tracking
  with startedAt, still-offline stays pending, server refusal→error, END from pending→idle),
  `services/__tests__/socket.test.ts` (+2: offline flag, payload shape with/without startedAt;
  2 existing not-connected assertions updated for `offline: true`),
  `features/dashboard/__tests__/dutyHeroState.test.ts` (+2 pending mappings),
  `features/dashboard/__tests__/DutyHero.test.tsx` (+3 pending render),
  `__integration__/tracking.int.test.tsx` (1 assertion updated for `offline: true`).
- **Docs updated:** LOCATION_TRACKING.md, DASHBOARD.md stub note, TESTING_GUIDE.md
  (socket / useTrackingSession / dutyHeroState / DutyHero rows).
- **Follow-ups / known issues:** A `pending` shift does not survive an app kill before reconnect
  — this matches today's behaviour for a *confirmed* shift (neither survives a cold start) and is
  a shared follow-up, not a regression introduced here. Full suite: 574 pass, same 2 pre-existing
  integration-suite failures as `main` (`bus-registration-dashboard`, `offline-scan-roster`);
  lint 0 errors; typecheck's 4 errors are all pre-existing (ErrorBoundary.tsx, api.test.ts).

---

## 2026-08-23 — Fix main-branch CI red (#49): TripHistoryScreen provider gap + LoginScreen offline-disable test bug
- **Branch:** issue/49-triphistory-networkstatus-ci-fix
- **Modules touched:** none documented (test-only fix, no behavior change)
- **What changed:**
  - `TripHistoryScreen.test.js`'s `renderWithClient` never wrapped `NetworkStatusProvider`, so
    every test threw once `OfflineBanner` (wired in by the audit-remediation merge) called
    `useNetworkStatus()`. Mocked the context the same way `OfflineBanner.test.tsx` already does,
    rather than wrapping the real provider (the screen doesn't exercise network-state behavior).
  - `LoginScreen.test.tsx`'s two offline-disable tests asserted
    `getByTestId('primary-btn').props.disabled`, but `TouchableOpacity`/`Pressable` never forward
    a raw `disabled` prop to the host view — they fold it into `accessibilityState.disabled`
    instead (confirmed by reading `TouchableOpacity.js`, and by the file's own already-passing
    "loading state" test using the correct assertion). Fixed both to read
    `props.accessibilityState?.disabled`, matching the existing pattern. `LoginScreen.tsx` itself
    was already correct — no production code changed.
- **Why:** `main` CI was red (issue #49) — every PR based on `main` inherited these two failures
  regardless of its own changes.
- **Contract impact:** none.
- **Tests:** `TripHistoryScreen.test.js`, `LoginScreen.test.tsx` — both test-only fixes.
- **Docs updated:** n/a — no documented behavior changed.
- **Follow-ups / known issues:** This sandbox's local Jest run diverges from the GitHub Actions
  Node 20 runner in ways unrelated to this fix — a subset of `.tsx` suites (LoginScreen included)
  hit a Babel parse error only in this environment, and several suites using `Animated`-driven
  loading skeletons (`DriverProfileScreen`, `ConfirmSheet`, `DutyHero`, `GoButton`, etc. — none
  touched by this PR) hit an "Unable to locate attached view in the native tree" error locally
  that does not appear in the actual CI logs for this repo. Verified the fix is correct by (a)
  reading `TouchableOpacity`'s source directly, (b) confirming the exact reported
  `useNetworkStatus` error string no longer appears anywhere in a full local run, and (c)
  confirming the Skeleton-animation failure is pre-existing and environment-only by reproducing
  it on an untouched file (`DriverProfileScreen.test.js`). CI is the real gate for both files.

---

## 2026-08-23 — Full-journey integration tests for core driver flows (#29)
- **Branch:** issue/29-core-journey-e2e-tests
- **Modules touched:** docs/modules/AUTH.md, docs/LOCATION_TRACKING.md, docs/modules/BOARDING.md,
  docs/modules/BUS_REGISTRATION.md
- **What changed:** Added four Jest + React Testing Library full-flow integration tests under
  `__integration__/`, each rendering real screens/navigation rather than calling functions in
  isolation: `login-rolegate-flow.int.test.tsx` (non-driver rejected, then a real driver signs in
  and reaches the dashboard), `shift-lifecycle.int.test.tsx` (login → go on duty → location
  stream → end duty), `offline-scan-roster.int.test.tsx` (scan while offline → queued → reconnect
  → replays → roster updates), `bus-registration-dashboard.int.test.tsx` (register a bus →
  Dashboard reflects it after navigating back).
- **Why:** todo 060/061/062, and issue #29's test-coverage gap — every core journey was only
  unit-tested in isolated pieces, with no test walking through any of them start to finish. The
  issue explicitly allows "Maestro or RTL full-flow, whichever fits" per journey; this repo's
  environment has no Maestro binary and CI (`.github/workflows/ci.yml`) doesn't run
  `test:e2e` at all, so RTL full-flow was the only verifiable option.
- **Contract impact:** none — test-only, no `src/` behavior changed.
- **Tests:** added the 4 files above; full suite verified green (`npm test`: 69 suites / 547
  tests passed).
- **Docs updated:** none needed beyond this entry — the 4 covered journeys' module docs already
  describe current behavior accurately.
- **Follow-ups / known issues:**
  - Issue #29's items 5 (route-recording end-to-end) and 6 (payout end-to-end) are **stale, not
    implemented**: both features were removed from the app before this session (commits
    `eba9229`/`e69eeac` removed custom-route recording; earnings/payout UI was removed
    2026-08-07 per this file's own CLAUDE.md note). No `RouteManagementScreen`/
    `CustomRouteRecorder`/`DriverEarningsScreen` exist in `src/`. Writing tests for either would
    mean fabricating UI that doesn't exist, so they were skipped rather than faked.
  - `docs/modules/ROUTE_MANAGEMENT.md` and `docs/modules/EARNINGS.md` (and this repo's top-level
    `CLAUDE.md` map, which still links both) are now stale/misleading — they describe shipped
    features that were since removed. Not fixed here (cross-cutting doc cleanup, out of scope for
    #29); worth its own follow-up issue.
  - Todos `060`/`061`/`062` are **not** moved to `todos/complete/` — their own completion criteria
    are Maestro `.yaml` flow files specifically, which this change does not add (Maestro itself
    remains unavailable in this environment). The underlying journeys they describe are now
    covered by the integration tests above, but the todos themselves stay open pending real
    Maestro infra. Todos `064`/`065` (route recording / earnings E2E) are now moot given the
    feature removals above, not just blocked — worth closing as won't-do in a follow-up rather
    than left implying pending work.
  - `todos/active/*.md` is the real path — issue #29 and the todo-file cross-references in it cite
    a nonexistent `docs/todos/active/*.md` prefix.
  - `npm run typecheck` has 4 pre-existing errors unrelated to this change (`ErrorBoundary.tsx`,
    `src/services/api/__tests__/api.test.ts`) — confirmed present on `main` before this branch;
    not introduced here, not fixed here (out of scope). CI does not run typecheck, only `npm test`.

---

## 2026-07-22 — Documentation system rolled out
- **Branch:** main
- **Modules touched:** docs only (no `src/` change)
- **What changed:** `CLAUDE.md` rewritten as a router; added `docs/modules/` (stubs naming their
  source files), `docs/guides/` (`_MODULE_TEMPLATE`, `ADDING_A_FEATURE`, `ADDING_A_TEST`,
  `RELEASING`), this `CHANGES.md`, `CHANGELOG.md`, a rewritten `docs/README.md` index, and
  `scripts/check-docs.mjs` + `.githooks/pre-push`.
- **Why:** match the user-app/backend docs system so a session lands on the right file fast.
- **Contract impact:** none — docs only.
- **Tests:** none — docs only.
- **Docs updated:** this is the docs work.
- **Follow-ups / known issues:** run `git config core.hooksPath .githooks` once per clone;
  module docs are stubs and must be filled in by the next change touching each area.
