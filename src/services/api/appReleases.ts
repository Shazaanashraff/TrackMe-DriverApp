import { API_URL } from '../../config';
import { requestJson } from './transport';

export interface AppRelease {
  _id: string;
  app: 'rider' | 'driver';
  platform: 'android' | 'ios';
  version: string;
  versionCode: number;
  downloadUrl: string;
  releaseNotes?: string | null;
  mandatory: boolean;
  fileSizeBytes?: number | null;
  isActive: boolean;
  createdAt: string;
}

// Public endpoint (no auth) — a signed-out device still needs to know about a
// mandatory update, so this must never require a session.
export async function getLatestAppRelease(
  platform: 'android' | 'ios' = 'android'
): Promise<AppRelease | null> {
  const data = await requestJson<{ release?: AppRelease | null }>(
    `${API_URL}/api/app-releases/latest?app=driver&platform=${platform}`
  );
  return data?.release ?? null;
}
