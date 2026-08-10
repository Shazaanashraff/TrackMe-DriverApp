import { API_URL } from '../../config';
import { requestJson } from './transport';

export interface ReverseGeocodeResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// Resolve a coordinate to a human place name (server-side proxy; public endpoint).
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const res = await requestJson<{ success: boolean; data?: ReverseGeocodeResult }>(
    `${API_URL}/api/places/reverse?lat=${lat}&lng=${lng}`,
  );
  return res?.data ?? null;
}
