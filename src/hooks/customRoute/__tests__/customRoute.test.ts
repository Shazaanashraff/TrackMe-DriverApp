import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCustomRouteQuery, useRouteRecorder } from '../index';
import { qk } from '../../../lib/queryKeys';

let fixListener: ((fix: { lat: number; lng: number; timestamp: number; accuracy?: number | null }) => void) | null = null;
jest.mock('../../../services/locationDispatch', () => ({
  __esModule: true,
  subscribeToFixes: (cb: typeof fixListener) => {
    fixListener = cb;
    return () => {
      fixListener = null;
    };
  },
}));

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getCurrentCustomRoute: jest.fn(),
    submitCustomRouteRun: jest.fn(),
  },
}));

jest.mock('../../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ token: 'tok' }),
}));

import api from '../../../services/api';
import { getRecording, resetRecorder, readQueue } from '../../../services/routeRecorder';

const mockApi = api as unknown as {
  getCurrentCustomRoute: jest.Mock;
  submitCustomRouteRun: jest.Mock;
};

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { wrapper, qc };
}

const fix = (i: number) => ({ lat: 6.9 + i * 0.0002, lng: 79.85, timestamp: Date.now() + i * 1000, accuracy: 8 });

beforeEach(async () => {
  jest.clearAllMocks();
  resetRecorder();
  fixListener = null;
  await AsyncStorage.clear();
  mockApi.submitCustomRouteRun.mockResolvedValue({
    data: {
      run: { status: 'ACCEPTED', runNumber: 3 },
      route: { status: 'RECORDING', acceptedRuns: 3, requiredRuns: 5 },
    },
  });
});

describe('useCustomRouteQuery', () => {
  it('returns the route progress for a custom-route driver', async () => {
    mockApi.getCurrentCustomRoute.mockResolvedValueOnce({
      success: true,
      data: { routeId: 'CUST-1', status: 'RECORDING', requiredRuns: 5, acceptedRuns: 2 },
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCustomRouteQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getCurrentCustomRoute).toHaveBeenCalledWith('tok');
    expect(result.current.data).toMatchObject({ status: 'RECORDING', acceptedRuns: 2 });
  });

  it('returns null for a driver who is not on a custom route', async () => {
    mockApi.getCurrentCustomRoute.mockResolvedValueOnce({ success: true, data: null });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCustomRouteQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('useRouteRecorder', () => {
  const setup = (props: { enabled: boolean; onDuty: boolean; vehicleId: string }) => {
    const { wrapper, qc } = makeWrapper();
    const view = renderHook((p: typeof props) => useRouteRecorder(p), { wrapper, initialProps: props });
    return { ...view, qc };
  };

  it('does not record when the route is not collecting rides', async () => {
    setup({ enabled: false, onDuty: true, vehicleId: 'VH-1' });
    await act(async () => { await Promise.resolve(); });
    expect(getRecording()).toBeNull();
  });

  it('does not record while the driver is off duty', async () => {
    setup({ enabled: true, onDuty: false, vehicleId: 'VH-1' });
    await act(async () => { await Promise.resolve(); });
    expect(getRecording()).toBeNull();
  });

  it('starts recording when a driver on a recording route goes on duty', async () => {
    const { result, rerender } = setup({ enabled: true, onDuty: false, vehicleId: 'VH-1' });
    rerender({ enabled: true, onDuty: true, vehicleId: 'VH-1' });
    await waitFor(() => expect(result.current.isRecording).toBe(true));
  });

  it('reports live distance and stops as fixes arrive', async () => {
    const { result } = setup({ enabled: true, onDuty: true, vehicleId: 'VH-1' });
    await waitFor(() => expect(result.current.isRecording).toBe(true));
    act(() => {
      fixListener!(fix(0));
      fixListener!(fix(5));
    });
    expect(result.current.pointCount).toBe(2);
    expect(result.current.distanceMeters).toBeGreaterThan(100);
    act(() => { result.current.addStop('Gate'); });
    expect(result.current.stopCount).toBe(1);
  });

  it('refuses a stop before there is a fix', async () => {
    const { result } = setup({ enabled: true, onDuty: true, vehicleId: 'VH-1' });
    await waitFor(() => expect(result.current.isRecording).toBe(true));
    expect(result.current.addStop()).toEqual({ ok: false, reason: 'NO_FIX' });
  });

  it('finishing uploads the ride with the token, reports the outcome and refreshes progress', async () => {
    const { result, qc } = setup({ enabled: true, onDuty: true, vehicleId: 'VH-1' });
    await waitFor(() => expect(result.current.isRecording).toBe(true));
    act(() => { fixListener!(fix(0)); fixListener!(fix(1)); });
    const invalidate = jest.spyOn(qc, 'invalidateQueries');

    let outcome: unknown;
    await act(async () => { outcome = await result.current.finish(); });

    expect(mockApi.submitCustomRouteRun).toHaveBeenCalledTimes(1);
    const [token, payload] = mockApi.submitCustomRouteRun.mock.calls[0];
    expect(token).toBe('tok');
    expect(payload.points).toHaveLength(2);
    expect(payload.clientRunId).toMatch(/^run-/);
    expect(outcome).toMatchObject({ kind: 'sent', runStatus: 'ACCEPTED', acceptedRuns: 3, requiredRuns: 5 });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.customRoute() });
    expect(getRecording()).toBeNull();
  });

  it('queues the ride when there is no signal, and does not lose it', async () => {
    mockApi.submitCustomRouteRun.mockRejectedValue({ kind: 'offline' });
    const { result } = setup({ enabled: true, onDuty: true, vehicleId: 'VH-1' });
    await waitFor(() => expect(result.current.isRecording).toBe(true));
    act(() => { fixListener!(fix(0)); fixListener!(fix(1)); });

    let outcome: unknown;
    await act(async () => { outcome = await result.current.finish(); });
    expect(outcome).toEqual({ kind: 'queued' });
    const queue = await readQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].points).toHaveLength(2);
  });

  it('does not queue a ride the server refused for good', async () => {
    mockApi.submitCustomRouteRun.mockRejectedValue({ kind: 'http', status: 409 });
    const { result } = setup({ enabled: true, onDuty: true, vehicleId: 'VH-1' });
    await waitFor(() => expect(result.current.isRecording).toBe(true));
    act(() => { fixListener!(fix(0)); });

    let outcome: unknown;
    await act(async () => { outcome = await result.current.finish(); });
    expect(outcome).toEqual({ kind: 'nothing' });
    expect(await readQueue()).toEqual([]);
  });

  it('finishing with nothing recorded sends nothing', async () => {
    const { result } = setup({ enabled: true, onDuty: true, vehicleId: 'VH-1' });
    await waitFor(() => expect(result.current.isRecording).toBe(true));
    let outcome: unknown;
    await act(async () => { outcome = await result.current.finish(); });
    expect(outcome).toEqual({ kind: 'nothing' });
    expect(mockApi.submitCustomRouteRun).not.toHaveBeenCalled();
  });

  it('discarding forgets the ride without sending it', async () => {
    const { result } = setup({ enabled: true, onDuty: true, vehicleId: 'VH-1' });
    await waitFor(() => expect(result.current.isRecording).toBe(true));
    act(() => { fixListener!(fix(0)); });
    await act(async () => { await result.current.discard(); });
    expect(result.current.isRecording).toBe(false);
    expect(mockApi.submitCustomRouteRun).not.toHaveBeenCalled();
  });

  it('sends rides that were queued earlier when the dashboard opens', async () => {
    await AsyncStorage.setItem('route_recording_queue', JSON.stringify([{
      clientRunId: 'run-old', startedAt: '2026-11-03T08:00:00.000Z', endedAt: '2026-11-03T08:30:00.000Z', points: [], stops: [],
    }]));
    const { qc } = setup({ enabled: true, onDuty: false, vehicleId: 'VH-1' });
    const invalidate = jest.spyOn(qc, 'invalidateQueries');
    await waitFor(() => expect(mockApi.submitCustomRouteRun).toHaveBeenCalledTimes(1));
    expect(mockApi.submitCustomRouteRun.mock.calls[0][1].clientRunId).toBe('run-old');
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.customRoute() }));
    expect(await readQueue()).toEqual([]);
  });
});
