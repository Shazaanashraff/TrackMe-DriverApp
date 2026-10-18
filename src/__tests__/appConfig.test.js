const appConfig = require('../../app.config');

describe('app.config.js release build config', () => {
  it('restricts the Android build to arm ABIs (no x86/x86_64)', () => {
    expect(appConfig.ARM_ONLY_ABIS).toBe('armeabi-v7a,arm64-v8a');
    expect(appConfig.ARM_ONLY_ABIS).not.toMatch(/x86/);
  });

  it('registers a gradle-properties mod on the resolved config', () => {
    const out = appConfig({ config: { name: 'Pingo', android: {} } });
    expect(out.name).toBe('Pingo');
    expect(out.mods?.android?.gradleProperties).toBeDefined();
  });

  it('replaces any existing reactNativeArchitectures property with the arm-only value', async () => {
    const out = appConfig({ config: { name: 'Pingo', android: {} } });
    const mod = out.mods.android.gradleProperties;
    const result = await mod({
      ...out,
      modResults: [
        { type: 'property', key: 'reactNativeArchitectures', value: 'armeabi-v7a,arm64-v8a,x86,x86_64' },
        { type: 'property', key: 'newArchEnabled', value: 'true' },
      ],
      modRequest: {},
    });
    const arch = result.modResults.filter((i) => i.key === 'reactNativeArchitectures');
    expect(arch).toEqual([{ type: 'property', key: 'reactNativeArchitectures', value: 'armeabi-v7a,arm64-v8a' }]);
    expect(result.modResults.find((i) => i.key === 'newArchEnabled')).toBeDefined();
  });

  describe('REQUEST_INSTALL_PACKAGES permission', () => {
    const prev = process.env.EXPO_PUBLIC_APK_UPDATER;
    const base = { name: 'Pingo', android: { permissions: ['android.permission.CAMERA'] } };

    afterEach(() => {
      if (prev === undefined) delete process.env.EXPO_PUBLIC_APK_UPDATER;
      else process.env.EXPO_PUBLIC_APK_UPDATER = prev;
    });

    it('is added only for the direct-APK build (self-updater on)', () => {
      process.env.EXPO_PUBLIC_APK_UPDATER = '1';
      const out = appConfig({ config: base });
      expect(out.android.permissions).toEqual(['android.permission.CAMERA', 'android.permission.REQUEST_INSTALL_PACKAGES']);
    });

    it('is absent from the Play (.aab) build, which Play restricts', () => {
      delete process.env.EXPO_PUBLIC_APK_UPDATER;
      const out = appConfig({ config: base });
      expect(out.android.permissions).toEqual(['android.permission.CAMERA']);
    });
  });
});
