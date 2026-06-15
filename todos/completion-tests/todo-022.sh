#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for c in TrackingToggle TrackingStatusCard AssignedBusCard; do
  ls src/features/dashboard/$c.* >/dev/null 2>&1
done
S=$(ls src/screens/DriverDashboard.* | head -1)
grep -q 'useTrackingSession' "$S"
! grep -Eq '(^|[^a-zA-Z])api\.|fetch\(|watchPositionAsync|emitLocation' "$S"
test "$(wc -l < "$S")" -le 250
npx jest dashboard
npm run typecheck
npm run lint
echo "COMPLETION OK: todo-022"
