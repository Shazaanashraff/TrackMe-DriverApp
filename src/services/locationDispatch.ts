import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitLocation, getConnectionState, onConnectionStateChange } from './socket';
import { shouldEmit, LocationFix } from '../helpers/locationUtils';

export const MIN_DISTANCE_METERS = 3;
export const MIN_INTERVAL_MS = 2500;
// A fix this old is sent even if the vehicle hasn't moved. The backend ends a
// session it hasn't heard from for LIVE_STALE_AFTER_MS (90s, see the backend's
// docs/modules/REALTIME.md §7), and the distance gate below is silent for as
// long as a shuttle sits at a stop — so without this a parked-but-on-duty
// vehicle goes OFFLINE for every rider. Comfortably inside 90s, so two lost
// heartbeats in a row still don't end the shift.
export const MAX_INTERVAL_MS = 30_000;
// Matches the burst the backend's driver:location rate limit is sized for
// (60/s) — a larger buffer would NACK its own tail on replay and livelock.
export const MAX_BUFFER_SIZE = 50;
// Consecutive NACKs (the server rejecting an update while the socket believes
// it's connected — e.g. repeated ack timeouts, issue #13) before surfacing a
// "lost connection" warning to the driver (issue #30). A single rejection is
// common and already handled by re-buffering; only a run of them is worth
// alarming on. The streak lives here rather than in the hook because the
// background task emits through this module with no React tree mounted.
export const REJECTION_STREAK_THRESHOLD = 5;

const BUFFER_KEY = 'driver_location_buffer';
const TARGET_KEY = 'driver_tracking_target';

export interface TrackingTarget {
  vehicleId: string;
  routeId: string;
}

type FixListener = (fix: LocationFix) => void;
type BufferListener = (count: number) => void;
type LostConnectionListener = (lost: boolean) => void;

let target: TrackingTarget | null = null;
let lastEmitted: LocationFix | null = null;
let buffer: LocationFix[] = [];
let fixListeners: FixListener[] = [];
let bufferListeners: BufferListener[] = [];
let lostConnectionListeners: LostConnectionListener[] = [];
let rejectionStreak = 0;
let lostConnection = false;
let replayUnsubscribe: (() => void) | null = null;
let keepaliveTimer: ReturnType<typeof setTimeout> | null = null;

function clearKeepalive() {
  if (!keepaliveTimer) return;
  clearTimeout(keepaliveTimer);
  keepaliveTimer = null;
}

/**
 * Re-sends the last known fix when the GPS has gone quiet — see MAX_INTERVAL_MS.
 * It can go quiet for two reasons: the platform stops delivering callbacks for a
 * stationary device (guaranteed in a browser, where the position only changes
 * when the network location does), or it delivers them and the distance gate
 * drops every one.
 *
 * Timer-based, so it only covers a running JS runtime. A suspended iOS app is
 * still held up by the OS background task's own fixes, and by the backend's
 * 30s disconnect grace.
 */
function scheduleKeepalive() {
  clearKeepalive();
  if (!target) return;
  keepaliveTimer = setTimeout(() => {
    keepaliveTimer = null;
    if (!target || !lastEmitted) return;
    dispatchFix({ ...lastEmitted, timestamp: Date.now() });
  }, MAX_INTERVAL_MS);
}

function notifyBuffer() {
  bufferListeners.forEach((cb) => {
    try {
      cb(buffer.length);
    } catch {
      /* a listener throwing must not break the GPS pump */
    }
  });
}

async function persistBuffer() {
  try {
    await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(buffer));
  } catch {
    /* buffer spill is best-effort; in-memory copy is still authoritative */
  }
}

function setLostConnection(next: boolean) {
  if (lostConnection === next) return;
  lostConnection = next;
  lostConnectionListeners.forEach((cb) => {
    try {
      cb(next);
    } catch {
      /* see notifyBuffer */
    }
  });
}

/** Folds one ack outcome into the rejection streak behind the warning. */
function noteAckOutcome(nacked: boolean) {
  if (!nacked) {
    rejectionStreak = 0;
    setLostConnection(false);
    return;
  }
  rejectionStreak += 1;
  if (rejectionStreak >= REJECTION_STREAK_THRESHOLD) setLostConnection(true);
}

function isNackResponse(response: unknown): boolean {
  return (
    !!response &&
    typeof response === 'object' &&
    (response as { success?: boolean }).success === false
  );
}

function pushToBuffer(fix: LocationFix) {
  buffer.push(fix);
  if (buffer.length > MAX_BUFFER_SIZE) buffer.shift();
  notifyBuffer();
  void persistBuffer();
}

function emitFix(fix: LocationFix) {
  if (!target) return;
  emitLocation(target.vehicleId, target.routeId, fix.lat, fix.lng, (response: unknown) => {
    const nacked = isNackResponse(response);
    if (nacked) pushToBuffer(fix);
    noteAckOutcome(nacked);
  });
}

/**
 * The single entry point for a GPS fix, from either the foreground watcher or
 * the headless background task. Applies the throttle, then emits or buffers.
 * Returns false when the fix was throttled away.
 */
export function dispatchFix(fix: LocationFix): boolean {
  if (!shouldEmit(lastEmitted, fix, MIN_DISTANCE_METERS, MIN_INTERVAL_MS, MAX_INTERVAL_MS)) {
    return false;
  }
  lastEmitted = fix;
  scheduleKeepalive();

  fixListeners.forEach((cb) => {
    try {
      cb(fix);
    } catch {
      /* see notifyBuffer */
    }
  });

  if (getConnectionState().status !== 'connected') {
    pushToBuffer(fix);
    return true;
  }
  emitFix(fix);
  return true;
}

export function replayBuffer() {
  if (!buffer.length) return;
  const queued = buffer;
  buffer = [];
  notifyBuffer();
  void persistBuffer();
  // Oldest-first. The backend ACKs an out-of-order fix as {stale:true} success
  // rather than a NACK, so a replayed batch can't re-buffer itself forever.
  queued.forEach(emitFix);
}

export async function setTrackingTarget(next: TrackingTarget | null) {
  target = next;
  if (!next) clearKeepalive();
  try {
    if (next) await AsyncStorage.setItem(TARGET_KEY, JSON.stringify(next));
    else await AsyncStorage.removeItem(TARGET_KEY);
  } catch {
    /* in-memory target still serves this process */
  }
}

export function getTrackingTarget(): TrackingTarget | null {
  return target;
}

/**
 * Rehydrates target and buffer after a headless background launch, where the
 * process starts with no React tree having run.
 */
export async function restoreDispatchState() {
  try {
    if (!target) {
      const stored = await AsyncStorage.getItem(TARGET_KEY);
      if (stored) target = JSON.parse(stored) as TrackingTarget;
    }
    if (!buffer.length) {
      const stored = await AsyncStorage.getItem(BUFFER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          buffer = parsed.slice(-MAX_BUFFER_SIZE);
          notifyBuffer();
        }
      }
    }
  } catch {
    /* corrupt storage must not block a shift from broadcasting */
  }
}

export function startReplayOnReconnect() {
  if (replayUnsubscribe) return;
  replayUnsubscribe = onConnectionStateChange((state) => {
    if (state.status === 'connected') replayBuffer();
  });
}

export function stopReplayOnReconnect() {
  replayUnsubscribe?.();
  replayUnsubscribe = null;
}

export function subscribeToFixes(cb: FixListener): () => void {
  fixListeners.push(cb);
  return () => {
    fixListeners = fixListeners.filter((listener) => listener !== cb);
  };
}

export function subscribeToBufferCount(cb: BufferListener): () => void {
  bufferListeners.push(cb);
  return () => {
    bufferListeners = bufferListeners.filter((listener) => listener !== cb);
  };
}

export function getBufferedCount(): number {
  return buffer.length;
}

/**
 * Whether the server has rejected REJECTION_STREAK_THRESHOLD updates in a row —
 * distinct from the offline buffer, since these rejections happen while the
 * socket still believes it is connected (issue #30).
 */
export function subscribeToLostConnection(cb: LostConnectionListener): () => void {
  lostConnectionListeners.push(cb);
  return () => {
    lostConnectionListeners = lostConnectionListeners.filter((listener) => listener !== cb);
  };
}

export function getLostConnection(): boolean {
  return lostConnection;
}

/** Clears throttle + buffer at the end of a shift so the next one starts fresh. */
export async function resetDispatch() {
  clearKeepalive();
  lastEmitted = null;
  buffer = [];
  rejectionStreak = 0;
  setLostConnection(false);
  notifyBuffer();
  await setTrackingTarget(null);
  try {
    await AsyncStorage.removeItem(BUFFER_KEY);
  } catch {
    /* nothing actionable */
  }
}
