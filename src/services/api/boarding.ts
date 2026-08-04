import { requestJson } from './transport';
import { authHeaders } from './authHeaders';
import { API_URL } from '../../config';

export async function submitBoardingScan(
  token: string,
  { qrToken, vehicleId, type }: { qrToken: string; vehicleId: string; type?: 'BOARD' | 'ALIGHT' }
) {
  return requestJson(`${API_URL}/api/driver/boarding/scan`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ token: qrToken, vehicleId, ...(type ? { type } : {}) }),
  });
}
