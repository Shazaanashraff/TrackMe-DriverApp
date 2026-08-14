import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitLocation, getConnectionState, onConnectionStateChange } from './socket';
import { shouldEmit, LocationFix } from '../helpers/locationUtils';

export const MIN_DISTANCE_METERS = 3;
export const MIN_INTERVAL_MS = 2500;
// Matches the burst the backend's driver:location rate limit is sized for
// (60/s) — a larger buffer would NACK its own tail on replay and livelock.
export const MAX_BUFFER_SIZE = 50;

const BUFFER_KEY = 'driver_location_buffer';
const TARGET_KEY = 'driver_tracking_target';

export interface TrackingTarget {
  vehicleId: string;
  routeId: string;
}

type FixListener = (fix: LocationFix) => void;
type BufferListener = (count: number) => void;

let target: TrackingTarget | null = null;
let lastEmitted: LocationFix | null = null;
let buffer: LocationFix[] = [];
let fixListeners: FixListener[] = [];
let bufferListeners: BufferListener[] = [];
let replayUnsubscribe: (() => void) | null = null;

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
    if (isNackResponse(response)) pushToBuffer(fix);
  });
}

/**
 * The single entry point for a GPS fix, from either the foreground watcher or
 * the headless background task. Applies the throttle, then emits or buffers.
 * Returns false when the fix was throttled away.
 */
export function dispatchFix(fix: LocationFix): boolean {
  if (!shouldEmit(lastEmitted, fix, MIN_DISTANCE_METERS, MIN_INTERVAL_MS)) return false;
  lastEmitted = fix;

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

/** Clears throttle + buffer at the end of a shift so the next one starts fresh. */
export async function resetDispatch() {
  lastEmitted = null;
  buffer = [];
  notifyBuffer();
  await setTrackingTarget(null);
  try {
    await AsyncStorage.removeItem(BUFFER_KEY);
  } catch {
    /* nothing actionable */
  }
}
