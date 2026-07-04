export type AppErrorKind =
  | 'offline'
  | 'timeout'
  | 'http'
  | 'parse'
  | 'unknown'
  | 'permission'
  | 'tracking';

export class AppError extends Error {
  kind: AppErrorKind;
  status?: number;
  code?: string;
  details?: unknown;

  constructor(
    kind: AppErrorKind,
    message: string,
    options?: { status?: number; code?: string; details?: unknown }
  ) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }

  static fromHttp(status: number, body: unknown): AppError {
    let code: string | undefined;
    let message = `HTTP ${status}`;
    let details: unknown = body;

    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>;
      if (typeof b.code === 'string') code = b.code;
      if (typeof b.message === 'string') message = b.message;
      if ('fields' in b) details = b;
    }

    return new AppError('http', message, { status, code, details });
  }
}

// Mirrors the patterns in services/backendStatus.js without importing that module
const OFFLINE_PATTERNS = [
  'network request failed',
  'failed to fetch',
  'load failed',
  'network connection lost',
  'internet connection appears to be offline',
  'request to',
  'disconnected',
];

function isNetworkError(err: unknown): boolean {
  const msg = String((err as Error | null)?.message ?? '').toLowerCase();
  return OFFLINE_PATTERNS.some((p) => msg.includes(p));
}

export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return new AppError('timeout', 'Request timed out');
    }
    if (isNetworkError(err)) {
      return new AppError('offline', 'No network connection');
    }
    if (err.name === 'SyntaxError' || err.message.includes('JSON')) {
      return new AppError('parse', 'Unexpected response format');
    }
    return new AppError('unknown', err.message);
  }

  return new AppError('unknown', 'An unexpected error occurred');
}

export function isOfflineError(err: unknown): boolean {
  if (err instanceof AppError) return err.kind === 'offline';
  return isNetworkError(err);
}

const CODE_MESSAGES: Record<string, string> = {
  DUPLICATE_PLATE: 'A bus with that number plate is already registered.',
  INVALID_CREDENTIALS: 'Incorrect email or password.',
  NOT_A_DRIVER: 'This account is not registered as a driver.',
  PAYOUT_PENDING: 'A payout request is already pending.',
};

const KIND_MESSAGES: Record<AppErrorKind, string> = {
  offline: "You're offline. Please check your connection and try again.",
  timeout: 'The request timed out. Please try again.',
  http: 'Something went wrong. Please try again.',
  parse: 'Unexpected response from server. Please try again.',
  unknown: 'An unexpected error occurred. Please try again.',
  permission: 'Location permission is required to track your bus. Please enable it in Settings.',
  tracking: "Couldn't confirm tracking with the server. Please try again.",
};

export function userMessage(err: AppError): string {
  if (err.code && CODE_MESSAGES[err.code]) {
    return CODE_MESSAGES[err.code];
  }
  if (err.kind === 'http' && err.status && err.status >= 500) {
    return KIND_MESSAGES.http;
  }
  return KIND_MESSAGES[err.kind];
}
