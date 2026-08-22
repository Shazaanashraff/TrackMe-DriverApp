#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
# On-board roster: dashboard card + dedicated page + hook, all off the boarding endpoint.
test -f src/features/dashboard/OnBoardCard.tsx
test -f src/screens/BoardingRosterScreen.tsx
test -f src/hooks/boarding/index.ts
# card + screen consume the roster hook, not api/fetch directly
grep -q 'useBoardingRosterQuery' src/features/dashboard/OnBoardCard.tsx
grep -q 'useBoardingRosterQuery' src/screens/BoardingRosterScreen.tsx
! grep -REq '(^|[^a-zA-Z])api\.|fetch\(' src/features/dashboard/OnBoardCard.tsx src/screens/BoardingRosterScreen.tsx
# roster endpoint fn wired through the api transport layer + query key registered
grep -q 'getBoardingRoster' src/services/api/boarding.ts
grep -q 'boardingRoster' src/lib/queryKeys.ts
# screen registered in navigation
grep -q 'BoardingRoster' src/navigation/AppNavigator.js
npm run typecheck
npm run lint
npx jest boarding OnBoardCard BoardingRosterScreen || npm test
echo "COMPLETION OK: todo-091 (driver on-board roster)"
