#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/services/__tests__/backendStatus.test.ts
test -f src/services/__tests__/socket.test.ts
grep -q 'subscribeBackendStatus' src/services/__tests__/backendStatus.test.ts
grep -Eq 'emitLocation|startTracking' src/services/__tests__/socket.test.ts
npx jest backendStatus socket
echo "COMPLETION OK: todo-041"
