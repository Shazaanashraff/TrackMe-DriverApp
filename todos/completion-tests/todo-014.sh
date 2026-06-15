#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for h in useMyBusQuery useRegisterBus useUpdateBus; do grep -rq "$h" src/hooks/bus; done
grep -rq 'myBus' src/hooks/bus
npx jest src/hooks/bus
npm run typecheck
echo "COMPLETION OK: todo-014"
