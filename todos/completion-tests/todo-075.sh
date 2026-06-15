#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -rqiE 'keepAwake|activateKeepAwake' src/features/dashboard src/screens/DriverDashboard.*
grep -rqiE 'confirm|Alert' src/features/dashboard src/screens/DriverDashboard.*
npx jest dashboard
echo "COMPLETION OK: todo-075"
