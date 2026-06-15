#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -q 'module-resolver' babel.config.js
grep -q '"@/\*"' tsconfig.json
for d in src/lib src/app src/services/api src/hooks/auth src/hooks/bus src/hooks/routes \
         src/hooks/earnings src/features/dashboard src/features/earnings \
         src/features/route-management src/features/bus-registration; do
  test -d "$d"
done
npm run typecheck
echo "COMPLETION OK: todo-004"
