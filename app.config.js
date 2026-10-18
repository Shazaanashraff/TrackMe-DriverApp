const { withGradleProperties } = require('expo/config-plugins');

// Real phones are arm-only. The x86/x86_64 native libs only serve emulators and added ~43 MB
// to the distributed APK, which made Chrome's download scan hang on slow phones.
const ARM_ONLY_ABIS = 'armeabi-v7a,arm64-v8a';

const withArmOnlyAbis = (config) =>
  withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter((item) => !(item.type === 'property' && item.key === 'reactNativeArchitectures'));
    cfg.modResults.push({ type: 'property', key: 'reactNativeArchitectures', value: ARM_ONLY_ABIS });
    return cfg;
  });

module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (process.env.EAS_BUILD_PROFILE === 'production' && (!apiUrl || apiUrl.includes('your-backend'))) {
    throw new Error('Refusing to build: EXPO_PUBLIC_API_URL is unset or still the template default');
  }

  return withArmOnlyAbis({
    ...config,
    extra: { ...config.extra, ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } } : {}) },
    android: {
      ...config.android,
      ...(process.env.GOOGLE_SERVICES_FILE ? { googleServicesFile: process.env.GOOGLE_SERVICES_FILE } : {}),
      // Only the direct-APK build self-installs updates (useAppUpdateCheck). Play restricts this
      // permission to apps that need it, so it must never ship in the Play (.aab) build.
      permissions: [
        ...(config.android?.permissions ?? []),
        ...(process.env.EXPO_PUBLIC_APK_UPDATER === '1' ? ['android.permission.REQUEST_INSTALL_PACKAGES'] : []),
      ],
    },
  });
};

module.exports.withArmOnlyAbis = withArmOnlyAbis;
module.exports.ARM_ONLY_ABIS = ARM_ONLY_ABIS;
