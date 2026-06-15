#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
ls src/hooks/__tests__/useTrackingSession.test.* >/dev/null 2>&1
ls src/hooks/__tests__/useLocationBroadcast.test.* >/dev/null 2>&1
grep -rqiE 'ack|tracking' src/hooks/__tests__/useTrackingSession.test.*
grep -rqiE 'throttle|buffer' src/hooks/__tests__/useLocationBroadcast.test.*
npx jest useTrackingSession useLocationBroadcast
echo "COMPLETION OK: todo-046"
