import { API_URL } from '../../config';
import { requestJson } from './transport';
import { authHeaders } from './authHeaders';

export async function getMyVehicle(token: string) {
  return requestJson(`${API_URL}/api/vehicle/my-vehicle`, {
    headers: authHeaders(token),
  });
}

export async function registerVehicle(vehicleData: Record<string, unknown>, token: string) {
  return requestJson(`${API_URL}/api/vehicle/register`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(vehicleData),
  });
}

export async function updateVehicle(
  token: string,
  vehicleId: string,
  updateData: Record<string, unknown>
) {
  return requestJson(`${API_URL}/api/vehicle/${vehicleId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(updateData),
  });
}
