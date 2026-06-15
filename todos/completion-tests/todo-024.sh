#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for c in RouteForm RouteList RouteListItem; do
  ls src/features/route-management/$c.* >/dev/null 2>&1
done
S=$(ls src/screens/RouteManagementScreen.* | head -1)
grep -Eq 'useRoutes|useCreateRoute' "$S"
! grep -Eq '(^|[^a-zA-Z])api\.|fetch\(' "$S"
test "$(wc -l < "$S")" -le 250
npx jest route-management
npm run typecheck
npm run lint
echo "COMPLETION OK: todo-024"
