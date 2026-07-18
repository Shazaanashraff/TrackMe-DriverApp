#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -Eq '"expo-camera"' package.json
# a scan feature/screen exists and uses a boarding hook, with no direct api/fetch
S=$(grep -RlEi 'boarding|scan' src/features src/screens 2>/dev/null | head -1)
test -n "$S"
grep -RqiE 'useBoarding|boardingScan|boarding' src
! grep -REq '(^|[^a-zA-Z])api\.|fetch\(' "$S"
npm run typecheck
npm run lint
npx jest boarding || npm test
echo "COMPLETION OK: todo-090 (driver qr scanner)"
