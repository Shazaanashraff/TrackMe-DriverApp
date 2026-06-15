#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/hooks/useTrackingSession.ts
grep -Eq 'startTracking|stopTracking' src/hooks/useTrackingSession.ts
grep -Eq "'tracking'|tracking" src/hooks/useTrackingSession.ts
ls src/hooks/__tests__/useTrackingSession.test.* >/dev/null 2>&1
npx jest useTrackingSession
npm run typecheck
echo "COMPLETION OK: todo-018"
