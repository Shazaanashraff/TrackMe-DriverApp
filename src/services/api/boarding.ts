import { requestJson } from './transport';
import { authHeaders } from './authHeaders';
import { API_URL } from '../../config';

export async function submitBoardingScan(
  token: string,
  { qrToken, busId, type }: { qrToken: string; busId: string; type?: 'BOARD' | 'ALIGHT' }
) {
  return requestJson(`${API_URL}/api/driver/boarding/scan`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ token: qrToken, busId, ...(type ? { type } : {}) }),
  });
}
