import { API_URL } from '../../config';
import { requestJson } from './transport';

export interface AppRelease {
  _id: string;
  app: 'driver';
  platform: 'android';
  version: string;
  versionCode: number;
  downloadUrl: string;
  releaseNotes: string;
  mandatory: boolean;
  fileSizeBytes: number;
  isActive: boolean;
  createdAt: string;
}

// Public endpoint (no auth) — returns the newest active android driver-app build,
// or null if none has been published yet.
export async function getLatestAppRelease(): Promise<AppRelease | null> {
  const res = await requestJson<{ release: AppRelease | null }>(
    `${API_URL}/api/app-releases/latest?app=driver&platform=android`
  );
  return res?.release ?? null;
}
