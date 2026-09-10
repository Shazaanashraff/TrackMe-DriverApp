// A rider's picture, kept on the device so it is not downloaded on every launch.
//
// The server hands the roster `hasAvatar` and `avatarVersion` but never the
// image, so the image is one request per rider per version. Caching it against
// that version is what makes the second launch free, and what makes a changed
// picture appear without anyone thinking about invalidation: a new version is a
// new key, and the old ones are dropped when it is written.
//
// Ported from user-app's src/features/profile/riderAvatarCache.ts — the two apps
// share no code, so this is a deliberate copy rather than an import.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCommunication } from './provider';
import { resourceId } from './state';

const PREFIX = 'riderAvatar:';

export const cacheKey = (riderId, version) => `${PREFIX}${riderId}:${version}`;

export async function readCachedAvatar(riderId, version) {
  try {
    return await AsyncStorage.getItem(cacheKey(riderId, version));
  } catch {
    return null;
  }
}

// Writes this version and drops any older one for the same rider, so the cache
// holds at most one picture per rider.
export async function writeCachedAvatar(riderId, version, dataUrl) {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const stale = keys.filter((key) => key.startsWith(`${PREFIX}${riderId}:`) && key !== cacheKey(riderId, version));
    if (stale.length) await AsyncStorage.multiRemove(stale);
    await AsyncStorage.setItem(cacheKey(riderId, version), dataUrl);
  } catch {
    // A cache that cannot be written is a slower app, not a broken one.
  }
}

/**
 * The picture for one rider, or null while there is none to show.
 * A rider with no picture never causes a request.
 *
 * @param {{riderId?: string, hasAvatar?: boolean, avatarVersion?: number}} rider
 */
export function useRiderAvatar(rider) {
  const { request } = useCommunication();
  const riderId = rider?.riderId ? resourceId(rider.riderId) : '';
  const version = rider?.avatarVersion ?? 0;
  const hasAvatar = Boolean(rider?.hasAvatar);
  const [uri, setUri] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!riderId || !hasAvatar) {
      setUri(null);
      return () => { cancelled = true; };
    }

    (async () => {
      const cached = await readCachedAvatar(riderId, version);
      if (cancelled) return;
      if (cached) {
        setUri(cached);
        return;
      }
      try {
        const { avatarUrl } = await request(`/driver/riders/${riderId}/avatar`);
        if (cancelled || !avatarUrl) return;
        setUri(avatarUrl);
        await writeCachedAvatar(riderId, version, avatarUrl);
      } catch {
        // An unreachable picture leaves the initials in place.
      }
    })();

    return () => { cancelled = true; };
  }, [riderId, version, hasAvatar, request]);

  return uri;
}
