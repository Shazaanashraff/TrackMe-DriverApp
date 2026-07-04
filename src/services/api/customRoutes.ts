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
  { busId, breadcrumb, stops }: { busId: string; breadcrumb: unknown; stops: unknown }
) {
  return requestJson(`${API_URL}/api/driver/custom-routes/record`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ busId, breadcrumb, stops }),
  });
}

export async function reportJourney(
  token: string,
  { routeId, busId, breadcrumb }: { routeId: string; busId: string; breadcrumb: unknown }
) {
  return requestJson(`${API_URL}/api/driver/custom-routes/${routeId}/report-journey`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ busId, breadcrumb }),
  });
}

export async function recordRouteUpdate(
  token: string,
  {
    routeId,
    busId,
    breadcrumb,
    stops,
  }: { routeId: string; busId: string; breadcrumb: unknown; stops: unknown }
) {
  return requestJson(`${API_URL}/api/driver/custom-routes/${routeId}/record-update`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ busId, breadcrumb, stops }),
  });
}
