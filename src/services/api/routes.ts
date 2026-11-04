import { API_URL } from '../../config';
import { requestJson } from './transport';
import { authHeaders } from './authHeaders';

// Full route document (stops + distance + source/destination) for one route. Public
// routes resolve for anyone; a custom route (recorded by a driver) only for the
// people it belongs to, so the signed-in driver's token goes along when there is one.
export async function getRouteById(routeId: string, token?: string | null) {
  return requestJson(`${API_URL}/api/routes/${encodeURIComponent(routeId)}`, token
    ? { headers: authHeaders(token) }
    : undefined);
}
