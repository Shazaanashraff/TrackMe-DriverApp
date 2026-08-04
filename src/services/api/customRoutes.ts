import { API_URL } from '../../config';
import { requestJson } from './transport';
import { authHeaders } from './authHeaders';

export async function getMyCustomRoute(token: string) {
  return requestJson(`${API_URL}/api/driver/custom-routes/my-route`, {
    headers: authHeaders(token),
  });
}

export async function recordCustomRoute(
  token: string,
  { vehicleId, breadcrumb, stops }: { vehicleId: string; breadcrumb: unknown; stops: unknown }
) {
  return requestJson(`${API_URL}/api/driver/custom-routes/record`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ vehicleId, breadcrumb, stops }),
  });
}

export async function reportJourney(
  token: string,
  { routeId, vehicleId, breadcrumb }: { routeId: string; vehicleId: string; breadcrumb: unknown }
) {
  return requestJson(`${API_URL}/api/driver/custom-routes/${routeId}/report-journey`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ vehicleId, breadcrumb }),
  });
}

export async function recordRouteUpdate(
  token: string,
  {
    routeId,
    vehicleId,
    breadcrumb,
    stops,
  }: { routeId: string; vehicleId: string; breadcrumb: unknown; stops: unknown }
) {
  return requestJson(`${API_URL}/api/driver/custom-routes/${routeId}/record-update`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ vehicleId, breadcrumb, stops }),
  });
}
