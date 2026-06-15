#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -rqiE 'Accuracy|minDistance|shouldEmit|adaptive' src/hooks/useLocationBroadcast.ts src/services/location.ts 2>/dev/null
npx jest useLocationBroadcast location 2>/dev/null || npm run test:unit
echo "COMPLETION OK: todo-071"
