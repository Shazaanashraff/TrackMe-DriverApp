module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (process.env.EAS_BUILD_PROFILE === 'production' && (!apiUrl || apiUrl.includes('your-backend'))) {
    throw new Error('Refusing to build: EXPO_PUBLIC_API_URL is unset or still the template default');
  }

  return {
    ...config,
    extra: { ...config.extra, ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } } : {}) },
    android: { ...config.android, ...(process.env.GOOGLE_SERVICES_FILE ? { googleServicesFile: process.env.GOOGLE_SERVICES_FILE } : {}) },
  };
};
