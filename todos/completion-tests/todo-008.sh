#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/helpers/locationUtils.ts
test -f src/helpers/__tests__/locationUtils.test.ts
grep -qiE 'distance' src/helpers/locationUtils.ts
grep -qiE 'throttle|shouldEmit' src/helpers/locationUtils.ts
npx jest locationUtils
npm run typecheck
echo "COMPLETION OK: todo-008"
