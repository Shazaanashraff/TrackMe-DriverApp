import Constants from 'expo-constants';

const resolveHost = () => {
	const explicitHost = process.env.EXPO_PUBLIC_API_HOST;
	if (explicitHost) return explicitHost;

	const hostUri =
		Constants.expoConfig?.hostUri ||
		Constants.manifest2?.extra?.expoGo?.debuggerHost ||
		Constants.manifest?.debuggerHost;

	if (hostUri) {
		return hostUri.split(':')[0];
	}

	return 'localhost';
};

// A production/EAS build has no Expo debugger host and no LAN, so the
// host-derivation below would silently resolve to 'localhost' on the driver's
// phone. EXPO_PUBLIC_API_URL (a full URL, set via eas.json's production env)
// takes priority for exactly that case; EXPO_PUBLIC_API_HOST / debugger-host
// derivation remains the dev-only fallback.
const EXPLICIT_API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_HOST = resolveHost();

export const API_URL = EXPLICIT_API_URL || `http://${API_HOST}:5000`;
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || EXPLICIT_API_URL || `http://${API_HOST}:5000`;
