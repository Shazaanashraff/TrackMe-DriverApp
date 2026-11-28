# Driver app — screens with and without internet (release APK, Android 15 emulator)

**How it was captured**
- `expo prebuild` → `gradlew assembleRelease` (x86_64) with `EXPO_PUBLIC_API_URL=https://trackme-backend-jton.onrender.com`. The JS bundle is inside the APK (`app-release.apk`, ~49 MB), so launching needs no Metro/dev server.
- Installed with `adb install` on AVD `pingo_test`, launched from the launcher icon. Logged in as the seeded Play-reviewer driver (**no vehicle registered**).
- "Offline" = emulator airplane mode + Wi-Fi off (NetInfo reports `isConnected=false` → state `offline`).

## How the app loads from the build
1. Native splash (`01_splash`) → fonts load (`App.js` holds the splash until Inter is ready).
2. `AuthProvider` reads the saved session from AsyncStorage → `LoadingScreen` → either the auth stack (Login) or the app stack (MainTabs).
3. `PersistQueryClientProvider` rehydrates the TanStack Query cache from AsyncStorage, which is why cached data still renders on a cold start with no network (`28`, `29`).
4. `NetworkStatusProvider` starts NetInfo + a 30 s `/health` poll → state `online | degraded | offline`.

## Signed out
| Screen | Online | Offline |
|---|---|---|
| Login | `02_login_online` | `04_login_offline` — Sign in disabled, note "You need a connection to sign in."; tapping does nothing (`06`) |
| Forgot password | `03_forgot_password_online` | `05_forgot_password_offline` — Send code disabled + note |

## Signed in
| Screen | Online | Offline |
|---|---|---|
| Home | `10_home_online` | `20_home_offline` — renders from cache; **no offline banner on Home** |
| Scan rider QR (no vehicle) | — | `21_scan_qr_tapped_offline` — disabled either way ("Register a vehicle first"), tap is a no-op |
| Riders | `11_riders_online` | `22_riders_offline` |
| Riders → Absences | `17_riders_absences_tab_online` | `23_riders_absences_offline` |
| Trips | `12_trips_online` | `24_trips_offline` — amber banner "No connection — showing cached data" |
| Profile | `13_profile_online` | `25_profile_offline` — name, key card, vehicle all from cache |
| Vehicle registration | `14_vehicle_registration_online` | `26_vehicle_registration_offline` — Save disabled + "You need a connection to save your vehicle. Your details are kept…"; tap is a no-op (`27`) |
| Cold start, no network | — | `28_cold_start_offline_home`, `29_cold_start_offline_profile` |

## Button behaviour offline (observed)
- **Disabled + amber note:** Sign in, Send code, Save vehicle (and by code: OTP verify/resend, Reset password).
- **Still tappable:** tab navigation, back, Absences/On-my-way cards, Reveal/Copy key (local).
- **Offline banner shown only on:** Trips and Boarding roster (`OfflineBanner`). Home, Riders and Profile show cached data silently.

## NOT covered (this driver has no vehicle)
Go live / On duty hero, Scan QR camera, Boarding roster, populated Trips/Riders, Rider profile, forgot-password OTP/reset steps. These need a driver with a registered vehicle (and mocked GPS for Go live) — say if you want a second pass with one.

## Findings worth a look
- Home and Profile have no offline indicator, unlike Trips/Roster — inconsistent.
- Go live offline could not be exercised; `docs/modules/OFFLINE_STATUS.md` is still unwritten (queued-GPS-while-offline is the open question).
