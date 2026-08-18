import { AppError, normalizeError, isOfflineError, userMessage } from '../errors';

describe('normalizeError', () => {
  it('passes AppError through unchanged', () => {
    const err = new AppError('http', 'test', { status: 404 });
    expect(normalizeError(err)).toBe(err);
  });

  it('maps AbortError to timeout', () => {
    const abort = new Error('The user aborted a request.');
    abort.name = 'AbortError';
    const result = normalizeError(abort);
    expect(result.kind).toBe('timeout');
  });

  it('maps network request failed to offline', () => {
    const netErr = new Error('Network request failed');
    const result = normalizeError(netErr);
    expect(result.kind).toBe('offline');
  });

  it('maps "failed to fetch" to offline', () => {
    const result = normalizeError(new Error('Failed to fetch'));
    expect(result.kind).toBe('offline');
  });

  it('maps SyntaxError to parse', () => {
    const parseErr = new SyntaxError('Unexpected token < in JSON');
    const result = normalizeError(parseErr);
    expect(result.kind).toBe('parse');
  });

  it('maps unknown Error to unknown kind', () => {
    const result = normalizeError(new Error('Something random'));
    expect(result.kind).toBe('unknown');
  });

  it('maps non-Error to unknown kind', () => {
    const result = normalizeError('string error');
    expect(result.kind).toBe('unknown');
  });
});

describe('AppError.fromHttp', () => {
  it('creates http error with status', () => {
    const err = AppError.fromHttp(404, { code: 'NOT_FOUND', message: 'Not found' });
    expect(err.kind).toBe('http');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('handles non-object body', () => {
    const err = AppError.fromHttp(500, null);
    expect(err.kind).toBe('http');
    expect(err.status).toBe(500);
    expect(err.code).toBeUndefined();
  });

  it('sets details from body', () => {
    const body = { code: 'EMAIL_IN_USE', message: 'Email in use' };
    const err = AppError.fromHttp(409, body);
    expect(err.details).toBe(body);
  });
});

describe('isOfflineError', () => {
  it('returns true for AppError with offline kind', () => {
    expect(isOfflineError(new AppError('offline', 'No network'))).toBe(true);
  });

  it('returns false for AppError with http kind', () => {
    expect(isOfflineError(new AppError('http', 'Not found', { status: 404 }))).toBe(false);
  });

  it('returns true for raw network Error', () => {
    expect(isOfflineError(new Error('Network request failed'))).toBe(true);
  });

  it('returns false for non-network Error', () => {
    expect(isOfflineError(new Error('Validation failed'))).toBe(false);
  });
});

describe('userMessage', () => {
  it('returns friendly message for offline', () => {
    const msg = userMessage(new AppError('offline', 'No network'));
    expect(msg).toContain('offline');
  });

  it('returns friendly message for timeout', () => {
    const msg = userMessage(new AppError('timeout', 'Timed out'));
    expect(msg).toContain('timed out');
  });

  it('returns friendly message for permission', () => {
    const msg = userMessage(new AppError('permission', 'Location permission denied'));
    expect(msg.toLowerCase()).toContain('permission');
  });

  it('returns friendly message for tracking', () => {
    const msg = userMessage(new AppError('tracking', 'Start-tracking ack failed'));
    expect(msg).toBe("Couldn't confirm you're online with the server. Please try again.");
  });

  it('returns the exact STYLEGUIDE §8 copy for INVALID_CREDENTIALS', () => {
    const err = new AppError('http', 'Unauthorized', { status: 401, code: 'INVALID_CREDENTIALS' });
    expect(userMessage(err)).toBe('Wrong email or password. Try again.');
  });

  it('returns known code message for DUPLICATE_PLATE', () => {
    const err = new AppError('http', 'Conflict', { status: 409, code: 'DUPLICATE_PLATE' });
    expect(userMessage(err)).toContain('number plate');
  });

  it('returns known code message for NOT_A_DRIVER', () => {
    const err = new AppError('http', 'Forbidden', { status: 403, code: 'NOT_A_DRIVER' });
    expect(userMessage(err)).toContain('driver');
  });

  // The backend answers a bad driver-code sign-in with a 401 and a message
  // written for the driver. Swallowing it left every rejected sign-in reading
  // "Something went wrong", with no way to tell a typo from an outage.
  it('surfaces the server message on a 4xx instead of a generic string', () => {
    const err = AppError.fromHttp(401, { success: false, message: 'Invalid driver ID or password' });
    expect(userMessage(err)).toBe('Invalid driver ID or password');
  });

  // Typing an enrollment key (TMD-…) into the driver sign-in field produces
  // exactly this shape. "Validation failed" alone does not tell the driver the
  // ID is the wrong kind of code.
  it('prefers a specific field error over the generic validation category', () => {
    const err = AppError.fromHttp(400, {
      success: false,
      message: 'Validation failed',
      errors: [{ message: 'Enter a valid email address or driver ID' }],
    });
    expect(userMessage(err)).toBe('Enter a valid email address or driver ID');
  });

  it('ignores a malformed errors array and keeps the top-level message', () => {
    const err = AppError.fromHttp(400, {
      message: 'Validation failed',
      errors: [null, {}, { message: 42 }],
    });
    expect(userMessage(err)).toBe('Validation failed');
  });

  it('prefers a known code over the server message', () => {
    const err = AppError.fromHttp(401, { code: 'INVALID_CREDENTIALS', message: 'Unauthorized' });
    expect(userMessage(err)).toBe('Wrong email or password. Try again.');
  });

  it('falls back to the generic message when a 4xx body carries none', () => {
    const err = AppError.fromHttp(400, {});
    expect(userMessage(err)).toBe('Something went wrong. Please try again.');
    expect(userMessage(err)).not.toContain('HTTP 400');
  });

  it('never leaks raw 500 body — returns generic message for 5xx', () => {
    const err = AppError.fromHttp(500, { message: 'Internal server error trace: pg.connect ...' });
    const msg = userMessage(err);
    expect(msg).not.toContain('pg.connect');
    expect(msg.length).toBeLessThan(200);
  });

  it('surfaces the server message for a 429 rate-limit response', () => {
    const err = AppError.fromHttp(429, { message: 'Too many requests, try again later' });
    expect(userMessage(err)).toBe('Too many requests, try again later');
  });

  it('falls back to the generic message for a 429 with no server message', () => {
    const err = AppError.fromHttp(429, {});
    expect(userMessage(err)).toBe('Something went wrong. Please try again.');
  });

  it.each([502, 503, 504])('maps a %i response to the same safe generic message as 500', (status) => {
    const err = AppError.fromHttp(status, { message: `upstream failure trace: internal-host-${status}` });
    const msg = userMessage(err);
    expect(msg).toBe('Something went wrong. Please try again.');
    expect(msg).not.toContain('internal-host');
  });

  it('returns generic message for unknown kind', () => {
    const msg = userMessage(new AppError('unknown', 'Raw unexpected'));
    expect(msg).not.toContain('Raw unexpected');
    expect(msg.length).toBeGreaterThan(0);
  });
});
