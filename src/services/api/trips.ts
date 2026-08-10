import { API_URL } from '../../config';
import { requestJson } from './transport';
import { authHeaders } from './authHeaders';

export async function getDriverTrips(
  token: string,
  { page = 1, limit = 10 }: { page?: number; limit?: number } = {}
) {
  return requestJson(`${API_URL}/api/driver/trips?page=${page}&limit=${limit}`, {
    headers: authHeaders(token),
  });
}

export async function getDriverTripDetails(token: string, tripId: string) {
  return requestJson(`${API_URL}/api/driver/trips/${encodeURIComponent(tripId)}`, {
    headers: authHeaders(token),
  });
}
