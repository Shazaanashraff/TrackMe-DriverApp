import { API_URL } from '../../config';
import { requestJson } from './transport';
import { authHeaders } from './authHeaders';

export async function getMyBus(token: string) {
  return requestJson(`${API_URL}/api/bus/my-bus`, {
    headers: authHeaders(token),
  });
}

export async function registerBus(busData: Record<string, unknown>, token: string) {
  return requestJson(`${API_URL}/api/bus/register`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(busData),
  });
}

export async function updateBus(
  token: string,
  busId: string,
  updateData: Record<string, unknown>
) {
  return requestJson(`${API_URL}/api/bus/${busId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(updateData),
  });
}
