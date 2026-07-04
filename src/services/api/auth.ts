import { API_URL } from '../../config';
import { requestJson } from './transport';
import { authHeaders } from './authHeaders';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function login(email: string, password: string) {
  return requestJson(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: string = 'driver'
) {
  return requestJson(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ name, email, password, role }),
  });
}

export async function refreshToken(refreshToken: string) {
  return requestJson(`${API_URL}/api/auth/refresh-token`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logout(token: string) {
  return requestJson(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
