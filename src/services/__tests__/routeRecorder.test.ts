import AsyncStorage from '@react-native-async-storage/async-storage';

// The recorder listens to the same fix stream the live broadcast uses, so the stream
// is replaced with a handle the test can push fixes through.
let fixListener: ((fix: { lat: number; lng: number; timestamp: number; accuracy?: number | null }) => void) | null = null;
let listenerCount = 0;
jest.mock('../locationDispatch', () => ({
  __esModule: true,
  subscribeToFixes: (cb: typeof fixListener) => {
    fixListener = cb;
    listenerCount += 1;
    return () => {
      fixListener = null;
    };
  },
}));

import {
  addStop,
  discardRecording,
  enqueueRun,
  finishRecording,
  flushQueue,
  getRecording,
  isRetryable,
  MAX_STOP_NAME_LENGTH,
  MIN_STOP_SPACING_METERS,
  nameStop,
  peekInterruptedRecording,
  PERSIST_EVERY_POINTS,
  readQueue,
  recordingStats,
  RESUME_WINDOW_MS,
  resetRecorder,
  restoreRecording,
  startRecording,
  subscribeToRecording,
} from '../routeRecorder';

// ~11 m per 0.0001 degree of latitude.
const fix = (i: number, extra = {}) => ({ lat: 6.9 + i * 0.0002, lng: 79.85, timestamp: Date.now() + i * 1000, accuracy: 8, ...extra });

beforeEach(async () => {
  resetRecorder();
  fixListener = null;
  listenerCount = 0;
  await AsyncStorage.clear();
});

describe('startRecording', () => {
  it('starts an empty recording with a fresh run id and listens for fixes', async () => {
    const rec = await startRecording('VH-1');
    expect(rec.vehicleId).toBe('VH-1');
    expect(rec.clientRunId).toMatch(/^run-/);
    expect(rec.points).toEqual([]);
    expect(fixListener).not.toBeNull();
  });

  it('gives each ride its own run id', async () => {
    const first = await startRecording('VH-1');
    await discardRecording();
    const second = await startRecording('VH-1');
    expect(second.clientRunId).not.toBe(first.clientRunId);
  });

  it('is a no-op when called again for the ride already in progress', async () => {
    const first = await startRecording('VH-1');
    const again = await startRecording('VH-1');
    expect(again.clientRunId).toBe(first.clientRunId);
    expect(listenerCount).toBe(1); // never registered twice
  });

  it('carries on with a recent interrupted ride for the same vehicle', async () => {
    await startRecording('VH-1');
    fixListener!(fix(0));
    fixListener!(fix(1));
    const saved = getRecording()!;
    await AsyncStorage.setItem('route_recording_active', JSON.stringify(saved));

    resetRecorder(); // the process died
    const resumed = await startRecording('VH-1');
    expect(resumed.clientRunId).toBe(saved.clientRunId);
    expect(resumed.points).toHaveLength(2);
  });

  it('does not glue a new shift onto a ride that is hours old', async () => {
    const old = {
      clientRunId: 'run-old',
      vehicleId: 'VH-1',
      startedAt: Date.now() - RESUME_WINDOW_MS - 60_000,
      points: [{ lat: 6.9, lng: 79.85, t: Date.now() - RESUME_WINDOW_MS - 30_000 }],
      stops: [],
    };
    await AsyncStorage.setItem('route_recording_active', JSON.stringify(old));
    const rec = await startRecording('VH-1');
    expect(rec.clientRunId).not.toBe('run-old');
    expect(rec.points).toEqual([]);
  });

  it('does not resume another vehicle\'s ride', async () => {
    const other = { clientRunId: 'run-x', vehicleId: 'VH-OTHER', startedAt: Date.now(), points: [], stops: [] };
    await AsyncStorage.setItem('route_recording_active', JSON.stringify(other));
    const rec = await startRecording('VH-1');
    expect(rec.clientRunId).not.toBe('run-x');
  });
});

describe('recording fixes', () => {
  it('appends every fix with its time and accuracy', async () => {
    await startRecording('VH-1');
    fixListener!({ lat: 6.9, lng: 79.85, timestamp: 1000, accuracy: 7 });
    fixListener!({ lat: 6.9002, lng: 79.85, timestamp: 2000, accuracy: null });
    expect(getRecording()!.points).toEqual([
      { lat: 6.9, lng: 79.85, t: 1000, acc: 7 },
      { lat: 6.9002, lng: 79.85, t: 2000, acc: null },
    ]);
  });

  it('ignores fixes when no ride is being recorded', async () => {
    await startRecording('VH-1');
    await discardRecording();
    expect(fixListener).toBeNull();
    expect(getRecording()).toBeNull();
  });

  it('tells subscribers about each change, and stops when they unsubscribe', async () => {
    const seen: number[] = [];
    const off = subscribeToRecording((r) => seen.push(r?.points.length ?? -1));
    await startRecording('VH-1');
    fixListener!(fix(0));
    fixListener!(fix(1));
    off();
    fixListener!(fix(2));
    expect(seen).toContain(1);
    expect(seen).toContain(2);
    expect(seen).not.toContain(3);
  });

  it('saves to storage every few fixes so a killed app loses seconds, not the ride', async () => {
    await startRecording('VH-1');
    for (let i = 0; i < PERSIST_EVERY_POINTS; i += 1) fixListener!(fix(i));
    await Promise.resolve();
    const raw = await AsyncStorage.getItem('route_recording_active');
    expect(JSON.parse(raw!).points.length).toBe(PERSIST_EVERY_POINTS);
  });
});

describe('addStop', () => {
  it('refuses when nothing is being recorded', () => {
    expect(addStop()).toEqual({ ok: false, reason: 'NOT_RECORDING' });
  });

  it('refuses until the first GPS fix arrives', async () => {
    await startRecording('VH-1');
    expect(addStop()).toEqual({ ok: false, reason: 'NO_FIX' });
  });

  it('marks a stop at the latest position, with an optional name', async () => {
    await startRecording('VH-1');
    fixListener!(fix(0));
    const result = addStop('  School gate ');
    expect(result.ok).toBe(true);
    expect(getRecording()!.stops).toHaveLength(1);
    expect(getRecording()!.stops[0]).toMatchObject({ lat: 6.9, lng: 79.85, name: 'School gate' });
  });

  it('refuses a second tap in the same place', async () => {
    await startRecording('VH-1');
    fixListener!(fix(0));
    expect(addStop().ok).toBe(true);
    fixListener!({ lat: 6.9 + 5 / 111_320, lng: 79.85, timestamp: Date.now() }); // 5 m on
    expect(addStop()).toEqual({ ok: false, reason: 'TOO_CLOSE' });
    expect(getRecording()!.stops).toHaveLength(1);
  });

  it('accepts a stop once the vehicle has moved on', async () => {
    await startRecording('VH-1');
    fixListener!(fix(0));
    addStop();
    fixListener!({ lat: 6.9 + (MIN_STOP_SPACING_METERS + 30) / 111_320, lng: 79.85, timestamp: Date.now() });
    expect(addStop().ok).toBe(true);
    expect(getRecording()!.stops).toHaveLength(2);
  });
});

describe('nameStop', () => {
  const setup = async () => {
    await startRecording('VH-1');
    fixListener!(fix(0));
    const first = addStop();
    fixListener!({ lat: 6.9 + 300 / 111_320, lng: 79.85, timestamp: Date.now() });
    const second = addStop();
    return [first, second].map((r) => (r.ok ? r.stop.t : 0));
  };

  it('names the stop that was marked at that time, leaving the others alone', async () => {
    const [firstT, secondT] = await setup();
    expect(nameStop(firstT, "  Nimal's house ")).toBe(true);
    const stops = getRecording()!.stops;
    expect(stops[0].name).toBe("Nimal's house");
    expect(stops[1].name).toBe('');
    expect(stops[1].t).toBe(secondT);
  });

  it('can still name an earlier stop after the driver has marked more', async () => {
    const [firstT] = await setup();
    expect(nameStop(firstT, 'School gate')).toBe(true);
    expect(getRecording()!.stops.map((s) => s.name)).toEqual(['School gate', '']);
  });

  it('renaming replaces the earlier name', async () => {
    const [firstT] = await setup();
    nameStop(firstT, 'Wrong');
    nameStop(firstT, 'Right');
    expect(getRecording()!.stops[0].name).toBe('Right');
  });

  it('cuts a very long name to the length the server accepts', async () => {
    const [firstT] = await setup();
    nameStop(firstT, 'x'.repeat(300));
    expect(getRecording()!.stops[0].name).toHaveLength(MAX_STOP_NAME_LENGTH);
  });

  it('says false for a stop that is not on this ride, or when nothing is being recorded', async () => {
    await setup();
    expect(nameStop(1, 'Nope')).toBe(false);
    await discardRecording();
    expect(nameStop(1, 'Nope')).toBe(false);
  });

  it('the name is saved to storage and travels in the upload', async () => {
    const [firstT] = await setup();
    nameStop(firstT, "Nimal's house");
    const saved = JSON.parse((await AsyncStorage.getItem('route_recording_active'))!);
    expect(saved.stops[0].name).toBe("Nimal's house");
    const payload = await finishRecording();
    expect(payload!.stops[0].name).toBe("Nimal's house");
  });

  it('a long name typed straight into addStop is capped the same way', async () => {
    await startRecording('VH-1');
    fixListener!(fix(0));
    addStop('y'.repeat(200));
    expect(getRecording()!.stops[0].name).toHaveLength(MAX_STOP_NAME_LENGTH);
  });
});

describe('recordingStats', () => {
  it('is all zeros with no recording', () => {
    expect(recordingStats(null)).toEqual({ pointCount: 0, stopCount: 0, distanceMeters: 0, startedAt: null });
  });

  it('counts points and stops and measures the distance driven', async () => {
    await startRecording('VH-1');
    fixListener!(fix(0));
    fixListener!(fix(5)); // 0.001 degree ~ 111 m
    addStop();
    const stats = recordingStats(getRecording());
    expect(stats.pointCount).toBe(2);
    expect(stats.stopCount).toBe(1);
    expect(stats.distanceMeters).toBeGreaterThan(100);
    expect(stats.distanceMeters).toBeLessThan(125);
  });
});

describe('finishRecording / discardRecording', () => {
  it('returns the ride as an upload payload and stops listening', async () => {
    const rec = await startRecording('VH-1');
    fixListener!(fix(0));
    fixListener!(fix(1));
    const payload = await finishRecording();
    expect(payload!.clientRunId).toBe(rec.clientRunId);
    expect(payload!.points).toHaveLength(2);
    expect(new Date(payload!.endedAt).getTime()).toBeGreaterThanOrEqual(new Date(payload!.startedAt).getTime());
    expect(getRecording()).toBeNull();
    expect(fixListener).toBeNull();
    expect(await AsyncStorage.getItem('route_recording_active')).toBeNull();
  });

  it('returns null when there is nothing to finish', async () => {
    expect(await finishRecording()).toBeNull();
  });

  it('discarding forgets the ride, including what was saved', async () => {
    await startRecording('VH-1');
    fixListener!(fix(0));
    await discardRecording();
    expect(getRecording()).toBeNull();
    expect(await AsyncStorage.getItem('route_recording_active')).toBeNull();
  });
});

describe('restoreRecording / peekInterruptedRecording', () => {
  const saved = {
    clientRunId: 'run-saved',
    vehicleId: 'VH-1',
    startedAt: Date.now() - 60_000,
    points: [{ lat: 6.9, lng: 79.85, t: Date.now() - 30_000 }],
    stops: [],
  };

  it('re-attaches to a ride in progress when the process was restarted', async () => {
    await AsyncStorage.setItem('route_recording_active', JSON.stringify(saved));
    await restoreRecording();
    expect(getRecording()!.clientRunId).toBe('run-saved');
    expect(fixListener).not.toBeNull();
  });

  it('does nothing when nothing was saved', async () => {
    await restoreRecording();
    expect(getRecording()).toBeNull();
    expect(fixListener).toBeNull();
  });

  it('survives an unreadable save', async () => {
    await AsyncStorage.setItem('route_recording_active', '{not json');
    await expect(restoreRecording()).resolves.toBeUndefined();
    expect(getRecording()).toBeNull();
  });

  it('offers an interrupted ride that has points, but not an empty one or one still running', async () => {
    await AsyncStorage.setItem('route_recording_active', JSON.stringify(saved));
    expect((await peekInterruptedRecording())!.clientRunId).toBe('run-saved');

    await AsyncStorage.setItem('route_recording_active', JSON.stringify({ ...saved, points: [] }));
    expect(await peekInterruptedRecording()).toBeNull();

    await AsyncStorage.setItem('route_recording_active', JSON.stringify(saved));
    await restoreRecording();
    expect(await peekInterruptedRecording()).toBeNull(); // it is running, not interrupted
  });
});

describe('upload queue', () => {
  const payload = (id: string) => ({
    clientRunId: id, startedAt: '2026-11-04T08:00:00.000Z', endedAt: '2026-11-04T08:30:00.000Z', points: [], stops: [],
  });

  it('keeps a ride until it is sent, once, in order', async () => {
    await enqueueRun(payload('a'));
    await enqueueRun(payload('a'));
    await enqueueRun(payload('b'));
    expect((await readQueue()).map((p) => p.clientRunId)).toEqual(['a', 'b']);
  });

  it('keeps at most ten', async () => {
    for (let i = 0; i < 14; i += 1) await enqueueRun(payload(`r${i}`));
    const queue = await readQueue();
    expect(queue).toHaveLength(10);
    expect(queue[9].clientRunId).toBe('r13');
  });

  it('sends everything and empties the queue', async () => {
    await enqueueRun(payload('a'));
    await enqueueRun(payload('b'));
    const submit = jest.fn().mockResolvedValue({});
    expect(await flushQueue(submit)).toBe(2);
    expect(submit).toHaveBeenCalledTimes(2);
    expect(await readQueue()).toEqual([]);
  });

  it('keeps a ride that failed for a reason a retry could fix, and drops one the server refused', async () => {
    await enqueueRun(payload('offline'));
    await enqueueRun(payload('refused'));
    await enqueueRun(payload('ok'));
    const submit = jest.fn().mockImplementation(async (p) => {
      if (p.clientRunId === 'offline') throw { kind: 'offline' };
      if (p.clientRunId === 'refused') throw { kind: 'http', status: 409 };
      return {};
    });
    expect(await flushQueue(submit)).toBe(1);
    expect((await readQueue()).map((p) => p.clientRunId)).toEqual(['offline']);
  });

  it('does nothing for an empty queue', async () => {
    const submit = jest.fn();
    expect(await flushQueue(submit)).toBe(0);
    expect(submit).not.toHaveBeenCalled();
  });
});

describe('isRetryable', () => {
  it('retries offline, timeout, server errors and rate limiting', () => {
    expect(isRetryable({ kind: 'offline' })).toBe(true);
    expect(isRetryable({ kind: 'timeout' })).toBe(true);
    expect(isRetryable({ kind: 'http', status: 503 })).toBe(true);
    expect(isRetryable({ kind: 'http', status: 429 })).toBe(true);
  });

  it('does not retry an answer the server will repeat', () => {
    expect(isRetryable({ kind: 'http', status: 400 })).toBe(false);
    expect(isRetryable({ kind: 'http', status: 401 })).toBe(false);
    expect(isRetryable({ kind: 'http', status: 409 })).toBe(false);
  });

  it('retries when it cannot tell', () => {
    expect(isRetryable(null)).toBe(true);
    expect(isRetryable(new Error('boom'))).toBe(true);
  });
});
