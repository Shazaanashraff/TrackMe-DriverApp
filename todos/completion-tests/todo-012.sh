#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/lib/queryKeys.ts
grep -q 'myBus' src/lib/queryKeys.ts
grep -q 'earningsHistory' src/lib/queryKeys.ts
grep -q 'dailyBreakdown' src/lib/queryKeys.ts
test -f src/lib/__tests__/queryKeys.test.ts
npx jest src/lib/__tests__/queryKeys.test.ts
npm run typecheck
echo "COMPLETION OK: todo-012"
