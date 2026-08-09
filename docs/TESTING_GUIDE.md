# Driver App Testing Guide (Traceability)

> Maps each unit/flow to test type, file, cases, and update trigger. Paths reflect the target
> structure. Rows added as the creating TODO lands. "exists ✓" = already in repo.
> Types: **unit** (Jest+RTL), **int** (contract, mocked network/socket), **e2e** (Maestro).

## Auth
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| api/auth.login + useLogin | int+unit | services/api/__tests__/api.test.ts + hooks/auth/__tests__ | posts `{ identifier, password }` (a driver ID *or* an email) to /api/auth/login; sign-in by driver ID keeps `driverCode` on the saved account; **driver role-gate**; 401 | login identifier shape, role gate, or saved-account fields change |
| auth.register/refresh/logout | int | __integration__/auth.int.test.tsx | body, expired refresh→logout | auth flow changes |
| api/auth.getMe + useMeQuery | unit | hooks/auth/__tests__/auth.test.ts | reads the account back from /api/auth/me; refetches on mount instead of trusting the cache, since a manager edits these details elsewhere; `useLogin` keeps `phoneNumber` on the saved account | the profile screen needs another manager-maintained field |
| EnrollmentKeyCard + useMyEnrollmentKeyQuery | unit | features/profile/__tests__/EnrollmentKeyCard.test.tsx + hooks/auth/__tests__/auth.test.ts | covered, the field reads "Tap to reveal" and no character of the key is rendered; tapping it reveals the key on one line, re-hides itself after a timeout, and re-masks when rotated while revealed; Copy puts the real key on the clipboard while the display stays masked, then returns the button to "Copy"; shares a message that names the driver and puts the key on its own line, and stays to those two things; survives Share being unavailable or dismissed; a rotation drops a stale "Copied"; error offers a retry rather than a blank card; the query refetches on mount because a rotation silently voids the cached key | the key card's actions change, the masking rule changes, or the key stops being manager-rotatable |
| DriverProfileScreen "Your details" | unit | screens/__tests__/DriverProfileScreen.test.js | renders the manager's `phoneNumber` (the row read a `phone` field that never existed); server copy wins over the account stored at sign-in for both phone and email; an email the manager cleared disappears rather than lingering; falls back to the stored account while `/me` is in flight | the details shown change, or the merge between stored and server copies changes |
| AuthContext | unit | context/__tests__/AuthContext.test.tsx | load/save/logout/401-refresh/role-gate | auth logic changes |
| Login + role-gate + logout | e2e | .maestro/auth-*.yaml | driver in, non-driver rejected, logout | auth UI changes |

## Bus & Routes
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| useMyBusQuery / registerBus / updateBus | unit+int | hooks/bus/__tests__ + __integration__/bus.int.test.tsx | keys, duplicate plate, 403 other bus | bus schema changes |
| routes (get/management/create) | unit+int | hooks/routes/__tests__ + __integration__/routes.int.test.tsx | public vs protected, create payload | route schema changes |
| Register bus / create route | e2e | .maestro/bus-registration.yaml, route-management.yaml | register→details, create→list | UI changes |

## Tracking (hero)
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| services/socket | unit | services/__tests__/socket.test.ts | emitLocation payload, startTracking ack, stop, cleanup | socket contract changes |
| useTrackingSession | unit | hooks/__tests__/useTrackingSession.test.ts | start ack ok/fail, stop, cleanup, logs the server-refusal reason via console.error on a failed ack (issue #20) | session logic changes |
| useLocationBroadcast | unit | hooks/__tests__/useLocationBroadcast.test.ts | permission, throttle, min-distance, offline buffer/replay, stop removes watcher, **accuracy passthrough on LocationFix (Signal Ink GPS stat chip, UI-only, never sent over the wire)**, **re-checks permission (no prompt) on AppState foreground transition while active and not already watching — starts the watcher if now granted, no-op if already watching/inactive/still denied, listener removed on unmount (issue #26)** | GPS logic changes |
| location service / locationUtils | unit | services/__tests__/location.test.ts, helpers/__tests__/locationUtils.test.ts | permission branches, distance/throttle | location logic changes |
| tracking socket contract | int | __integration__/tracking.int.test.tsx | start/location/stop payloads, ack, reconnect replay | contract changes |
| Start→broadcast→stop, permission, offline | e2e | .maestro/tracking-*.yaml | core lifecycle + permission + offline | tracking UI changes |

## Theme (Signal Ink redesign)
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| theme tokens (signal/ink/duty/type/space/radius) + textStyle/fontFamily helpers | unit | theme/__tests__/theme.test.js | color group presence, English-only font families, overline role, 4pt spacing scale, textStyle output per role/weight/color, fontFamily weight resolution | STYLEGUIDE.md token values change |
| constants/theme.js compat shim | unit | theme/__tests__/theme.test.js | COLORS/FONTS/SPACING/BORDER_RADIUS/SHADOWS map onto the new theme tokens (old "bold" → Inter medium) | shim mapping changes, or shim is deleted (Phase 6) |

## UI kit primitives (Signal Ink, `src/components/ui/`)
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| AppText | unit | components/ui/__tests__/AppText.test.js | default/onInk/explicit color, overline uppercase+letter-spacing, display size, `weight` prop overrides the variant's default (e.g. "body medium") | type-scale role changes |
| Card | unit | components/ui/__tests__/Card.test.js | renders children, optional title, no-title case | STYLEGUIDE §6.1 Card spec changes |
| ListRow | unit | components/ui/__tests__/ListRow.test.js | title/subtitle/value render, onPress fires, non-pressable without onPress | STYLEGUIDE §6.1 ListRow spec changes |
| StatusPill | unit | components/ui/__tests__/StatusPill.test.tsx | label render, neutral/live/warn/danger color mapping, default variant | STYLEGUIDE §6.1 StatusPill spec changes |
| EmptyState | unit | components/ui/__tests__/EmptyState.test.js | title/subtitle render, action button fires onAction, omitted without action props, `fill` applies flex:1 (and only then) so an empty list centres in the space left rather than stranding at the top | STYLEGUIDE §6.1 EmptyState spec changes |
| Skeleton | unit | components/ui/__tests__/Skeleton.test.tsx | renders, width/height/radius applied, pulse loop skipped under reduce-motion | STYLEGUIDE §5 motion tokens change |
| ConfirmSheet | unit | components/ui/__tests__/ConfirmSheet.test.tsx | title/message render, confirm/cancel callbacks fire, default cancel label | STYLEGUIDE §6.2 ConfirmSheet spec changes |
| FormInput (Input spec) | unit | components/ui/__tests__/components.test.js | label/placeholder render, error text render/omit | STYLEGUIDE §6.1 Input spec changes |
| PrimaryButton (Button spec) | unit | components/ui/__tests__/components.test.js | title render, loading spinner + testID, disabled blocks onPress, primary/secondary/danger variants | STYLEGUIDE §6.1 Button spec changes |
| InfoRow / SectionCard / LoadingScreen / ScreenHeader | unit | components/ui/__tests__/components.test.js | existing render assertions (kept green through recolor + ScreenHeader left-align) | STYLEGUIDE §6.1 spec changes |
| OfflineBanner / InlineError / ErrorState | unit | components/ui/__tests__ (existing files) | existing behavior assertions (kept green through recolor to warning/danger tokens) | STYLEGUIDE §2 token values change |
| TrackingStatusBadge (alias → StatusPill) | unit | components/ui/__tests__/TrackingStatusBadge.test.tsx | existing status→label assertions (kept green through the StatusPill alias) | deleted in Phase 6 once TrackingStatusCard is removed |

## Home / DutyHero (Signal Ink)
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| Quick actions (Home) | unit | screens/__tests__/DriverDashboard.test.js | My routes row navigates to RouteManagement, so the route list is reachable without going via Profile | Home action rows change |
| Go on duty failure surfaced (issue #20) | unit | screens/__tests__/DriverDashboard.test.js | a `useTrackingSession` error state pops an `Alert.alert` with the specific server-refusal message; idle status never alerts | error-surfacing UI or the tracking-session error shape changes |
| dutyHeroState (pure state machine) | unit | features/dashboard/__tests__/dutyHeroState.test.ts | off duty (bus/no bus/connecting), live, live+updated-Ns-ago, reconnecting (priority over denied), permission denied, gpsQualityLabel thresholds; unassigned-vehicle messaging (issue #21): distinct subline when `hadVehicleBefore` is true, ignored once a vehicle is present again | STYLEGUIDE §6.2/§8 DutyHero states or copy change |
| DutyHero | unit | features/dashboard/__tests__/DutyHero.test.tsx | greeting (with/without bus name), off-duty/no-bus/live/reconnecting/permission-denied states, GO/END callbacks, stat chip values (timer, updates-sent counter, GPS), busy accessibilityState while starting; no-vehicle vs. unassigned-after-having-one messaging (issue #21) | DutyHero wiring or STYLEGUIDE spec changes |
| DriverDashboard — unassigned-vehicle messaging (issue #21) | unit | screens/__tests__/DriverDashboard.test.js | never-registered driver sees the generic register message; a driver who previously had a vehicle (persisted in AsyncStorage `driver_had_vehicle_before`) sees the distinct "assignment was removed" message once the vehicle disappears; the flag is persisted the first time a vehicle is observed | vehicle-presence tracking or the persisted-flag key changes |
| GoButton | unit | features/dashboard/__tests__/GoButton.test.tsx | GO/END label+a11y-label, onPress fires, disabled blocks press, disabled/busy accessibilityState, idle pulse ring only when off-duty+enabled | STYLEGUIDE §6.2 GoButton spec changes |
| StatChip | unit | features/dashboard/__tests__/StatChip.test.tsx | value/label render | STYLEGUIDE §6.2 StatChip spec changes |
| VehicleCard (renamed from AssignedBusCard) | unit | features/dashboard/__tests__/VehicleCard.test.tsx | shows the vehicle name only — no internal ID, no seat count; route name as the sub-line when present (absent, not blank, when there is none); renders the `bus` Ionicons glyph rather than the missing-icon "?" that `name="vehicle"` produced; no-bus EmptyState + Add-my-bus action; visibility pill reads Hidden off duty and Visible while broadcasting, and is absent when there is no vehicle | STYLEGUIDE §6.2 VehicleCard spec changes, or seat/ID display returns |
| Vehicle registration without a seat count | unit | screens/__tests__/VehicleRegistrationScreen.test.js | the form has no Seats field, submit is not blocked on one, and `seatCapacity` is absent from the registerVehicle payload | the seat-count field returns, or the backend requires seatCapacity again (validators.js validateCreateVehicle) |
| VehicleRegistrationScreen uses useRegisterVehicle, not a raw authenticatedRequest call (issue #19) | unit | screens/__tests__/VehicleRegistrationScreen.test.js | successful save invalidates `qk.myVehicle()` (`['vehicle', 'mine']`) so the Dashboard's VehicleCard reflects the new vehicle immediately on goBack, instead of waiting out its 5-minute staleTime; `api.registerVehicle` is called with the correct `(vehicleData, token)` argument order | the screen stops using the `useRegisterVehicle` hook, or the myVehicle query key changes |
| CustomRouteSection (restyled, `children` prop removed) | unit | features/dashboard/__tests__/CustomRouteSection.test.tsx | renders null when no custom-route content, awaiting-naming card, create-mode recorder, update-mode recorder, update-route banner + button | recorder/update flow or restyle changes |
| PermissionDeniedState (restyled, STYLEGUIDE §8 copy) | unit | components/__tests__/PermissionDeniedState.test.tsx | shows exact §8 copy, Allow-location button opens Settings | copy or Settings-link behavior changes |
| useLocationBroadcast — accuracy passthrough | unit | hooks/__tests__/useLocationBroadcast.test.ts | accuracy carried onto lastFix when reported, undefined when not (UI-only; never sent over the wire) | GPS stat chip data source changes |
| AppNavigator (MainTabs + root stack) | unit | navigation/__tests__/AppNavigator.test.js | 4 tabs render with Home active by default, tab switch, BusRegistration/RouteManagement push above tabs, login/loading gates | navigation structure changes |

## Trips tab (Signal Ink)
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| TripHistoryScreen (Card+ListRow pattern) | unit | screens/__tests__/TripHistoryScreen.test.js | header copy, row render (route/date/start time), no money or payment status rendered even for legacy records, empty state (incl. on fetch failure), pull-to-refresh reload | STYLEGUIDE §7.2 Trips spec or copy changes |

## Profile / Bus registration / My routes / Login (Signal Ink)
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| DriverProfileScreen (identity block + logout moved here) | unit | screens/__tests__/DriverProfileScreen.test.js | header/avatar-initial/identity render, My routes navigation, bus EmptyState → BusRegistration nav, logout opens ConfirmSheet then calls the mutation, Replay-tutorial row shown only for custom routes | Profile layout, logout flow, or custom-route gating changes |
| BusRegistrationScreen (single Card, Saved pill, InlineError) | unit | screens/__tests__/BusRegistrationScreen.test.js | header copy, blocked submit shows field errors, successful save shows Saved pill + delayed goBack, failed save shows InlineError, booking toggle | form fields, save flow, or copy changes |
| RouteManagementScreen ("My routes" header, success Card) | unit | screens/__tests__/RouteManagementScreen.test.tsx | header copy, existing routes render, "{name} added." banner after create | screen wiring or copy changes |
| RouteForm (Card + FormInput) | unit | features/route-management/__tests__/RouteForm.test.tsx | field errors, normalized submit payload, form clears after submit, mutation error message | form fields or validation changes |
| RouteListItem (Card + StatusPill) | unit | features/route-management/__tests__/RouteListItem.test.tsx | route details render, ACTIVE/INACTIVE StatusPill | STYLEGUIDE route-card spec changes |
| RouteList (EmptyState) | unit | features/route-management/__tests__/RouteList.test.tsx | routes render with count badge, empty state copy, error+retry | list spec or copy changes |
| LoginScreen (ink hero top 35%) | unit | screens/__tests__/LoginScreen.test.tsx | "Driver ID or email" + password inputs render, blocked submit + inline errors, signs in with either an email or a driver ID, identifier is trimmed, role-gate error copy, loading state | validation, the sign-in identifier, role gate, or copy changes |
| ShiftBusIcon (recolorable body/detail) | unit | components/__tests__/ShiftBusIcon.test.js | renders at given size, defaults to signal/white, accepts custom colors | mark recoloring changes |
| lib/errors — INVALID_CREDENTIALS copy | unit | lib/__tests__/errors.test.ts | returns the exact STYLEGUIDE §8 "Wrong email or password. Try again." string | auth error copy changes |

## Cross-cutting
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| api transport | unit | services/api/__tests__/transport.test.ts | timeout, size, single read, **code preserved** | transport changes |
| lib/errors | unit | lib/__tests__/errors.test.ts | kinds incl permission/tracking, no leak, tracking-kind copy is jargon-free ("Couldn't confirm you're online with the server…") | taxonomy or copy changes |
| ErrorState/InlineError/OfflineBanner | unit | components/ui/__tests__ | states, Retry, offline, ErrorState `message` override (pull-to-refresh copy) | error UX changes |
| backendStatus | unit | services/__tests__/backendStatus.test.ts | monitor, subscribe, patterns | health logic changes |
| Offline cold start | e2e | .maestro/offline-*.yaml | cached + banner | offline behavior changes |

## Motion, copy, a11y pass (Phase 5)
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| Reduce-motion gating | unit | components/ui/__tests__/Skeleton.test.tsx, components/ui/__tests__/ConfirmSheet.test.tsx, features/dashboard/__tests__/GoButton.test.tsx | each animated loop/entrance checks `AccessibilityInfo.isReduceMotionEnabled()` and skips/snaps when true (ring/sheet/skeleton still render, just don't animate) | STYLEGUIDE §5 motion tokens or reduce-motion handling changes |
| ErrorState `message` override on pull-to-refresh lists | unit | features/earnings/__tests__/EarningsHistoryList.test.tsx, features/earnings/__tests__/DailyBreakdownChart.test.tsx, features/route-management/__tests__/RouteList.test.tsx | list error states render the exact STYLEGUIDE §8 "Couldn't load. Pull down to try again." copy instead of the raw AppError message | list error copy changes |
| Jargon-free copy (socket/session/fix/tracking absent from rendered strings) | unit | components/ui/__tests__/TrackingStatusBadge.test.tsx, lib/__tests__/errors.test.ts, components/__tests__/CustomRouteRecorder.test.js | TrackingStatusBadge "Live" label (was "Tracking"), errors.ts tracking-kind copy, CustomRouteRecorder's no-fix Alert copy ("No location yet" / "location update") | any new user-facing string — re-run the copy grep before merging |
| FormInput accessibilityLabel | unit | components/ui/__tests__/components.test.js | TextInput exposes an accessibilityLabel derived from `label` (falls back to `placeholder`) | Input a11y spec changes |
| GoButton accessibilityLabel/State | unit | features/dashboard/__tests__/GoButton.test.tsx | "Go online"/"End journey" label swap, `accessibilityState={{ disabled, busy }}` | GoButton states change |

## Custom Route Recording (school/work shuttles)
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| helpers/geo.js (haversine/distance/elapsed/breadcrumb cap) | unit | src/helpers/__tests__/geo.test.js | distance calc, degenerate input, elapsed formatting; appendBreadcrumbPoint (issue #17): normal-length recordings unaffected, halves resolution once MAX_BREADCRUMB_POINTS is exceeded, always keeps the newest point, stays bounded across many points instead of growing forever | geo math or the breadcrumb cap changes |
| CustomRouteRecorder | unit (Jest+RTL) | src/components/__tests__/CustomRouteRecorder.test.js | coach-mark first-run gating, Track/Add Stop/Complete state machine, breadcrumb accumulation + AsyncStorage persistence, crash/background recovery (resume/submit/discard), add-stop guards (no fix yet, too-close dedupe), record POST payload shape, **update mode** (Phase 2): update-specific copy, no onboarding tour, submits via recordRouteUpdate with routeId, mode-specific AsyncStorage buffer key | recording flow, coach-marks, update mode, or AsyncStorage buffer shape changes |
| DriverDashboard — Update Route banner (Phase 2) | unit (Jest+RTL) | src/screens/__tests__/DriverDashboard.test.js | banner hidden for normal/no-flag routes, shown when an ACTIVE custom route has a pending change request, tapping it opens CustomRouteRecorder in update mode with the right routeId | off-route flag banner or Update Route entry point changes |

## Boarding / QR Attendance
| Item | Type | Test file | Cases | Update when |
|---|---|---|---|---|
| useBoardingScan | unit | features/boarding/__tests__/useBoardingScan.test.ts | submit success/debounced/error, offline queueing + replay-on-reconnect | scan submission or offline-queue logic changes |
| QRScannerScreen | unit (Jest+RTL) | screens/__tests__/QRScannerScreen.test.tsx | permission-denied state, submits scanned data, success/debounced/error feedback banners | scan screen UI or feedback copy changes |
| QRScannerScreen cooldown feedback + queueing (issue #11) | unit (Jest+RTL) | screens/__tests__/QRScannerScreen.test.tsx | a scan landing during the 3s post-scan cooldown shows an explicit "Please wait a moment" banner instead of being silently dropped; it auto-fires the moment the cooldown clears, without a manual re-scan; a later scan during the same cooldown replaces an earlier queued one (only the latest fires); the lock clears cleanly with nothing queued | the cooldown window, queueing behavior, or feedback copy changes |

## Existing tests (keep green)
- helpers/__tests__/formatters.test.js ✓
- helpers/__tests__/geo.test.js ✓
- components/ui/__tests__/components.test.js ✓
- components/__tests__/CustomRouteRecorder.test.js ✓
- screens/__tests__/DriverDashboard.test.js ✓

Full current suite: 350 tests across 56 suites, run via `npm test`. See the sections above for
per-area coverage — this list is not exhaustive, just the pre-Signal-Ink baseline.
