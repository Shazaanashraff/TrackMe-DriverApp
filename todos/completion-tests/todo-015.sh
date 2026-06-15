#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for h in useRoutesQuery useRoutesManagementQuery useCreateRoute; do grep -rq "$h" src/hooks/routes; done
npx jest src/hooks/routes
npm run typecheck
echo "COMPLETION OK: todo-015"
