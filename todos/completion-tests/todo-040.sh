#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/services/api/__tests__/transport.test.ts
grep -q 'timeout' src/services/api/__tests__/transport.test.ts
grep -q 'offline' src/services/api/__tests__/transport.test.ts
grep -qi 'size'  src/services/api/__tests__/transport.test.ts
grep -qi 'code'  src/services/api/__tests__/transport.test.ts
test -f src/services/api/__tests__/authHeaders.test.ts
npx jest src/services/api
echo "COMPLETION OK: todo-040"
