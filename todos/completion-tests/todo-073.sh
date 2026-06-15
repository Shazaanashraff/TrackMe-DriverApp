#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -rqiE 'buffer|ring|queue' src/hooks src/services
grep -rqiE 'replay' src/hooks src/services
npx jest buffer broadcast 2>/dev/null || npm run test:unit
echo "COMPLETION OK: todo-073"
