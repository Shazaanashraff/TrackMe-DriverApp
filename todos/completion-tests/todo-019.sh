#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/hooks/useLocationBroadcast.ts
grep -Eq 'watchPositionAsync|location' src/hooks/useLocationBroadcast.ts
grep -q 'emitLocation' src/hooks/useLocationBroadcast.ts
grep -Eqi 'buffer|permission' src/hooks/useLocationBroadcast.ts
ls src/hooks/__tests__/useLocationBroadcast.test.* >/dev/null 2>&1
npx jest useLocationBroadcast
npm run typecheck
echo "COMPLETION OK: todo-019"
