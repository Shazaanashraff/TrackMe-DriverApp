import * as Application from 'expo-application';

// "v1.0.2 (build 5)" — the version a driver reads out when reporting a problem, and the number
// the update check compares against (build = Android versionCode). Either half can be missing
// (web, some dev clients), so degrade rather than print "null".
export function getAppVersionLabel(): string {
  const version = Application.nativeApplicationVersion;
  const build = Application.nativeBuildVersion;
  if (!version && !build) return 'Version unavailable';
  if (!build) return `v${version}`;
  if (!version) return `build ${build}`;
  return `v${version} (build ${build})`;
}
