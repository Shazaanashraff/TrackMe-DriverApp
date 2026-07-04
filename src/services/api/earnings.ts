import { API_URL } from '../../config';
import { requestJson } from './transport';
import { authHeaders } from './authHeaders';

export async function getDriverEarningsStats(token: string) {
  return requestJson(`${API_URL}/api/driver-earnings/stats`, {
    headers: authHeaders(token),
  });
}

export async function getDriverEarningsHistory(
  token: string,
  { page = 1, limit = 10 }: { page?: number; limit?: number } = {}
) {
  return requestJson(`${API_URL}/api/driver-earnings/history?page=${page}&limit=${limit}`, {
    headers: authHeaders(token),
  });
}

export async function getDriverDailyBreakdown(token: string) {
  return requestJson(`${API_URL}/api/driver-earnings/daily-breakdown`, {
    headers: authHeaders(token),
  });
}

export async function requestDriverPayout(token: string, earningId: string, bankAccount: unknown) {
  return requestJson(`${API_URL}/api/driver-earnings/${earningId}/request-payout`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ bankAccount }),
  });
}
