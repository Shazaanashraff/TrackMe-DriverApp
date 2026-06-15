#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/services/api/transport.ts
test -f src/services/api/authHeaders.ts
test -f src/services/api/index.ts
for f in auth bus routes earnings; do test -f "src/services/api/$f.ts"; done
grep -q 'AbortController' src/services/api/transport.ts
grep -Eq 'login|getMyBus|registerBus|getDriverEarningsStats' src/services/api/index.ts
npm run typecheck
npm run test:unit
echo "COMPLETION OK: todo-011"
