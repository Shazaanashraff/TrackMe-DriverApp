#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
test -f src/services/socket.ts
for f in emitLocation startTracking stopTracking onConnectionStateChange; do
  grep -q "$f" src/services/socket.ts
done
grep -q 'connected' src/services/socket.ts
npm run typecheck
echo "COMPLETION OK: todo-017"
