import { useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestJson } from '../../services/api/transport';
import { authHeaders } from '../../services/api/authHeaders';
import { API_URL } from '../../config';
export function useCommunicationTransport() {
  const { authenticatedRequest } = useAuth();
  return useCallback(async (path, method = 'GET', body) => {
    const result = await authenticatedRequest(token => requestJson(`${API_URL}/api${path}`, {
      method, headers: authHeaders(token), ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }));
    return result.data;
  }, [authenticatedRequest]);
}
