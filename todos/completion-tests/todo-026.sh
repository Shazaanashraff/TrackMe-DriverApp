#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
S=$(ls src/screens/TripHistoryScreen.* | head -1)
grep -Eq 'useEarningsHistory|useEarnings' "$S"
grep -q 'ErrorState' "$S"
! grep -Eq '(^|[^a-zA-Z])api\.|fetch\(' "$S"
test "$(wc -l < "$S")" -le 250
npx jest TripHistory
npm run typecheck
npm run lint
echo "COMPLETION OK: todo-026"
