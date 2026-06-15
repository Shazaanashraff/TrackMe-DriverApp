# Driver App — Optimisation Guide

> Perf + reliability targets, weighted toward the driver's reality: a phone on a mount,
> screen on for hours, GPS streaming, often patchy mobile data. Battery and offline tolerance
> matter more here than raw fps. Phase 7 TODOs implement these (after the restructure).

## Targets
- GPS broadcast continues reliably for a full shift without draining the battery.
- No dropped location data across brief network blips (buffer + replay).
- Lists (earnings, trip history) scroll smoothly.
- Cold start < 3s; tracking starts within ~2s of tapping start.

## 1. Location batching & battery (the big one — TODO 071)
- `Accuracy.High` default (not `BestForNavigation`); expose a high-accuracy toggle.
- **Adaptive interval**: emit faster when moving, slower when stationary; **skip emits below a
  min distance delta** (use `locationUtils.distance`). Huge battery saver vs. fixed 3s.
- Batch fixes into one emit per N seconds if the backend accepts arrays (else send latest).
- **Stop the watcher the instant tracking stops** — a leaked watcher is the #1 drain.
- Use `expo-keep-awake` only while the dashboard is foreground + tracking.

## 2. Background tracking (TODO 072)
- Decide foreground-only vs background. If background: `expo-location`
  `startLocationUpdatesAsync` + TaskManager + Android foreground-service notification +
  iOS `UIBackgroundModes: location`. Permission-sensitive + store-compliance notes required.

## 3. Offline GPS buffer (TODO 073)
- Ring buffer (e.g. 500 fixes) in memory + optional AsyncStorage spill; replay in timestamp
  order on reconnect; backend dedupes. Show "buffering — N queued".

## 4. Lists (earnings history, trip history — TODO 070)
- `FlatList` with `keyExtractor`, `getItemLayout`, `windowSize`, `removeClippedSubviews`,
  `maxToRenderPerBatch`; memoized rows + stable callbacks; pull-to-refresh → `refetch`.

## 5. Re-render hygiene
- Split context so token refresh doesn't re-render the dashboard mid-tracking.
- Keep the tracking status in a dedicated hook; don't re-render the whole screen on each fix.
- TanStack Query `select` to subscribe to slices.

## 6. Bundle & startup
- Verify **Hermes** (SDK 54 default). Lazy-load heavy screens (Earnings charts). Defer
  post-navigation work with `InteractionManager.runAfterInteractions`. Audit fonts/deps on the
  critical path (UberMove loads at splash — keep it lean).

## 7. Network
- Caching per DATA_LAYER.md (bus/routes/earnings persisted). Pagination + `keepPreviousData`
  on history to avoid flicker.

## Verification
Completion tests assert the technique is present (adaptive interval, min-distance skip, buffer
replay, getItemLayout, lazy import) since battery/fps aren't unit-testable; record before/after
battery + a manual shift-length test in the PR.
