import { API_URL } from '../../config';
import { requestJson } from './transport';

// Public. Full route document (stops + distance + source/destination) for one route.
// Used by the driver dashboard's trip-progress card. Only resolves PUBLIC routes.
export async function getRouteById(routeId: string) {
  return requestJson(`${API_URL}/api/routes/${encodeURIComponent(routeId)}`);
}
