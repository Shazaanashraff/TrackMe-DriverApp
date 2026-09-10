/* eslint-env node */
// This suite reads the source tree from disk, so it needs Node globals (`__dirname`) that the
// shared eslint env (jest + browser) does not provide.
//
// The build is edge-to-edge (android/gradle.properties `edgeToEdgeEnabled`), so screens draw
// behind the status and navigation bars. react-native's own SafeAreaView is iOS-only — on Android
// it renders as a plain View and applies no insets at all — so importing it from 'react-native'
// silently lets headers slide under the status bar on every Android device. Only
// react-native-safe-area-context's SafeAreaView works on both platforms.
//
// This is a structural guard rather than a render test: the failure mode is an import, and a
// render test with a mocked provider would not catch someone reaching for the wrong module.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..');
const APP_ENTRY = path.join(__dirname, '..', '..', '..', 'App.js');
const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

function collectSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' || entry.name === 'node_modules' ? [] : collectSourceFiles(full);
    }
    return SOURCE_EXTENSIONS.includes(path.extname(entry.name)) ? [full] : [];
  });
}

describe('safe-area imports', () => {
  it('never imports SafeAreaView from react-native (it is a no-op on Android)', () => {
    const offenders = collectSourceFiles(SRC).filter((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return /import\s*\{[^}]*\bSafeAreaView\b[^}]*\}\s*from\s*['"]react-native['"]/s.test(source);
    });

    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  it('wraps the app in a SafeAreaProvider so insets actually resolve', () => {
    const source = fs.readFileSync(APP_ENTRY, 'utf8');
    expect(source).toMatch(/from\s*['"]react-native-safe-area-context['"]/);
    expect(source).toMatch(/<SafeAreaProvider>/);
  });
});
