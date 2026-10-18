import api from '../index';
import { getLatestAppRelease } from '../appReleases';

describe('getLatestAppRelease', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(body: unknown, ok = true, status = 200) {
    const fn = jest.fn().mockResolvedValue({
      ok,
      status,
      headers: { get: () => null },
      text: () => Promise.resolve(JSON.stringify(body)),
    });
    globalThis.fetch = fn as unknown as typeof fetch;
    return fn;
  }

  it('is exposed on the api surface', () => {
    expect(typeof api.getLatestAppRelease).toBe('function');
  });

  it('asks the public endpoint for the DRIVER app, with no auth header', async () => {
    const fn = mockFetch({ success: true, release: { versionCode: 5, version: '1.0.3' } });

    const release = await getLatestAppRelease('android');

    const [url, options] = fn.mock.calls[0];
    expect(url).toContain('/api/app-releases/latest?app=driver&platform=android');
    expect(options?.headers?.Authorization).toBeUndefined();
    expect(release).toEqual({ versionCode: 5, version: '1.0.3' });
  });

  it('returns null when no release is published', async () => {
    mockFetch({ success: true, release: null });
    await expect(getLatestAppRelease('android')).resolves.toBeNull();
  });
});
