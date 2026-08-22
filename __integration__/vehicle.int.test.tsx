// Contract test for vehicle registration/update, covering the request+response
// shapes documented in docs/TESTING_GUIDE.md's "useMyBusQuery / registerBus /
// updateBus" row (bus was renamed to vehicle — see commit 4fe4780 — so this file
// covers the same ground under its current name), including the duplicate-plate
// 403 (DUPLICATE_PLATE) and another-driver's-vehicle 403 cases that were
// previously untested even at the unit level. Only `global.fetch` is mocked;
// services/api/vehicle.ts, lib/errors.ts, and hooks/vehicle are all real, unlike
// the mocked-api unit test in src/hooks/vehicle/__tests__/vehicle.test.ts.
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import api from '../src/services/api';
import { useRegisterVehicle, useUpdateVehicle } from '../src/hooks/vehicle';
import { userMessage } from '../src/lib/errors';

jest.mock('../src/context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ token: 'driver-token' }),
}));

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  };
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = jest.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { wrapper, invalidateSpy };
}

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe('api.registerVehicle / api.updateVehicle / api.getMyVehicle — contract', () => {
  it('posts the vehicle payload with bearer auth to /api/vehicle/register', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(201, { success: true, data: { _id: 'v1' } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const vehicleData = { vehicleId: 'VEHICLE-102', registrationNumber: 'ABC-1234' };
    const result = await api.registerVehicle(vehicleData, 'driver-token');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/vehicle\/register$/);
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer driver-token');
    expect(JSON.parse(options.body)).toEqual(vehicleData);
    expect(result).toEqual({ success: true, data: { _id: 'v1' } });
  });

  it('rejects a duplicate plate with a 403 DUPLICATE_PLATE code, and maps to the driver-facing copy', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      jsonResponse(403, {
        code: 'DUPLICATE_PLATE',
        message: 'A vehicle with this registration number already exists',
      })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    let caught: unknown;
    try {
      await api.registerVehicle({ registrationNumber: 'ABC-1234' }, 'driver-token');
    } catch (err) {
      caught = err;
    }

    expect(caught).toMatchObject({ kind: 'http', status: 403, code: 'DUPLICATE_PLATE' });
    expect(userMessage(caught as import('../src/lib/errors').AppError)).toBe(
      'A vehicle with that number plate is already registered.'
    );
  });

  it('puts the update payload with bearer auth to /api/vehicle/:id', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { _id: 'v1' } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await api.updateVehicle('driver-token', 'v1', { vehicleName: 'Silver Express' });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/vehicle\/v1$/);
    expect(options.method).toBe('PUT');
    expect(options.headers.Authorization).toBe('Bearer driver-token');
    expect(JSON.parse(options.body)).toEqual({ vehicleName: 'Silver Express' });
  });

  // A driver can only own one vehicle, but the update endpoint still takes an
  // id in the URL — trying to update a vehicle that resolves to another
  // driver's is rejected server-side rather than silently scoped.
  it('rejects updating another driver’s vehicle with a plain 403', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      jsonResponse(403, { message: 'You are not authorized to update this vehicle' })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      api.updateVehicle('driver-token', 'someone-elses-vehicle', { vehicleName: 'Hijack' })
    ).rejects.toMatchObject({
      kind: 'http',
      status: 403,
      message: 'You are not authorized to update this vehicle',
    });
  });

  it('gets the driver’s own vehicle with bearer auth', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: { _id: 'v1', plateNumber: 'ABC-123' } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await api.getMyVehicle('driver-token');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/vehicle\/my-vehicle$/);
    expect(options.headers.Authorization).toBe('Bearer driver-token');
    expect(result).toEqual({ data: { _id: 'v1', plateNumber: 'ABC-123' } });
  });
});

describe('useRegisterVehicle / useUpdateVehicle — hook wired to the real api layer', () => {
  it('registers a vehicle end to end and invalidates the myVehicle cache', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(201, { success: true, data: { _id: 'v1' } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useRegisterVehicle(), { wrapper });

    act(() => {
      result.current.mutate({ vehicleId: 'VEHICLE-102' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/vehicle\/register$/);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vehicle', 'mine'] });
  });

  it('surfaces the DUPLICATE_PLATE rejection through the mutation’s error state', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      jsonResponse(403, { code: 'DUPLICATE_PLATE', message: 'Already registered' })
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRegisterVehicle(), { wrapper });

    act(() => {
      result.current.mutate({ registrationNumber: 'ABC-1234' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as { code?: string }).code).toBe('DUPLICATE_PLATE');
  });

  it('updates a vehicle end to end and invalidates the myVehicle cache', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { _id: 'v1' } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useUpdateVehicle(), { wrapper });

    act(() => {
      result.current.mutate({ vehicleId: 'v1', updateData: { vehicleName: 'New Name' } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/vehicle\/v1$/);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vehicle', 'mine'] });
  });
});
