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

const API_HOST = resolveHost();

export const API_URL = `http://${API_HOST}:5000`;
export const SOCKET_URL = `http://${API_HOST}:5000`;
