// Contract test for reading and updating the driver's vehicle, covering the
// request+response shapes in docs/TESTING_GUIDE.md's useMyVehicleQuery /
// updateVehicle row, including the another-driver's-vehicle 403. Drivers no longer
// register vehicles in the app (managers assign them in WebAdmin), so the register
// cases went with the form. Only `global.fetch` is mocked; services/api/vehicle.ts,
// lib/errors.ts and hooks/vehicle are all real, unlike the mocked-api unit test in
// src/hooks/vehicle/__tests__/vehicle.test.ts.
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import api from '../src/services/api';
import { useUpdateVehicle } from '../src/hooks/vehicle';

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

describe('api.updateVehicle / api.getMyVehicle — contract', () => {
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

describe('useUpdateVehicle — hook wired to the real api layer', () => {
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
