import { API_URL } from '../../config';
import { requestJson } from './transport';
import { authHeaders } from './authHeaders';

// Progress of this driver's custom route ("ride 2 of 5"). `data` is null when the
// driver's vehicle is not on a custom route.
export async function getCurrentCustomRoute(token: string) {
  return requestJson(`${API_URL}/api/driver/custom-routes/current`, {
    headers: authHeaders(token),
  });
}

export interface CustomRouteRunPayload {
  clientRunId: string;
  startedAt: string;
  endedAt: string;
  points: { lat: number; lng: number; t: number; acc?: number | null }[];
  stops: { lat: number; lng: number; t: number; name?: string }[];
}

// Idempotent on clientRunId: sending the same ride twice counts it once.
export async function submitCustomRouteRun(token: string, payload: CustomRouteRunPayload) {
  return requestJson(`${API_URL}/api/driver/custom-routes/runs`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export async function discardCustomRouteRun(token: string, runId: string) {
  return requestJson(`${API_URL}/api/driver/custom-routes/runs/${encodeURIComponent(runId)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
