import { API_URL } from '../../config';
import { requestJson } from './transport';
import { authHeaders } from './authHeaders';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// `identifier` is a driver ID or an email. A driver created without an email
// has only the ID. The field is still named `email` on the wire for older
// callers, but the server treats either shape.
export async function login(identifier: string, password: string) {
  return requestJson(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ identifier, password }),
  });
}

// A driver's own details (name, email, phone) are maintained by their manager,
// so the copy stored at sign-in goes stale. This re-reads the live record.
export async function getMe(token: string) {
  return requestJson(`${API_URL}/api/auth/me`, {
    headers: authHeaders(token),
  });
}

// The driver's own enrollment key. Managers can rotate it, so it is read back
// rather than remembered.
export async function getMyEnrollmentKey(token: string) {
  return requestJson(`${API_URL}/api/driver/enrollment-key`, {
    headers: authHeaders(token),
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

export async function requestPasswordResetOtp(email: string) {
  return requestJson(`${API_URL}/api/auth/forgot-password/request-otp`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  });
}

export async function verifyPasswordResetOtp(email: string, otp: string) {
  return requestJson(`${API_URL}/api/auth/forgot-password/verify-otp`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, otp }),
  });
}

export async function resetPassword(email: string, resetToken: string, password: string) {
  return requestJson(`${API_URL}/api/auth/forgot-password/reset`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, resetToken, password }),
  });
}
