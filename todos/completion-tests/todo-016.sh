#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for h in useEarningsStatsQuery useEarningsHistoryQuery useDailyBreakdownQuery useRequestPayout; do
  grep -rq "$h" src/hooks/earnings
done
grep -rq "\['earnings'\]" src/hooks/earnings
npx jest src/hooks/earnings
npm run typecheck
echo "COMPLETION OK: todo-016"
