#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
# either keep-awake (foreground-only) OR background TaskManager
grep -rqiE 'keepAwake|activateKeepAwake' src \
  || grep -rqiE 'startLocationUpdatesAsync|TaskManager' src
npm run typecheck
echo "COMPLETION OK: todo-072"
