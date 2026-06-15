#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
S=$(ls src/screens/DriverProfileScreen.* | head -1)
grep -Eq 'useMyBusQuery|useLogout' "$S"
! grep -Eq '(^|[^a-zA-Z])api\.|fetch\(' "$S"
npx jest DriverProfile
npm run typecheck
npm run lint
echo "COMPLETION OK: todo-027"
