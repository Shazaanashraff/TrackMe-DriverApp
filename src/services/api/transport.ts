import { markBackendOffline, markBackendOnline } from '../backendStatus';
import { AppError, normalizeError } from '../../lib/errors';

const TIMEOUT_MS = 15_000;
const MAX_BODY_BYTES = 5 * 1024 * 1024;

async function readBodyOnce(res: Response): Promise<unknown> {
  const contentLength = res.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    throw new AppError('parse', 'Response too large');
  }

  const text = await res.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new AppError('parse', 'Response too large');
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new AppError('parse', 'Unexpected response format');
  }
}

export async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    markBackendOnline();
    const data = await readBodyOnce(res);
    if (!res.ok) throw AppError.fromHttp(res.status, data);
    return data as T;
  } catch (err) {
    if (err instanceof AppError) {
      if (err.kind === 'http') markBackendOnline();
      else markBackendOffline();
      throw err;
    }
    const normalized = normalizeError(err);
    if (normalized.kind === 'offline') markBackendOffline();
    throw normalized;
  } finally {
    clearTimeout(timer);
  }
}
