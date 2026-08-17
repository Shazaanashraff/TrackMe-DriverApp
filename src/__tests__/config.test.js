// config.js resolves API_URL/SOCKET_URL from process.env at import time, so each
// case re-requires it in isolation after setting env vars — a plain top-level
// import would only ever see whatever ran first.
jest.mock('expo-constants', () => ({ expoConfig: {}, manifest2: {}, manifest: {} }));

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_SOCKET_URL;
  delete process.env.EXPO_PUBLIC_API_HOST;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('config.js API URL resolution', () => {
  it('uses EXPO_PUBLIC_API_URL as a full URL when set, overriding host derivation', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://trackme-backend.onrender.com';
    process.env.EXPO_PUBLIC_API_HOST = '192.168.1.10';

    const { API_URL, SOCKET_URL } = require('../config');

    expect(API_URL).toBe('https://trackme-backend.onrender.com');
    expect(SOCKET_URL).toBe('https://trackme-backend.onrender.com');
  });

  it('falls back to EXPO_PUBLIC_API_HOST-derived URLs when EXPO_PUBLIC_API_URL is unset', () => {
    process.env.EXPO_PUBLIC_API_HOST = '192.168.1.10';

    const { API_URL, SOCKET_URL } = require('../config');

    expect(API_URL).toBe('http://192.168.1.10:5000');
    expect(SOCKET_URL).toBe('http://192.168.1.10:5000');
  });

  it('falls back to localhost when nothing is set', () => {
    const { API_URL } = require('../config');

    expect(API_URL).toBe('http://localhost:5000');
  });

  it('EXPO_PUBLIC_SOCKET_URL overrides EXPO_PUBLIC_API_URL for the socket URL only', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://trackme-backend.onrender.com';
    process.env.EXPO_PUBLIC_SOCKET_URL = 'wss://trackme-backend.onrender.com';

    const { API_URL, SOCKET_URL } = require('../config');

    expect(API_URL).toBe('https://trackme-backend.onrender.com');
    expect(SOCKET_URL).toBe('wss://trackme-backend.onrender.com');
  });
});
