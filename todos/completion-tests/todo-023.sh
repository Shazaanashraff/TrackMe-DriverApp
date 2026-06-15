#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for c in EarningsSummary EarningsHistoryList PayoutRequestForm; do
  ls src/features/earnings/$c.* >/dev/null 2>&1
done
S=$(ls src/screens/DriverEarningsScreen.* | head -1)
grep -Eq 'useEarnings|useRequestPayout|useDailyBreakdown' "$S"
! grep -Eq '(^|[^a-zA-Z])api\.|fetch\(' "$S"
test "$(wc -l < "$S")" -le 250
npx jest earnings
npm run typecheck
npm run lint
echo "COMPLETION OK: todo-023"
