#!/usr/bin/env node
/**
 * check-docs.mjs — documentation staleness check.
 *
 * Warns (does not block, by default) when code changed but the docs that describe it
 * did not. Wired to .githooks/pre-push; also runnable by hand:
 *
 *   node scripts/check-docs.mjs                 # check unpushed commits vs upstream
 *   node scripts/check-docs.mjs --staged        # check staged changes
 *   node scripts/check-docs.mjs --range A..B    # check an explicit git range
 *   node scripts/check-docs.mjs --strict        # exit 1 on findings (block the push)
 *
 * Rules:
 *  1. src/ changed            → docs/CHANGES.md must have an entry in the same range.
 *  2. a module's code changed → that module's docs/modules/<NAME>.md should change too.
 *  3. tests changed           → docs/TESTING_GUIDE.md should change too.
 *
 * Keep the MODULES map in sync when you add a module doc.
 */

import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const staged = args.includes('--staged');
const rangeArg = args.find((a) => a.startsWith('--range'));

function git(...a) {
  try {
    return execFileSync('git', a, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/** Path globs that belong to each module doc. A file may match several. */
const MODULES = [
  { doc: 'docs/LOCATION_TRACKING.md', label: 'location-tracking', match: [
    /^src\/services\/socket\./, /^src\/helpers\/locationUtils/, /^src\/helpers\/geo\./,
    /emitLocation/, /useSocketConnection/,
  ]},
  { doc: 'docs/modules/AUTH.md', label: 'auth', match: [
    /^src\/context\/AuthContext/, /^src\/hooks\/auth\//, /LoginScreen/,
  ]},
  { doc: 'docs/modules/DASHBOARD.md', label: 'dashboard', match: [
    /^src\/screens\/DriverDashboard/, /^src\/features\/dashboard\//,
  ]},
  { doc: 'docs/modules/BOARDING.md', label: 'boarding', match: [
    /^src\/features\/boarding\//, /^src\/hooks\/boarding\//,
    /QRScannerScreen/, /BoardingRosterScreen/,
  ]},
  { doc: 'docs/modules/BUS_REGISTRATION.md', label: 'bus-registration', match: [
    /^src\/features\/bus-registration\//, /^src\/hooks\/bus\//, /BusRegistrationScreen/,
  ]},
  { doc: 'docs/modules/ROUTE_MANAGEMENT.md', label: 'route-management', match: [
    /^src\/features\/route-management\//, /^src\/hooks\/routes\//,
    /RouteManagementScreen/, /CustomRouteRecorder/,
  ]},
  { doc: 'docs/modules/EARNINGS.md', label: 'earnings', match: [
    /^src\/features\/earnings\//, /^src\/hooks\/earnings\//, /DriverEarningsScreen/,
  ]},
  { doc: 'docs/modules/TRIP_HISTORY.md', label: 'trip-history', match: [/TripHistoryScreen/]},
  { doc: 'docs/modules/PROFILE.md', label: 'profile', match: [/DriverProfileScreen/]},
  { doc: 'docs/modules/OFFLINE_STATUS.md', label: 'offline-status', match: [
    /^src\/services\/backendStatus/, /OfflineScreen/, /^src\/lib\/errors\./,
  ]},
];

function changedFiles() {
  if (staged) return git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
  if (rangeArg) {
    const range = rangeArg.includes('=') ? rangeArg.split('=')[1] : args[args.indexOf(rangeArg) + 1];
    return git('diff', '--name-only', range).split('\n').filter(Boolean);
  }
  // Default: everything not yet on the upstream branch.
  const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}');
  if (upstream) return git('diff', '--name-only', `${upstream}...HEAD`).split('\n').filter(Boolean);
  // No upstream (new branch): fall back to the last commit.
  return git('diff', '--name-only', 'HEAD~1...HEAD').split('\n').filter(Boolean);
}

const files = changedFiles();
if (files.length === 0) process.exit(0);

const touched = (re) => files.some((f) => re.test(f));
const changedDoc = (doc) => files.includes(doc);

const srcChanged = files.some((f) => f.startsWith('src/'));
const findings = [];

// Rule 1 — session log
if (srcChanged && !changedDoc('docs/CHANGES.md')) {
  findings.push(
    'docs/CHANGES.md has no entry for this change.\n' +
    '     Add one (template at the top of the file) so the session is on the record.'
  );
}

// Rule 2 — module docs
for (const m of MODULES) {
  const hit = files.find((f) => f.startsWith('src/') || f.startsWith('scripts/')
    ? m.match.some((re) => re.test(f)) : false);
  if (hit && !changedDoc(m.doc)) {
    findings.push(
      `${m.label}: changed ${hit}\n` +
      `     but ${m.doc} was not updated. Refresh its Key files / Contracts / Status.`
    );
  }
}

// Rule 3 — testing guide
if (touched(/__tests__|\.test\.|\.spec\.|^\.maestro\//) && !changedDoc('docs/TESTING_GUIDE.md')) {
  findings.push(
    'tests changed but docs/TESTING_GUIDE.md was not updated.\n' +
    '     Every test needs a traceability row.'
  );
}

if (findings.length === 0) {
  console.log('✓ check-docs: docs look in sync with the code.');
  process.exit(0);
}

const bar = '─'.repeat(68);
console.error(`\n${bar}\n  DOCS CHECK — ${findings.length} thing(s) to look at\n${bar}`);
findings.forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
console.error(
  `${bar}\n` +
  `  Guides: docs/guides/ADDING_A_FEATURE.md · ADDING_A_TEST.md\n` +
  (strict
    ? '  --strict is on: push blocked.\n'
    : '  This is a warning, not a block. Push proceeding.\n') +
  `${bar}\n`
);
process.exit(strict ? 1 : 0);
