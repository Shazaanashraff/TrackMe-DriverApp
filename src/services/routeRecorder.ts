import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscribeToFixes } from './locationDispatch';
import { LocationFix } from '../helpers/locationUtils';
import { appendBreadcrumbPoint, haversineMeters, totalDistanceMeters } from '../helpers/geo';
import type { CustomRouteRunPayload } from './api/customRoutes';

// Records one ride of a custom route: the GPS fixes the shift already produces, plus
// the stops the driver taps. It adds no GPS watcher of its own - it listens to the
// same dispatch pipeline the live broadcast uses, so foreground and background fixes
// both land here. Module-level (not a hook) for the same reason locationDispatch is:
// the OS can deliver background fixes with no React tree mounted.

const ACTIVE_KEY = 'route_recording_active';
const QUEUE_KEY = 'route_recording_queue';

// A tap this close to the previous stop is a double tap, not a new stop.
export const MIN_STOP_SPACING_METERS = 20;
// Save to storage this often, so a killed app loses seconds of a ride, not all of it.
export const PERSIST_EVERY_POINTS = 10;
// A saved ride older than this is not picked up again when the driver goes on duty: a
// new shift must not be glued onto yesterday's unfinished one.
export const RESUME_WINDOW_MS = 3 * 60 * 60 * 1000;
// A ride that never reached the server is kept this many deep.
const MAX_QUEUED_RUNS = 10;
// Longest stop name sent to the server (it trims to the same length).
export const MAX_STOP_NAME_LENGTH = 80;

export interface RecordedPoint { lat: number; lng: number; t: number; acc?: number | null }
export interface RecordedStop { lat: number; lng: number; t: number; name: string }

export interface ActiveRecording {
  clientRunId: string;
  vehicleId: string;
  startedAt: number;
  points: RecordedPoint[];
  stops: RecordedStop[];
}

export type AddStopResult =
  | { ok: true; stop: RecordedStop }
  | { ok: false; reason: 'NOT_RECORDING' | 'NO_FIX' | 'TOO_CLOSE' };

type Listener = (recording: ActiveRecording | null) => void;

let active: ActiveRecording | null = null;
let unsubscribeFixes: (() => void) | null = null;
let listeners: Listener[] = [];
let sincePersist = 0;
let lastFix: RecordedPoint | null = null;

function notify() {
  listeners.forEach((cb) => {
    try {
      cb(active);
    } catch {
      /* a listener throwing must not break the GPS pump */
    }
  });
}

async function persist() {
  try {
    if (active) await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
    else await AsyncStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* in-memory copy is still authoritative */
  }
}

function newRunId(): string {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function onFix(fix: LocationFix) {
  lastFix = { lat: fix.lat, lng: fix.lng, t: fix.timestamp, acc: fix.accuracy ?? null };
  if (!active) return;
  active = {
    ...active,
    points: appendBreadcrumbPoint(active.points, lastFix),
  };
  sincePersist += 1;
  if (sincePersist >= PERSIST_EVERY_POINTS) {
    sincePersist = 0;
    void persist();
  }
  notify();
}

function listen() {
  if (!unsubscribeFixes) unsubscribeFixes = subscribeToFixes(onFix);
}

function stopListening() {
  unsubscribeFixes?.();
  unsubscribeFixes = null;
}

export function getRecording(): ActiveRecording | null {
  return active;
}

export function subscribeToRecording(cb: Listener): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

/**
 * Starts recording a ride, or carries on with one that was interrupted (the app was
 * killed or crashed mid-ride) for the same vehicle. Returns the active recording.
 */
export async function startRecording(vehicleId: string): Promise<ActiveRecording> {
  if (active && active.vehicleId === vehicleId) {
    listen();
    return active;
  }

  let resumed: ActiveRecording | null = null;
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    const saved = raw ? (JSON.parse(raw) as ActiveRecording) : null;
    const lastT = saved?.points?.length ? saved.points[saved.points.length - 1].t : saved?.startedAt;
    const fresh = typeof lastT === 'number' && Date.now() - lastT <= RESUME_WINDOW_MS;
    if (saved && saved.vehicleId === vehicleId && Array.isArray(saved.points) && fresh) resumed = saved;
  } catch {
    /* an unreadable save is the same as none */
  }

  active = resumed || {
    clientRunId: newRunId(),
    vehicleId,
    startedAt: Date.now(),
    points: [],
    stops: [],
  };
  sincePersist = 0;
  listen();
  await persist();
  notify();
  return active;
}

/**
 * Marks a stop where the vehicle is now. Refuses when there is no fix yet, or the
 * driver tapped twice at the same place.
 */
export function addStop(name = ''): AddStopResult {
  if (!active) return { ok: false, reason: 'NOT_RECORDING' };
  const here = lastFix || active.points[active.points.length - 1];
  if (!here) return { ok: false, reason: 'NO_FIX' };

  const previous = active.stops[active.stops.length - 1];
  if (previous && haversineMeters(previous.lat, previous.lng, here.lat, here.lng) < MIN_STOP_SPACING_METERS) {
    return { ok: false, reason: 'TOO_CLOSE' };
  }

  const stop: RecordedStop = { lat: here.lat, lng: here.lng, t: Date.now(), name: name.trim().slice(0, MAX_STOP_NAME_LENGTH) };
  active = { ...active, stops: [...active.stops, stop] };
  void persist();
  notify();
  return { ok: true, stop };
}

/**
 * Gives a stop already marked on this ride a name ("Nimal's house"). The stop is found by
 * the time it was marked, so naming it after the driver has driven on still hits the
 * right one. Returns false when there is no such stop (ride ended, or already discarded).
 */
export function nameStop(markedAt: number, name: string): boolean {
  if (!active) return false;
  const index = active.stops.findIndex((s) => s.t === markedAt);
  if (index === -1) return false;
  const stops = active.stops.map((s, i) => (i === index ? { ...s, name: name.trim().slice(0, MAX_STOP_NAME_LENGTH) } : s));
  active = { ...active, stops };
  void persist();
  notify();
  return true;
}

export function recordingStats(recording: ActiveRecording | null) {
  return {
    pointCount: recording?.points.length ?? 0,
    stopCount: recording?.stops.length ?? 0,
    distanceMeters: recording ? Math.round(totalDistanceMeters(recording.points)) : 0,
    startedAt: recording?.startedAt ?? null,
  };
}

function toPayload(recording: ActiveRecording): CustomRouteRunPayload {
  return {
    clientRunId: recording.clientRunId,
    startedAt: new Date(recording.startedAt).toISOString(),
    endedAt: new Date().toISOString(),
    points: recording.points,
    stops: recording.stops,
  };
}

/**
 * Ends the ride: stops listening and returns what to upload. Nothing is uploaded
 * here - the caller sends it, and queues it if the network is down.
 */
export async function finishRecording(): Promise<CustomRouteRunPayload | null> {
  if (!active) return null;
  const payload = toPayload(active);
  active = null;
  lastFix = null;
  stopListening();
  await persist();
  notify();
  return payload;
}

/** Throws the ride away (driver chose to discard it). */
export async function discardRecording(): Promise<void> {
  active = null;
  lastFix = null;
  stopListening();
  await persist();
  notify();
}

/**
 * Re-attaches to a ride that was in progress when the process died - used by the
 * headless background task, which has no screen to restart it.
 */
export async function restoreRecording(): Promise<void> {
  if (active) {
    listen();
    return;
  }
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as ActiveRecording;
    if (!saved || !Array.isArray(saved.points)) return;
    active = saved;
    listen();
    notify();
  } catch {
    /* nothing usable saved */
  }
}

/** A ride that was interrupted and can still be resumed or submitted. */
export async function peekInterruptedRecording(): Promise<ActiveRecording | null> {
  if (active) return null; // it is running, not interrupted
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as ActiveRecording;
    return saved && Array.isArray(saved.points) && saved.points.length > 0 ? saved : null;
  } catch {
    return null;
  }
}

// ---- Upload queue: a finished ride that could not be sent yet -----------------------

export async function readQueue(): Promise<CustomRouteRunPayload[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: CustomRouteRunPayload[]) {
  try {
    if (queue.length) await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    else await AsyncStorage.removeItem(QUEUE_KEY);
  } catch {
    /* best effort */
  }
}

export async function enqueueRun(payload: CustomRouteRunPayload): Promise<void> {
  const queue = await readQueue();
  if (queue.some((q) => q.clientRunId === payload.clientRunId)) return;
  await writeQueue([...queue, payload].slice(-MAX_QUEUED_RUNS));
}

// True when sending again might work (no network, timeout, server hiccup); false when the
// server has answered "no" and repeating the request would only be refused again.
export function isRetryable(error: unknown): boolean {
  const e = error as { kind?: string; status?: number } | null;
  if (!e) return true;
  if (e.kind === 'offline' || e.kind === 'timeout') return true;
  if (e.kind === 'http') return (e.status ?? 500) >= 500 || e.status === 429;
  return true;
}

/**
 * Sends every queued ride. A ride the server refuses for good is dropped; one that
 * failed for a reason a retry could fix stays queued. Returns how many were delivered.
 */
export async function flushQueue(
  submit: (payload: CustomRouteRunPayload) => Promise<unknown>
): Promise<number> {
  const queue = await readQueue();
  if (!queue.length) return 0;

  const remaining: CustomRouteRunPayload[] = [];
  let delivered = 0;
  for (const payload of queue) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await submit(payload);
      delivered += 1;
    } catch (error) {
      if (isRetryable(error)) remaining.push(payload);
    }
  }
  await writeQueue(remaining);
  return delivered;
}

/** Test helper: forget everything in memory. */
export function resetRecorder(): void {
  active = null;
  lastFix = null;
  sincePersist = 0;
  listeners = [];
  stopListening();
}
