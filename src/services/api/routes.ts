import { API_URL } from '../../config';
import { requestJson } from './transport';
import { authHeaders } from './authHeaders';

export async function getRoutes(token: string) {
  return requestJson(`${API_URL}/api/bus/routes`, {
    headers: authHeaders(token),
  });
}

// Public — no auth header.
export async function getRoutesManagementList() {
  return requestJson(`${API_URL}/api/routes`);
}

export async function createRoute(token: string, routeData: Record<string, unknown>) {
  return requestJson(`${API_URL}/api/routes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(routeData),
  });
}
